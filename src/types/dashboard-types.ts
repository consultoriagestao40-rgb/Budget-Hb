export type DashboardMetric = {
    grossRevenue: number
    grossRevenuePct: number
    netRevenue: number
    netRevenuePct: number
    operationalCosts: number
    operationalCostsPct: number
    grossMargin: number
    grossMarginPct: number
    operationalExpenses: number
    operationalExpensesPct: number
    grossProfit: number
    grossProfitPct: number
    adminExpenses: number
    adminExpensesPct: number
    ebitda: number
    ebitdaPct: number
    financialExpenses: number
    financialExpensesPct: number
    netProfit: number
    netProfitPct: number
    resultPercentage: number
}

export type SummaryRow = {
    id: string
    name: string
    type: 'COMPANY' | 'COST_CENTER'
    metrics: DashboardMetric
    children?: SummaryRow[] // For Company -> CostCenter hierarchy
    debugInfo?: string
}

export type ChartData = {
    revenueByClient: { name: string; value: number; margin: number }[]
    revenueByCompany: { name: string; value: number; percent: number }[]
}
