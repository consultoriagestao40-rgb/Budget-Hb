'use client'

import { TenantWithStats, updateTenantStatus, updateTenantPlan } from '@/app/actions/admin'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminTenantsTable({ tenants }: { tenants: TenantWithStats[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const router = useRouter()

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (!confirm(`Confirmar alteração de status para ${newStatus}?`)) return
        setLoadingId(id)
        try {
            await updateTenantStatus(id, newStatus)
        } catch (e) {
            alert('Erro ao atualizar status')
        } finally {
            setLoadingId(null)
        }
    }

    const handlePlanChange = async (id: string, newPlan: string) => {
        if (!confirm(`Confirmar alteração de plano para ${newPlan}?`)) return
        setLoadingId(id)
        try {
            await updateTenantPlan(id, newPlan)
        } catch (e) {
            alert('Erro ao atualizar plano')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
                    <tr>
                        <th className="p-4 font-medium">Empresa</th>
                        <th className="p-4 font-medium">Contato</th>
                        <th className="p-4 font-medium">Plano</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Stats</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                    {tenants.map(tenant => (
                        <tr key={tenant.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="p-4">
                                <div className="font-medium text-[var(--text-primary)]">{tenant.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">Criado em: {new Date(tenant.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-[var(--text-primary)]">{tenant.ownerName || '-'}</div>
                                <div className="text-xs text-[var(--text-muted)]">{tenant.ownerEmail || '-'}</div>
                            </td>
                            <td className="p-4">
                                <select
                                    value={tenant.plan}
                                    onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                                    disabled={loadingId === tenant.id}
                                    className="select-sm bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded text-xs"
                                >
                                    <option value="FREE">Free</option>
                                    <option value="PRO">Pro</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </td>
                            <td className="p-4">
                                <select
                                    value={tenant.status}
                                    onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                                    disabled={loadingId === tenant.id}
                                    className={`select-sm border border-[var(--border-subtle)] rounded text-xs font-bold
                                        ${tenant.status === 'ACTIVE' ? 'text-green-500 bg-green-500/10' :
                                            tenant.status === 'BLOCKED' ? 'text-red-500 bg-red-500/10' :
                                                'text-orange-500 bg-orange-500/10'}
                                    `}
                                >
                                    <option value="ACTIVE">ATIVO</option>
                                    <option value="BLOCKED">BLOQUEADO</option>
                                    <option value="TRIAL">TRIAL</option>
                                </select>
                            </td>
                            <td className="p-4 text-right text-xs text-[var(--text-secondary)]">
                                <div>Available Users: {tenant._count.users}</div>
                                <div>Companies: {tenant._count.companies}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {tenants.length === 0 && (
                <div className="p-8 text-center text-[var(--text-muted)]">
                    Nenhuma empresa encontrada.
                </div>
            )}
        </div>
    )
}
