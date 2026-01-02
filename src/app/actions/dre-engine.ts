import { AccountPlan, BudgetEntry } from '@prisma/client'
import { DreRow } from '@/types/dre'

export function calculateDre(accounts: AccountPlan[], entries: BudgetEntry[]): DreRow[] {
    // 1. Transform to Map
    const accountMap = new Map<string, DreRow>()

    // Initialize rows
    accounts.forEach(acc => {
        accountMap.set(acc.id, {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.type as 'INPUT' | 'CALCULATED',
            formula: acc.formula,
            percentage: acc.percentage,
            baseCode: acc.baseCode,
            parentId: acc.parentId,
            values: Array(12).fill(0),
            children: [],
            level: acc.code.split('.').length - 1
        })
    })

    // 2. Fill Input Values
    entries.forEach(entry => {
        const row = accountMap.get(entry.accountId)
        if (row && row.type === 'INPUT') {
            // entry.month is 1-based, array is 0-based
            const monthIdx = entry.month - 1
            if (monthIdx >= 0 && monthIdx < 12) {
                row.values[monthIdx] += entry.amount
            }
        }
    })

    // 3. Build Tree
    const rootRows: DreRow[] = []
    const allRows = Array.from(accountMap.values())

    allRows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))

    allRows.forEach(row => {
        if (row.parentId) {
            const parent = accountMap.get(row.parentId)
            if (parent) {
                parent.children.push(row)
            }
        } else {
            rootRows.push(row)
        }
    })

    // 4. Calculate Values (Multi-pass)
    // We run multiple passes to resolve dependencies (e.g. Total = A + B, then Profit = Total - Expense)
    // 10 passes is usually enough for standard DRE depth
    for (let pass = 0; pass < 10; pass++) {
        allRows.forEach(row => {
            if (row.type === 'CALCULATED') {
                if (row.formula) {
                    for (let m = 0; m < 12; m++) {
                        const expression = row.formula.replace(/@([\w\.]+)/g, (match, code) => {
                            const targetRow = allRows.find(r => r.code === code)
                            return targetRow ? targetRow.values[m].toString() : '0'
                        })
                        try {
                            // eslint-disable-next-line
                            const result = new Function(`return ${expression}`)()
                            const num = typeof result === 'number' && !isNaN(result) ? result : 0
                            row.values[m] = num
                        } catch (e) {
                            // Silently fail or log in debug?
                            row.values[m] = 0
                        }
                    }
                } else if (row.baseCode && row.percentage !== null && row.percentage !== undefined) {
                    const baseRow = allRows.find(r => r.code === row.baseCode)
                    for (let m = 0; m < 12; m++) {
                        const baseValue = baseRow ? baseRow.values[m] : 0
                        row.values[m] = baseValue * (row.percentage / 100)
                    }
                } else {
                    // Default: Sum of Children
                    for (let m = 0; m < 12; m++) {
                        row.values[m] = row.children.reduce((sum, child) => sum + child.values[m], 0)
                    }
                }
            }
        })
    }

    return rootRows
}
