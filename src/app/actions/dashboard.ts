'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

// Types for the dashboard summary
export type DashboardMetric = {
    grossRevenue: number
    netRevenue: number
    costsExpenses: number
    result: number
    resultPercentage: number
}

export type SummaryRow = {
    id: string
    name: string
    type: 'COMPANY' | 'COST_CENTER'
    metrics: DashboardMetric
    children?: SummaryRow[] // For Company -> CostCenter hierarchy
}

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

    // 1. Fetch Key Account IDs by Name (Heuristic)
    // We assume standard names roughly matching normal DREs
    const accounts = await prisma.accountPlan.findMany({
        where: { tenantId },
        select: { id: true, name: true, code: true }
    })

    const findAccountId = (terms: string[]) => {
        const acc = accounts.find(a => terms.some(t => a.name.toUpperCase().includes(t)))
        return acc?.id
    }

    const grossRevId = findAccountId(['RECEITA BRUTA', 'RECEITAS OPERACIONAIS', 'RECEITA TOTAL'])
    const netRevId = findAccountId(['RECEITA LÍQUIDA', 'RECEITA LIQUIDA'])
    const resultId = findAccountId(['RESULTADO DO EXERCÍCIO', 'RESULTADO DO EXERCICIO', 'LUCRO/PREJUÍZO', 'RESULTADO LÍQUIDO'])

    // Note: Costs/Expenses is usually derived: Net Revenue - Result (Simplified)
    // Or we can try to find "CUSTOS" and "DESPESAS" separately and sum them if needed.
    // Let's use the derived approach for simplicity and consistency with the "Result" equation: Result = Revenue - Costs
    // So Costs = Revenue - Result.

    // 2. Fetch Aggregated Budget Entries
    // We fetch raw entries for these specific accounts (if Input) OR we calculate?
    // Wait, DRE lines are often formulae. We cannot just sum entries for "Result" if "Result" is a calculation.
    // PROPER APPROACH: We must use the DRE Engine logic but limit it to specific groupings.
    // Since we need to calculate this for EVERY Cost Center, running the full DRE engine 100 times is heavy.
    // OPTIMIZATION:
    // 1. Fetch ALL entries for the year.
    // 2. Build a mapping of Account -> Values for each Company/CostCenter combination.
    // 3. Resolve the formulas for the 3 target lines (Gross, Net, Result).

    // Let's implement the localized DRE Engine.

    // Fetch Accounts with Formulas
    const accountPlan = await prisma.accountPlan.findMany({
        where: { tenantId },
        orderBy: { code: 'asc' }
    })

    const entries = await prisma.budgetEntry.findMany({
        where: {
            tenantId,
            year,
            ...(versionId ? { budgetVersionId: versionId } : {})
        }
    })

    const companies = await prisma.company.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
    })

    const costCenters = await prisma.costCenter.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
    })

    // Data Structure: Map<Key, Map<AccountId, number>> where Key is `${companyId}:${costCenterId}`
    const calculator = new Map<string, Map<string, number>>()

    const getKey = (cId: string | null, ccId: string | null) => `${cId || 'none'}:${ccId || 'none'}`

    // Initialize Calculator
    companies.forEach(c => {
        // We'll calculate for Company Total
        // And also for each Cost Center under it
        const cCenters = costCenters.filter(cc => cc.clientId === c.id || true) // Relationship? Assuming generic for now, wait.
        // BudgetEntry has both companyId and costCenterId.
    })

    // Populate Inputs
    entries.forEach(entry => {
        const val = entry.amount
        const key = getKey(entry.companyId, entry.costCenterId)

        if (!calculator.has(key)) calculator.set(key, new Map())
        const store = calculator.get(key)!

        const accId = entry.accountId
        store.set(accId, (store.get(accId) || 0) + val)
    })

    // Formula Solver Function
    const solve = (accId: string | undefined, store: Map<string, number>, visited = new Set<string>()): number => {
        if (!accId) return 0
        if (visited.has(accId)) return 0 // Loop prevention
        visited.add(accId)

        if (store.has(accId) && !accountPlan.find(a => a.id === accId)?.formula) {
            return store.get(accId)!
        }

        const account = accountPlan.find(a => a.id === accId)
        if (!account) return 0

        // If it's INPUT type but not in store, it's 0
        if (account.type === 'INPUT') return store.get(accId) || 0

        // CALCULATED
        if (account.formula) {
            // Replace @code with value
            let formula = account.formula
            // We need to resolve codes to IDs first or search by code
            // Optimization: Map Code -> ID
            // Simple regex replacement:
            const expression = formula.replace(/@([\w\.]+)/g, (match, code) => {
                const targetAcc = accountPlan.find(a => a.code === code)
                return solve(targetAcc?.id, store, new Set(visited)).toString()
            })

            try {
                // eslint-disable-next-line
                const result = new Function(`return ${expression}`)()
                const num = typeof result === 'number' && !isNaN(result) ? result : 0
                store.set(accId, num) // Memoize for this specific store
                return num
            } catch (e) {
                return 0
            }
        }

        // Sum Children (Default)
        const children = accountPlan.filter(a => a.parentId === accId)
        if (children.length > 0) {
            const sum = children.reduce((acc, child) => acc + solve(child.id, store, new Set(visited)), 0)
            store.set(accId, sum)
            return sum
        }

        return 0
    }

    // Build Output Tree
    const resultRows: SummaryRow[] = []

    // Helper to calc metrics for a specific filter
    const getMetrics = (filter: (e: any) => boolean): DashboardMetric => {
        // Create a temporary store aggregating matching entries
        const tempStore = new Map<string, number>()
        entries.filter(filter).forEach(e => {
            tempStore.set(e.accountId, (tempStore.get(e.accountId) || 0) + e.amount)
        })

        const gross = solve(grossRevId, tempStore)
        const net = solve(netRevId, tempStore)
        const res = solve(resultId, tempStore)

        // Costs = Net - Result (Assuming Result = Net - Costs) or Gross - Result?
        // Usually DRE: Gross -> Net -> Gross Profit -> Operating Result -> Net Result
        // If "Result" is the bottom line, then Total Costs/Exp = Net Revenue - Result
        // If Result is negative (Loss), say Net=100, Result=-10. Costs = 100 - (-10) = 110. Correct.
        const costs = net - res

        return {
            grossRevenue: gross,
            netRevenue: net,
            costsExpenses: costs,
            result: res,
            resultPercentage: net !== 0 ? (res / net) * 100 : 0
        }
    }

    // Iterate Companies
    for (const company of companies) {
        // 1. Metrics for Company Total
        const companyMetrics = getMetrics(e => e.companyId === company.id)

        // 2. Metrics for Cost Centers within this Company
        // We find CCs that have entries for this company
        // Or checking all Cost Centers? Let's check CCs with actual data to avoid empty rows
        const activeCCIds = new Set(entries.filter(e => e.companyId === company.id).map(e => e.costCenterId))
        const companyCCs = costCenters.filter(cc => activeCCIds.has(cc.id))

        const childrenRows: SummaryRow[] = []
        for (const cc of companyCCs) {
            childrenRows.push({
                id: cc.id,
                name: cc.name,
                type: 'COST_CENTER',
                metrics: getMetrics(e => e.companyId === company.id && e.costCenterId === cc.id)
            })
        }

        resultRows.push({
            id: company.id,
            name: company.name,
            type: 'COMPANY',
            metrics: companyMetrics,
            children: childrenRows
        })
    }

    // Calculate Grand Total
    const totalMetrics = getMetrics(() => true)

    return {
        rows: resultRows,
        total: totalMetrics
    }
}
