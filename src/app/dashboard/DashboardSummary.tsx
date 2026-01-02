'use client'

import { useState, useEffect } from 'react'
import { DashboardMetric, SummaryRow } from '../actions/dashboard'
import { ChevronDown, ChevronRight, Building, Layers } from 'lucide-react'
import { useSidebarStore } from '@/store/sidebarStore'

// Formatters
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
const formatPercent = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100)

type DashboardSummaryProps = {
    data: {
        rows: SummaryRow[]
        total: DashboardMetric
    }
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const { isCollapsed } = useSidebarStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const toggle = (id: string) => {
        const next = new Set(expanded)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpanded(next)
    }

    // Dynamic sizing to match DRE layout
    const sidebarWidth = isCollapsed ? 80 : 260
    const padding = 48 // Approx padding from layout
    const buffer = 20
    // Prevent hydration mismatch by defaulting to specific width or handling mount
    const maxWidth = mounted ? `calc(100vw - ${sidebarWidth + padding + buffer}px)` : '100%'

    // Helper for coloring result
    const getColor = (val: number) => {
        if (val > 0) return 'text-emerald-500'
        if (val < 0) return 'text-red-500'
        return 'text-[var(--text-secondary)]' // Zero
    }

    // Cell Render Helper: [Value] [Percent]
    const Cell = ({ value, percent, bold = false, colorValue = false, hidePercent = false }: { value: number, percent?: number, bold?: boolean, colorValue?: boolean, hidePercent?: boolean }) => (
        <div className="flex items-center justify-end gap-2 min-w-[140px]">
            <span className={`text-right w-24 ${bold ? 'font-bold' : 'font-medium'} ${colorValue ? getColor(value) : 'text-[var(--text-primary)]'}`}>
                {formatCurrency(value)}
            </span>
            {!hidePercent && percent !== undefined && (
                <span className={`text-xs w-12 text-right ${getColor(percent)}`}>
                    {formatPercent(percent)}
                </span>
            )}
            {hidePercent && <span className="w-12" />} {/* Spacer to keep alignment */}
        </div>
    )

    const TableRow = ({ name, metrics, depth = 0, hasChildren = false, isExpanded = false, onToggle, debugInfo }: { name: string, metrics: DashboardMetric, depth?: number, hasChildren?: boolean, isExpanded?: boolean, onToggle?: () => void, debugInfo?: string }) => {
        return (
            <div className={`grid grid-cols-[300px_repeat(10,minmax(160px,1fr))] gap-4 py-3 px-4 border-b border-[var(--border-color)] items-center hover:bg-[var(--bg-surface-hover)] transition-colors min-w-max ${depth > 0 ? 'bg-[var(--bg-secondary)]/30' : ''}`}>

                {/* Name / Tree Toggle (Sticky Left) */}
                <div
                    className={`flex items-center gap-2 overflow-hidden sticky left-0 z-10 pl-4 py-3 -ml-4 -my-3 border-r border-[var(--border-color)]`}
                    style={{
                        paddingLeft: `${16 + (depth * 20)}px`,
                        backgroundColor: depth > 0 ? 'var(--bg-main)' : 'var(--bg-surface)'
                    }}
                >
                    {hasChildren ? (
                        <button onClick={onToggle} className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors shrink-0">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <span className="w-6 shrink-0" />
                    )}
                    {depth === 0 ? <Building size={16} className="text-[var(--primary)] shrink-0" /> : <Layers size={14} className="text-[var(--text-secondary)] shrink-0" />}
                    <span className="font-semibold text-[var(--text-primary)] truncate" title={debugInfo || name}>{name}</span>
                </div>

                {/* Columns (Value Left | Percent Right) */}
                {/* 1. Rec Bruta: Hide Percent (Always 100%) */}
                <Cell value={metrics.grossRevenue} percent={metrics.grossRevenuePct} hidePercent={true} />

                <Cell value={metrics.netRevenue} percent={metrics.netRevenuePct} />
                <Cell value={metrics.operationalCosts} percent={metrics.operationalCostsPct} />
                <Cell value={metrics.grossMargin} percent={metrics.grossMarginPct} bold />
                <Cell value={metrics.operationalExpenses} percent={metrics.operationalExpensesPct} />
                <Cell value={metrics.grossProfit} percent={metrics.grossProfitPct} bold colorValue />
                <Cell value={metrics.adminExpenses} percent={metrics.adminExpensesPct} />
                <Cell value={metrics.ebitda} percent={metrics.ebitdaPct} bold />
                <Cell value={metrics.financialExpenses} percent={metrics.financialExpensesPct} />
                <Cell value={metrics.netProfit} percent={metrics.netProfitPct} bold colorValue />
            </div>
        )
    }

    return (
        <div
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col"
            style={{ maxWidth }}
        >
            <div className="overflow-x-auto pb-2 scrollbar-thin"> {/* Added pb-2 for scrollbar spacing */}
                <div className="min-w-max">
                    {/* Header */}
                    <div className="grid grid-cols-[300px_repeat(10,minmax(160px,1fr))] gap-4 px-4 py-3 bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider">
                        <div className="sticky left-0 z-20 bg-[var(--bg-surface-hover)] -ml-4 pl-8 py-3 -my-3 border-r border-[var(--border-color)] flex items-center">Empresa / Centro</div>
                        <div className="text-right pr-4">Rec. Bruta</div>
                        <div className="text-right pr-4">Rec. Líquida</div>
                        <div className="text-right pr-4">Custos Op.</div>
                        <div className="text-right pr-4">Margem Bruta</div>
                        <div className="text-right pr-4">Desp. Op.</div>
                        <div className="text-right pr-4">Lucro Bruto</div>
                        <div className="text-right pr-4">Desp. Adm.</div>
                        <div className="text-right pr-4">EBITDA</div>
                        <div className="text-right pr-4">Desp. Fin.</div>
                        <div className="text-right pr-4">Lucro Líq.</div>
                    </div>

                    {/* Body */}
                    <div>
                        {data.rows.map(company => (
                            <div key={company.id}>
                                <TableRow
                                    name={company.name}
                                    metrics={company.metrics}
                                    hasChildren={!!company.children?.length}
                                    isExpanded={expanded.has(company.id)}
                                    onToggle={() => toggle(company.id)}
                                    debugInfo={company.debugInfo}
                                />

                                {expanded.has(company.id) && company.children && (
                                    <div>
                                        {company.children.map(cc => (
                                            <TableRow
                                                key={cc.id}
                                                name={cc.name}
                                                metrics={cc.metrics}
                                                depth={1}
                                                hasChildren={false}
                                            />
                                        ))}
                                        {company.children.length === 0 && (
                                            <div className="px-12 py-3 text-xs text-[var(--text-tertiary)] italic">
                                                Nenhum centro de custo com movimento.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {data.rows.length === 0 && (
                            <div className="p-8 text-center text-[var(--text-secondary)]">
                                Nenhum dado encontrado para o período selecionado.
                            </div>
                        )}
                    </div>

                    {/* Footer / Total */}
                    <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
                        <TableRow name="Total" metrics={data.total} />
                    </div>
                </div>
            </div>
        </div>
    )
}
