'use client'

import { useState } from 'react'
import { DashboardMetric, SummaryRow } from '../actions/dashboard'
import { ChevronDown, ChevronRight, Building, Layers } from 'lucide-react'

// Formatters
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
const formatPercent = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100)

type DashboardSummaryProps = {
    data: {
        rows: SummaryRow[]
        total: DashboardMetric
    }
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const toggle = (id: string) => {
        const next = new Set(expanded)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpanded(next)
    }

    // Helper for coloring result
    const getResultColor = (val: number) => {
        if (val > 0) return 'text-emerald-400'
        if (val < 0) return 'text-red-400'
        return 'text-[var(--text-secondary)]'
    }

    return (
        <div className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase text-[var(--text-secondary)] tracking-wider">
                    <div className="col-span-4">Empresa / Centro</div>
                    <div className="col-span-2 text-right">Receita Bruta (Ano)</div>
                    <div className="col-span-2 text-right">Receita Líquida (Ano)</div>
                    <div className="col-span-2 text-right">Custos/Despesas (Ano)</div>
                    <div className="col-span-1 text-right">Resultado (R$)</div>
                    <div className="col-span-1 text-right">Margem (%)</div>
                </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-[var(--border-color)]">
                {data.rows.map(company => (
                    <div key={company.id} className="group transition-colors hover:bg-[var(--hover-bg)]">
                        {/* Company Row */}
                        <div
                            className="grid grid-cols-12 gap-4 px-4 py-4 cursor-pointer items-center"
                            onClick={() => toggle(company.id)}
                        >
                            <div className="col-span-4 flex items-center gap-3">
                                <button className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors">
                                    {expanded.has(company.id) ? (
                                        <ChevronDown size={14} className="text-[var(--text-secondary)]" />
                                    ) : (
                                        <ChevronRight size={14} className="text-[var(--text-secondary)]" />
                                    )}
                                </button>
                                <Building size={16} className="text-[var(--primary)]" />
                                <span className="font-semibold text-[var(--text-primary)]">{company.name}</span>
                            </div>

                            <div className="col-span-2 text-right text-[var(--text-secondary)] font-medium">
                                {formatCurrency(company.metrics.grossRevenue)}
                            </div>
                            <div className="col-span-2 text-right text-[var(--text-primary)] font-medium">
                                {formatCurrency(company.metrics.netRevenue)}
                            </div>
                            <div className="col-span-2 text-right text-[var(--text-secondary)]">
                                {formatCurrency(company.metrics.costsExpenses)}
                            </div>
                            <div className={`col-span-1 text-right font-bold ${getResultColor(company.metrics.result)}`}>
                                {formatCurrency(company.metrics.result)}
                            </div>
                            <div className={`col-span-1 text-right text-xs font-bold ${getResultColor(company.metrics.resultPercentage)}`}>
                                {formatPercent(company.metrics.resultPercentage)}
                            </div>
                        </div>

                        {/* Cost Centers (Children) */}
                        {expanded.has(company.id) && company.children && (
                            <div className="bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)]">
                                {company.children.map(cc => (
                                    <div key={cc.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[var(--border-color)] last:border-0 pl-12 text-sm">
                                        <div className="col-span-4 flex items-center gap-2 text-[var(--text-secondary)]">
                                            <Layers size={14} />
                                            <span>{cc.name}</span>
                                        </div>
                                        <div className="col-span-2 text-right text-[var(--text-tertiary)]">
                                            {formatCurrency(cc.metrics.grossRevenue)}
                                        </div>
                                        <div className="col-span-2 text-right text-[var(--text-secondary)]">
                                            {formatCurrency(cc.metrics.netRevenue)}
                                        </div>
                                        <div className="col-span-2 text-right text-[var(--text-tertiary)]">
                                            {formatCurrency(cc.metrics.costsExpenses)}
                                        </div>
                                        <div className={`col-span-1 text-right font-medium ${getResultColor(cc.metrics.result)}`}>
                                            {formatCurrency(cc.metrics.result)}
                                        </div>
                                        <div className={`col-span-1 text-right text-xs font-medium ${getResultColor(cc.metrics.resultPercentage)}`}>
                                            {formatPercent(cc.metrics.resultPercentage)}
                                        </div>
                                    </div>
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
            <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] px-4 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 font-bold text-[var(--text-primary)] text-lg">
                        Total
                    </div>
                    <div className="col-span-2 text-right font-bold text-[var(--text-secondary)]">
                        {formatCurrency(data.total.grossRevenue)}
                    </div>
                    <div className="col-span-2 text-right font-bold text-[var(--text-primary)]">
                        {formatCurrency(data.total.netRevenue)}
                    </div>
                    <div className="col-span-2 text-right font-bold text-[var(--text-secondary)]">
                        {formatCurrency(data.total.costsExpenses)}
                    </div>
                    <div className={`col-span-1 text-right font-bold ${getResultColor(data.total.result)}`}>
                        {formatCurrency(data.total.result)}
                    </div>
                    <div className={`col-span-1 text-right text-sm font-bold ${getResultColor(data.total.resultPercentage)}`}>
                        {formatPercent(data.total.resultPercentage)}
                    </div>
                </div>
            </div>
        </div>
    )
}
