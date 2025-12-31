export type DreRow = {
    id: string
    code: string
    name: string
    type: string // INPUT or CALCULATED
    formula?: string | null
    percentage?: number | null
    baseCode?: string | null
    parentId?: string | null
    values: number[] // 0-11 (Jan-Dec)
    children: DreRow[]
    level: number
}
