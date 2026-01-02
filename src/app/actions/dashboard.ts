'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { calculateDre } from '../../lib/dre-engine'
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
        include: { permissions: true }
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
        const companyEntries = entries.filter(e => {
            if (e.companyId === company.id) return true
            if (e.costCenterId && ccToCompanyMap.get(e.costCenterId) === company.id) return true
            if (e.groupingId && deptToCompanyMap.get(e.groupingId) === company.id) return true
            return false
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

        const companyCCs = costCenters.filter(cc => activeCCIds.has(cc.id))

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
