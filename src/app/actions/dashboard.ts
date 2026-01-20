'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { calculateDre } from './dre-engine'
import { DreRow } from '@/types/dre'
import { DashboardMetric, SummaryRow } from '@/types/dashboard-types'



async function getSession() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.tenantId) {
        throw new Error('Unauthorized')
    }
    return session
}

export async function getDashboardSummary(year: number, versionId?: string) {
    const session = await getSession()
    const tenantId = session.tenantId

    // 0. Fetch User Permissions
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            permissions: {
                select: {
                    companyId: true,
                    costCenterId: true,
                    canView: true
                }
            }
        }
    })
    const permissions = user?.permissions || []
    const allowedCompanyIds = permissions.filter(p => p.companyId).map(p => p.companyId!)
    const allowedCostCenterIds = permissions.filter(p => p.costCenterId).map(p => p.costCenterId!)

    // Filter Logic
    const companyWhere: any = { tenantId }
    if (allowedCompanyIds.length > 0) companyWhere.id = { in: allowedCompanyIds }

    const costCenterWhere: any = { tenantId }
    if (allowedCostCenterIds.length > 0) costCenterWhere.id = { in: allowedCostCenterIds }

    // Resolve Implicit Permissions (Departments of Allowed Companies)
    let allowedGroupingIds: string[] = []
    if (allowedCompanyIds.length > 0) {
        const ag = await prisma.grouping.findMany({
            where: { tenantId, companyId: { in: allowedCompanyIds } },
            select: { id: true }
        })
        allowedGroupingIds = ag.map(g => g.id)
    }

    const entryWhere: any = {
        tenantId,
        year,
        ...(versionId ? { budgetVersionId: versionId } : {})
    }

    // Apply Permissions (Company OR Cost Center OR Department)
    const hasRestrictions = allowedCompanyIds.length > 0 || allowedCostCenterIds.length > 0
    if (hasRestrictions) {
        entryWhere.OR = []
        if (allowedCompanyIds.length > 0) entryWhere.OR.push({ companyId: { in: allowedCompanyIds } })
        if (allowedCostCenterIds.length > 0) entryWhere.OR.push({ costCenterId: { in: allowedCostCenterIds } })
        if (allowedGroupingIds.length > 0) entryWhere.OR.push({ groupingId: { in: allowedGroupingIds } })
    } else if (session.role !== 'ADMIN') {
        // Non-admin with no permissions -> Deny All
        entryWhere.id = 'NO_ACCESS'
    }

    // 1. Fetch Data with Filters
    const [accountPlan, entries, companies, costCenters, groupings] = await Promise.all([
        prisma.accountPlan.findMany({ where: { tenantId }, orderBy: { code: 'asc' } }),
        prisma.budgetEntry.findMany({ where: entryWhere }),
        prisma.company.findMany({ where: companyWhere, orderBy: { name: 'asc' } }),
        prisma.costCenter.findMany({ where: costCenterWhere, orderBy: { name: 'asc' } }),
        prisma.grouping.findMany({ where: { tenantId } }) // Fetch Departments to resolve CC ownership
    ])

    // Helper: Map CostCenter -> Company (via Department)
    // This handles cases where BudgetEntry.companyId might be inconsistent but CC is correct
    const ccToCompanyMap = new Map<string, string>()
    const deptToCompanyMap = new Map<string, string>() // New Map for Departments

    costCenters.forEach(cc => {
        if (cc.groupingId) {
            const dept = groupings.find(g => g.id === cc.groupingId)
            if (dept && dept.companyId) {
                ccToCompanyMap.set(cc.id, dept.companyId)
            }
        }
    })

    groupings.forEach(g => {
        if (g.companyId) {
            deptToCompanyMap.set(g.id, g.companyId)
        }
    })






    // Helper to extract specific DRE line values from the Full Calculated Tree
    const extractMetrics = (rows: DreRow[]): DashboardMetric => {
        // Flatten the tree to search easily
        const flatRows: DreRow[] = []
        const traverse = (nodes: DreRow[]) => {
            for (const node of nodes) {
                flatRows.push(node)
                if (node.children) traverse(node.children)
            }
        }
        traverse(rows)

        // Find rows by Code (1, 3, 4, etc.)
        const findVal = (code: string) => {
            // Find EXACT code match
            // The row.values is an array of 12 months. We need the YEAR TOTAL.
            const row = flatRows.find(r => r.code === code)
            if (!row) return 0
            return row.values.reduce((a, b) => a + b, 0)
        }

        const grossRevenue = findVal('1')
        const netRevenue = findVal('3')
        const operationalCosts = findVal('4')
        const grossMargin = findVal('5')
        const operationalExpenses = findVal('6')
        const grossProfit = findVal('7')
        const adminExpenses = findVal('8')
        const ebitda = findVal('9')
        const financialExpenses = findVal('10')
        const netProfit = findVal('11')

        // Vertical Analysis Helper (Base: Gross Revenue)
        const calcPct = (val: number) => grossRevenue !== 0 ? (val / grossRevenue) * 100 : 0

        const grossRevenuePct = grossRevenue !== 0 ? 100 : 0

        return {
            grossRevenue,
            grossRevenuePct,
            netRevenue,
            netRevenuePct: calcPct(netRevenue),
            operationalCosts,
            operationalCostsPct: calcPct(operationalCosts),
            grossMargin,
            grossMarginPct: calcPct(grossMargin),
            operationalExpenses,
            operationalExpensesPct: calcPct(operationalExpenses),
            grossProfit,
            grossProfitPct: calcPct(grossProfit),
            adminExpenses,
            adminExpensesPct: calcPct(adminExpenses),
            ebitda,
            ebitdaPct: calcPct(ebitda),
            financialExpenses,
            financialExpensesPct: calcPct(financialExpenses),
            netProfit,
            netProfitPct: calcPct(netProfit),

            resultPercentage: netRevenue !== 0 ? (netProfit / netRevenue) * 100 : 0
        }
    }

    // 2. Build Hierarchy & Calculate
    const resultRows: SummaryRow[] = []

    for (const company of companies) {
        // Filter entries for this company (Robust check: Direct ID, Relation via CC, or Relation via Dept)
        // Filter entries for this company using STRICT Hierarchy Precedence
        // We only include an entry if its ULTIMATE owner is this company.
        // Priority: Cost Center's Company > Department's Company > Entry's Company
        const companyEntries = entries.filter(e => {
            let effectiveCompanyId = e.companyId

            if (e.costCenterId && ccToCompanyMap.has(e.costCenterId)) {
                effectiveCompanyId = ccToCompanyMap.get(e.costCenterId)!
            } else if (e.groupingId && deptToCompanyMap.has(e.groupingId)) {
                effectiveCompanyId = deptToCompanyMap.get(e.groupingId)!
            }

            return effectiveCompanyId === company.id
        })

        // Run DRE Engine
        const companyDre = calculateDre(accountPlan, companyEntries)
        const companyMetrics = extractMetrics(companyDre)

        // B. Cost Centers (Children)
        const childrenRows: SummaryRow[] = []
        const relevantCCs = costCenters // Filter by relation if needed, but budgetEntry check is sufficient for active ones

        // Optimization: Only process CCs that have entries for this company?
        // Actually, Cost Centers might belong to the company via `grouping` -> `company`.
        // But entries explicitly link companyId and costCenterId.
        // Let's iterate all cost centers that actually have data first, to avoid 100 empty runs?
        // Or iterate ALL cost centers if the user wants to see them even if empty?
        // Dashboard usually shows active ones. Let's filter by "Has Entries" OR "Linked to Company".
        // To be safe and consistent with previous logic:
        // Find CCs active in this company's entries:
        const activeCCIds = new Set(companyEntries.map(e => e.costCenterId).filter(id => id !== null) as string[])

        const companyCCs = costCenters.filter(cc => {
            if (!activeCCIds.has(cc.id)) return false

            // Strict Hierarchy Check: If CC has a known owner company, it MUST match
            if (ccToCompanyMap.has(cc.id)) {
                return ccToCompanyMap.get(cc.id) === company.id
            }
            return true // Fallback for orphans (assume they belong if their entries ended up here)
        })

        for (const cc of companyCCs) {
            const ccEntries = companyEntries.filter(e => e.costCenterId === cc.id)
            const ccDre = calculateDre(accountPlan, ccEntries)

            childrenRows.push({
                id: cc.id,
                name: cc.name,
                type: 'COST_CENTER',
                metrics: extractMetrics(ccDre)
            })
        }

        resultRows.push({
            id: company.id,
            name: company.name,
            type: 'COMPANY',
            metrics: companyMetrics,
            children: childrenRows,
            debugInfo: `Entries: ${companyEntries.length}, CCs: ${companyCCs.length}`
        })
    }

    // 3. Grand Total
    const totalDre = calculateDre(accountPlan, entries)
    const totalMetrics = extractMetrics(totalDre)

    return {
        rows: resultRows,
        total: totalMetrics
    }
}

