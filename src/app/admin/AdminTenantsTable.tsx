'use client'

import { TenantWithStats, updateTenantStatus, updateTenantPlan, deleteTenant } from '@/app/actions/admin'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminTenantsTable({ tenants }: { tenants: TenantWithStats[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    // State for Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [tenantToDelete, setTenantToDelete] = useState<{ id: string, name: string } | null>(null)
    const [confirmationName, setConfirmationName] = useState('')

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

    const openDeleteModal = (id: string, name: string) => {
        setTenantToDelete({ id, name })
        setConfirmationName('')
        setDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setDeleteModalOpen(false)
        setTenantToDelete(null)
        setConfirmationName('')
    }

    const handleConfirmDelete = async () => {
        if (!tenantToDelete) return

        if (confirmationName !== tenantToDelete.name) {
            return alert('Nome incorreto. Por favor digite o nome exato da empresa.')
        }

        setLoadingId(tenantToDelete.id)
        closeDeleteModal()

        try {
            await deleteTenant(tenantToDelete.id)
        } catch (e: any) {
            alert('Erro ao excluir: ' + e.message)
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
                        <th className="p-4 font-medium text-right">Ações</th>
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
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                                <div className="text-xs text-[var(--text-secondary)] mr-2">
                                    <div title="Usuários">Users: {tenant._count.users}</div>
                                </div>

                                <button
                                    onClick={() => openDeleteModal(tenant.id, tenant.name)}
                                    disabled={loadingId === tenant.id}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    title="Excluir Empresa Permanentemente"
                                >
                                    {loadingId === tenant.id ? '...' : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                    )}
                                </button>
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

            {deleteModalOpen && tenantToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-surface)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--border-subtle)] overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Excluir Empresa?</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                Esta ação é irreversível. Todos os dados da empresa <strong className="text-[var(--text-primary)]">{tenantToDelete.name}</strong> serão apagados permanentemente.
                            </p>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                    Digite <span className="text-[var(--text-primary)] select-all">{tenantToDelete.name}</span> para confirmar:
                                </label>
                                <input
                                    type="text"
                                    value={confirmationName}
                                    onChange={(e) => setConfirmationName(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/50 focus:border-[var(--danger)]"
                                    placeholder="Digite o nome da empresa aqui"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={confirmationName !== tenantToDelete.name}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Excluir Permanentemente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
