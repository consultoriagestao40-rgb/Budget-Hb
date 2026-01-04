'use client'

import { ChartData } from '@/types/dashboard-types'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

interface DashboardChartsProps {
    data: ChartData
    showFinancials?: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57']

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val)
const formatPercent = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100)

export function DashboardCharts({ data }: DashboardChartsProps) {
    // Determine data availability
    const hasClientData = data.revenueByClient.length > 0
    const hasCompanyData = data.revenueByCompany.length > 0

    if (!hasClientData && !hasCompanyData) return null

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* 1. Revenue by Client (Bar) */}
            <div className="glass-panel p-6 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Receita por Cliente (Top 10)</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data.revenueByClient}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                            <XAxis type="number" tickFormatter={formatCurrency} stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis type="category" dataKey="name" width={100} stroke="var(--text-secondary)" fontSize={11} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                                formatter={(val: number | undefined) => formatCurrency(val ?? 0)}
                            />
                            <Bar dataKey="value" name="Receita" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Contribution Margin by Client (Bar) */}
            <div className="glass-panel p-6 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Margem de Contribuição por Cliente</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data.revenueByClient} // Same data, different key
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                            <XAxis type="number" tickFormatter={formatCurrency} stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis type="category" dataKey="name" width={100} stroke="var(--text-secondary)" fontSize={11} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                                formatter={(val: number | undefined) => formatCurrency(val ?? 0)}
                            />
                            <Bar dataKey="margin" name="Margem" fill="var(--success)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Revenue by Company (Donut) */}
            <div className="glass-panel p-6 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Receita por Empresa</h3>
                <div className="flex-1 min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.revenueByCompany}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.revenueByCompany.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--bg-surface)" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                                formatter={(val: number | undefined) => formatCurrency(val ?? 0)}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                formatter={(value, entry: any) => <span className="text-xs text-[var(--text-secondary)] ml-1">{value} ({formatPercent(entry.payload.percent)})</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text specific logic removed for simplicity, tooltip handles it */}
                </div>
            </div>
        </div>
    )
}