// Helper to calculate Contribution Margin and Revenue for Charts
export async function getDashboardChartsData(year: number, versionId?: string) {
    const session = await getSession()
    const tenantId = session.tenantId

    // 1. Fetch User Permissions (Same as summary)
    // For simplicity, we reuse the robust logic if possible, or re-implement lightweight version
    // Let's re-implement lightweight permission check for charts
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { permissions: { select: { companyId: true, costCenterId: true, canView: true } } }
    })
    const permissions = user?.permissions || []
    const allowedCompanyIds = permissions.filter(p => p.companyId).map(p => p.companyId!)

    // Filter conditions
    const entryWhere: any = {
        tenantId,
        year,
        ...(versionId ? { budgetVersionId: versionId } : {})
    }

    if (allowedCompanyIds.length > 0) {
        // Simple permission: Only filter by Company for charts for now to avoid complexity overload
        // Or if user strictly wants client data, we must respect CC permissions too?
        // Let's assume Charts show data for Allowed Companies.
        entryWhere.OR = [
            { companyId: { in: allowedCompanyIds } },
            // Include Implicit logic? Charts are high level. Let's keep strict company for now or match summary.
            // Matching Summary Logic (Company OR Grouping OR CC)
            { grouping: { companyId: { in: allowedCompanyIds } } },
            { costCenter: { grouping: { companyId: { in: allowedCompanyIds } } } }
        ]
    } else if (session.role !== 'ADMIN') {
        return { revenueByClient: [], revenueByCompany: [] }
    }

    // 2. Fetch Entries and Related Data
    const [entries, clients, companies, costCenters, groupings] = await Promise.all([
        prisma.budgetEntry.findMany({
            where: entryWhere,
            include: {
                account: true,
                company: true,
                client: true,
                costCenter: { include: { client: true } }
            }
        }),
        prisma.client.findMany({ where: { tenantId } }),
        prisma.company.findMany({ where: { tenantId } }),
        prisma.costCenter.findMany({ where: { tenantId } }),
        prisma.grouping.findMany({ where: { tenantId } })
    ])

    // Helper Maps (Same as Summary)
    const ccToCompanyMap = new Map<string, string>()
    const deptToCompanyMap = new Map<string, string>()

    costCenters.forEach(cc => {
        if (cc.groupingId) {
            const dept = groupings.find(g => g.id === cc.groupingId)
            if (dept && dept.companyId) {
                ccToCompanyMap.set(cc.id, dept.companyId)
            }
        }
    })

    groupings.forEach(g => {
        if (g.companyId) {
            deptToCompanyMap.set(g.id, g.companyId)
        }
    })

    // 3. Aggregate By Client
    // We need "Gross Revenue" (Code 1) and "Gross Margin" (Code 5)
    // But Code 5 is Calculated. We need to Simulate the DRE for each client.
    // Simplifying: Revenue = Sum of entries with Account Code starts with "1"
    // Contribution Margin = (Revenue - Variable Costs). 
    // In strict DRE: Code 5 = Code 3 - Code 4. 
    // Code 3 (Net Rev) = Code 1 - Code 2.
    // So Margin = Code 1 - Code 2 - Code 4.

    // Let's map Account Codes to simple buckets
    const clientMap = new Map<string, { revenue: number, costs: number, deductions: number }>()

    // Init with all clients to show even zeros? No, only active.

    entries.forEach(e => {
        // Resolve Client: Direct OR via Cost Center
        const effectiveClientId = e.clientId || e.costCenter?.clientId

        if (!effectiveClientId) return // Ignore entries without client

        const code = e.account.code
        const val = e.amount
        const clientId = effectiveClientId

        if (!clientMap.has(clientId)) clientMap.set(clientId, { revenue: 0, costs: 0, deductions: 0 })
        const curr = clientMap.get(clientId)!

        // Logic based on Standard Account Plan Codes
        if (code.startsWith('1')) curr.revenue += val
        else if (code.startsWith('2')) curr.deductions += val
        else if (code.startsWith('4')) curr.costs += val
    })

    const revenueByClient = Array.from(clientMap.entries()).map(([id, stats]) => {
        const client = clients.find(c => c.id === id)
        const netRevenue = stats.revenue - stats.deductions // Sign convention? Usually deductions are negative in input?
        // In this system, verify if inputs for expenses are positive or negative?
        // Usually, DRE inputs are positive numbers, and formulas subtract.
        // Formula for 3 (Net Rev) = @1 - @2. So 2 is positive.
        // Formula for 5 (Gross Margin) = @3 - @4. So 4 is positive.

        const margin = stats.revenue - stats.deductions - stats.costs

        return {
            name: client?.name || 'Desconhecido',
            value: stats.revenue,
            margin: margin
        }
    })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10

    // 4. Aggregate By Company (Donut)
    // Revenue Only (Code 1)
    const companyMap = new Map<string, number>()

    entries.forEach(e => {
        // Resolve Effective Company
        let effectiveCompanyId = e.companyId

        if (e.costCenterId && ccToCompanyMap.has(e.costCenterId)) {
            effectiveCompanyId = ccToCompanyMap.get(e.costCenterId)!
        } else if (e.groupingId && deptToCompanyMap.has(e.groupingId)) {
            effectiveCompanyId = deptToCompanyMap.get(e.groupingId)!
        }

        if (!effectiveCompanyId) return

        const code = e.account.code
        if (code.startsWith('1')) {
            const existing = companyMap.get(effectiveCompanyId) || 0
            companyMap.set(effectiveCompanyId, existing + e.amount)
        }
    })

    const totalRevenue = Array.from(companyMap.values()).reduce((a, b) => a + b, 0)

    const revenueByCompany = Array.from(companyMap.entries()).map(([id, val]) => {
        const company = companies.find(c => c.id === id)
        return {
            name: company?.name || 'Desconhecida',
            value: val,
            percent: totalRevenue > 0 ? (val / totalRevenue) * 100 : 0
        }
    }).sort((a, b) => b.value - a.value)

    return {
        revenueByClient,
        revenueByCompany
    }
}
