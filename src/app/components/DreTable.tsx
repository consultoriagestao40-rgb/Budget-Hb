'use client'
// Reload trigger for calculation logic

import { useState } from 'react'
import type { DreRow } from '@/types/dre'
import { batchUpdateBudgetEntries } from '@/app/actions/budget'
import { createAccount, deleteAccount, updateAccount } from '@/app/actions/account'
import { Modal } from './Modal'
import { ConfirmationModal } from './ConfirmationModal'
import { BudgetEditModal } from './BudgetEditModal'

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

export function DreTable({ initialData, tenantId, year, availableCompanies, filters = {}, activeVersionId, userRole, userPermissions }: {
    initialData: DreRow[],
    tenantId: string,
    year: number,
    availableCompanies: { id: string, name: string }[],
    filters?: {
        companyId?: string
        departmentId?: string
        costCenterId?: string
        segmentId?: string
        clientId?: string
        ccSegmentId?: string
    },
    activeVersionId: string
    userRole: string
    userPermissions: any[]
}) {
    // State for Create Account
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [targetParent, setTargetParent] = useState<{ id: string, code: string } | null>(null)
    const [newAccountName, setNewAccountName] = useState('')
    const [newAccountCode, setNewAccountCode] = useState('')
    const [newAccountType, setNewAccountType] = useState<'INPUT' | 'CALCULATED'>('INPUT')

    // State for Edit Account Properties
    const [isEditPropsModalOpen, setIsEditPropsModalOpen] = useState(false)
    const [editPropsTarget, setEditPropsTarget] = useState<{
        id: string,
        name: string,
        code: string,
        type: 'INPUT' | 'CALCULATED',
        formula?: string | null,
        percentage?: number | null,
        baseCode?: string | null
    } | null>(null)

    // State for Edit Budget Values
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<{ id: string, name: string, values: number[] } | null>(null)

    // State for Confirmation
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean
        title: string
        message: React.ReactNode
        onConfirm: () => void
        variant: 'danger' | 'warning'
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'danger'
    })

    // Permission Check Helper
    const canEditContext = () => {
        if (userRole === 'ADMIN') return true

        const { companyId, costCenterId } = filters

        // If no filter selected, usually editing is disabled or defaults to available. 
        // For safety, if no specific context, deny.
        if (!companyId && !costCenterId && availableCompanies.length === 0) return false

        // Check if user has permission for the selected Company
        if (companyId && companyId !== 'all') {
            const perm = userPermissions.find(p => p.companyId === companyId)
            // If perm not found, deny. If found, check canEdit.
            if (!perm || !perm.canEdit) return false
        } else if (availableCompanies.length > 0) {
            // If no company selected, we defaulted to first available on Save, 
            // but here for UI feedback let's be strict or check if they have edit on ANY available.
            // Simpler: require selection for clarity, or check the first one as handleSaveBudget does.
            const firstId = availableCompanies[0].id
            const perm = userPermissions.find(p => p.companyId === firstId)
            if (!perm || !perm.canEdit) return false
        }

        // Check Cost Center if selected
        if (costCenterId && costCenterId !== 'all') {
            const perm = userPermissions.find(p => p.costCenterId === costCenterId)
            if (!perm || !perm.canEdit) return false
        }

        return true
    }

    const canManageStructure = userRole === 'ADMIN'
    const canEditValues = canEditContext()

    const handleAddClick = (row: DreRow) => {
        if (!canManageStructure) return
        // Find the next available code by checking existing children
        const existingChildren = row.children.map(c => c.code)
        let nextNumber = 1
        while (existingChildren.includes(`${row.code}.${nextNumber}`)) {
            nextNumber++
        }
        const suggestedCode = `${row.code}.${nextNumber}`

        setTargetParent({ id: row.id, code: row.code })
        setNewAccountCode(suggestedCode)
        setNewAccountName('')
        setNewAccountType('INPUT')
        setIsCreateModalOpen(true)
    }

    const handleAddRootClick = () => {
        if (!canManageStructure) return
        setTargetParent(null)
        setNewAccountCode('')
        setNewAccountName('')
        setNewAccountType('CALCULATED') // Default to Calculated for roots usually
        setIsCreateModalOpen(true)
    }

    const handleEditPropsClick = (row: DreRow) => {
        if (!canManageStructure) return
        setEditPropsTarget({
            id: row.id,
            name: row.name,
            code: row.code,
            type: row.type as 'INPUT' | 'CALCULATED',
            formula: row.formula,
            percentage: row.percentage,
            baseCode: row.baseCode
        })
        setIsEditPropsModalOpen(true)
    }

    const handleDeleteClick = async (id: string, name: string) => {
        if (!canManageStructure) return

        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Conta',
            message: `Tem certeza que deseja excluir **"${name}"**?\n\nIsso apagará também todos os lançamentos associados a esta conta.\nEsta ação não pode ser desfeita.`,
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await deleteAccount(id)
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                } catch (error: any) {
                    console.error('Delete failed:', error)
                    alert('Erro ao excluir conta: ' + (error.message || 'Erro desconhecido'))
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }

    const handleCreateAccount = async () => {
        if (!newAccountName || !newAccountCode) return

        try {
            await createAccount({
                tenantId,
                name: newAccountName,
                code: newAccountCode,
                type: newAccountType,
                parentId: targetParent?.id // undefined if root
            })
            setIsCreateModalOpen(false)
        } catch (error: any) {
            console.error('Create failed:', error)
            if (error.message.includes('Unique constraint') || error.message.includes('code')) {
                alert('Erro: Já existe uma conta com este Código. Por favor, escolha outro (ex: 1.3).')
            } else {
                alert(error.message || 'Erro ao criar conta')
            }
        }
    }

    const handleUpdateAccount = async () => {
        if (!editPropsTarget) return
        try {
            await updateAccount(editPropsTarget.id, {
                name: editPropsTarget.name,
                code: editPropsTarget.code,
                type: editPropsTarget.type,
                formula: editPropsTarget.formula || '',
                percentage: editPropsTarget.percentage ?? undefined,
                baseCode: editPropsTarget.baseCode ?? undefined
            })
            setIsEditPropsModalOpen(false)
        } catch (error: any) {
            alert(error.message || 'Erro ao atualizar conta')
        }
    }

    const handleRowClick = (row: DreRow) => {
        if (row.type === 'INPUT') {
            if (!canEditValues) {
                alert('Você não tem permissão para editar os valores desta Empresa/Centro de Custo.')
                return
            }
            setEditTarget({ id: row.id, name: row.name, values: row.values })
            setIsEditModalOpen(true)
        }
    }

    const handleSaveBudget = async (newValues: number[]) => {
        if (!editTarget) return

        let targetCompanyId = filters.companyId

        if (!targetCompanyId) {
            if (availableCompanies.length > 0) {
                targetCompanyId = availableCompanies[0].id
            } else {
                alert('Erro: Nenhuma empresa cadastrada. Vá em Configurações > Empresas e crie uma.')
                return
            }
        }

        const entries = newValues.map((val, idx) => ({
            month: idx + 1,
            amount: val
        }))

        try {
            await batchUpdateBudgetEntries(tenantId, editTarget.id, year, entries, activeVersionId, {
                companyId: targetCompanyId!,
                costCenterId: filters.costCenterId,
                clientId: filters.clientId,
                groupingId: filters.departmentId,
                segmentId: filters.segmentId
            })
            setIsEditModalOpen(false)
        } catch (error: any) {
            console.error('Save failed:', error)
            alert('Falha ao salvar valores. Tente novamente.')
        }
    }

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (rowId: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(rowId)) {
            newExpanded.delete(rowId)
        } else {
            newExpanded.add(rowId)
        }
        setExpandedRows(newExpanded)
    }

    const renderRow = (row: DreRow): React.ReactNode => {
        const total = row.values.reduce((a, b) => a + b, 0)
        const isInput = row.type === 'INPUT'
        const isHeader = row.children.length > 0 || row.type === 'CALCULATED'
        const hasChildren = row.children.length > 0
        const isExpanded = expandedRows.has(row.id)

        return (
            <>
                <tr
                    key={row.id}
                    className={`
                        group border-b border-[var(--border-subtle)] transition-colors duration-150
                        ${isInput ? 'cursor-pointer hover:bg-[var(--bg-surface-hover)]' : ''}
                        ${isHeader ? 'bg-[var(--bg-surface)]' : ''}
                    `}
                    onClick={() => {
                        if (hasChildren) {
                            toggleRow(row.id)
                        } else if (isInput) {
                            handleRowClick(row)
                        }
                    }}
                >
                    <td className="p-0 sticky left-0 z-10 bg-[var(--bg-main)] group-hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <div
                            className="flex items-center py-3 pr-4 border-r border-[var(--border-subtle)] h-full"
                            style={{ paddingLeft: `${row.level * 24 + 16}px` }}
                        >
                            <span
                                className={`mr-2 w-4 h-4 flex items-center justify-center text-[var(--text-secondary)] transition-transform duration-200 ${hasChildren ? 'cursor-pointer' : 'invisible'} ${isExpanded ? 'rotate-90' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleRow(row.id)
                                }}
                            >
                                ▶
                            </span>

                            <span className={`font-mono text-xs mr-3 min-w-[3rem] text-right ${isHeader ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-tertiary)]'}`}>
                                {row.code}
                            </span>
                            <span className={`block truncate ${isHeader ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                {row.name}
                            </span>

                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2 transition-opacity absolute right-2 bg-[var(--bg-main)]/80 backdrop-blur rounded px-1">
                                {canManageStructure && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAddClick(row); }}
                                            className="w-5 h-5 flex items-center justify-center text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
                                            title="Adicionar sub-conta"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditPropsClick(row); }}
                                            className="w-5 h-5 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                            title="Editar propriedade da conta"
                                        >
                                            ✎
                                        </button>
                                        {row.children.length === 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(row.id, row.name); }}
                                                className="w-5 h-5 flex items-center justify-center text-[var(--danger)] hover:text-red-400"
                                                title="Remover conta"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </td>

                    {row.values.map((val, idx) => (
                        <td key={idx} className={`px-2 py-3 text-right font-mono text-sm border-l border-transparent min-w-[100px] ${canEditValues ? 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--border-subtle)]/30' : 'text-[var(--text-tertiary)]'}`}>
                            {val !== 0 ? val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                        </td>
                    ))}

                    <td className="px-2 py-3 text-right font-mono text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-surface)]/50 border-l border-[var(--border-subtle)] min-w-[120px]">
                        {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                </tr>
                {isExpanded && row.children.map(child => renderRow(child))}
            </>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex justify-between items-center sticky left-0 z-20">
                <span className="text-sm text-[var(--text-secondary)]">Estrutura de Contas</span>
                {canManageStructure && (
                    <button
                        onClick={handleAddRootClick}
                        className="btn btn-primary text-xs flex items-center gap-1"
                    >
                        <span>+</span> Nova Conta Principal
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-auto w-full relative">
                <table className="text-left border-collapse min-w-[2000px]">
                    <thead>
                        <tr className="bg-[var(--bg-main)] text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold border-b border-[var(--border-subtle)]">
                            <th className="py-4 px-4 sticky left-0 bg-[var(--bg-main)] z-20 w-[350px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-[var(--border-subtle)]">Conta / Descrição</th>
                            {MONTHS.map(m => (
                                <th key={m} className="px-2 py-4 text-right min-w-[100px]">{m}</th>
                            ))}
                            <th className="px-2 py-4 text-right min-w-[120px] text-[var(--accent-primary)] border-l border-[var(--border-subtle)]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]/50">
                        {initialData.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="p-8 text-center text-[var(--text-secondary)]">
                                    Nenhuma conta cadastrada. Clique em "Nova Conta Principal" para começar.
                                </td>
                            </tr>
                        ) : (
                            initialData.map(row => renderRow(row))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={targetParent ? "Nova Sub-conta" : "Nova Conta Principal"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Tipo de Conta</label>
                        <select
                            value={newAccountType}
                            onChange={(e) => setNewAccountType(e.target.value as 'INPUT' | 'CALCULATED')}
                            className="input-outline bg-[var(--bg-main)]"
                        >
                            <option value="INPUT">Entrada (Valor)</option>
                            <option value="CALCULATED">Consolidado (Soma/Pasta)</option>
                        </select>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {newAccountType === 'INPUT' ? 'Permite inserir valores mensais manualmente.' : 'Soma automaticamente as sub-contas. Não aceita valores manuais.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Código</label>
                        <input
                            type="text"
                            value={newAccountCode}
                            onChange={e => setNewAccountCode(e.target.value)}
                            className="input-outline"
                            placeholder={targetParent ? `${targetParent.code}.1` : "1.0"}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nome</label>
                        <input
                            type="text"
                            value={newAccountName}
                            onChange={e => setNewAccountName(e.target.value)}
                            className="input-outline"
                            placeholder="Ex: Receita Operacional"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsCreateModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                        <button onClick={handleCreateAccount} className="btn btn-primary">Criar Conta</button>
                    </div>
                </div>
            </Modal>

            {editPropsTarget && (
                <Modal isOpen={isEditPropsModalOpen} onClose={() => setIsEditPropsModalOpen(false)} title="Editar Conta">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Tipo de Conta</label>
                            <select
                                value={editPropsTarget.type}
                                onChange={(e) => setEditPropsTarget({ ...editPropsTarget, type: e.target.value as 'INPUT' | 'CALCULATED' })}
                                className="input-outline bg-[var(--bg-main)]"
                            >
                                <option value="INPUT">Entrada (Valor)</option>
                                <option value="CALCULATED">Consolidado (Soma/Pasta)</option>
                            </select>
                            <p className="text-xs text-[var(--warning)] mt-1">
                                Cuidado: Mudar para 'Calculado' impedirá a edição manual de valores.
                            </p>
                        </div>

                        {editPropsTarget.type === 'CALCULATED' && (
                            <div className="bg-[var(--bg-surface-hover)] p-3 rounded border border-[var(--border-subtle)]">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!editPropsTarget.formula}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setEditPropsTarget({ ...editPropsTarget, formula: '' })
                                            } else {
                                                // If unchecking, we don't have a default formula to restore, 
                                                // but we can warn or leave empty. 
                                                // For simplicity, let's keep it cleared or allow manual input if we added that field.
                                                // But the goal is to RESET.
                                            }
                                        }}
                                        className="rounded border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--accent-primary)]"
                                    />
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        Somar todas as sub-contas automaticamente
                                    </span>
                                </label>
                                <p className="text-xs text-[var(--text-muted)] mt-1 ml-6">
                                    Marcando esta opção, a conta somará TUDO que estiver abaixo dela (1.1, 1.2, 1.3... e futuras).
                                    Se desmarcar, ela usará a fórmula personalizada.
                                </p>
                            </div>
                        )}

                        {editPropsTarget.type === 'CALCULATED' && (
                            <div className="bg-[var(--bg-surface-hover)] p-3 rounded border border-[var(--border-subtle)]">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Fórmula Personalizada</label>
                                    <input
                                        type="text"
                                        value={editPropsTarget.formula || ''}
                                        onChange={e => setEditPropsTarget({ ...editPropsTarget, formula: e.target.value })}
                                        className="input-outline h-9 text-sm w-full"
                                        placeholder="Ex: @7 - @8 ou (@1 + @2) * 0.5"
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        Use @código para referenciar outras contas. Operações: + (soma), - (subtração), * (multiplicação), / (divisão), ( )
                                    </p>
                                    <p className="text-xs text-[var(--accent-primary)] mt-1">
                                        Exemplo: EBITDA = @7 - @8 (Lucro Bruto menos Despesas Administrativas)
                                    </p>
                                    <p className="text-xs text-[var(--warning)] mt-1">
                                        ⚠️ Se deixar vazio, a conta somará automaticamente todas as sub-contas
                                    </p>
                                </div>
                            </div>
                        )}

                        {editPropsTarget.type === 'CALCULATED' && (
                            <div className="grid grid-cols-2 gap-4 bg-[var(--bg-surface-hover)] p-3 rounded border border-[var(--border-subtle)]">
                                <div className="col-span-2">
                                    <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">Cálculo de Encargos / Percentual</h4>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Conta Base (Ex: 4.1.1)</label>
                                    <input
                                        type="text"
                                        value={editPropsTarget.baseCode || ''}
                                        onChange={e => setEditPropsTarget({ ...editPropsTarget, baseCode: e.target.value })}
                                        className="input-outline h-9 text-sm"
                                        placeholder="Ex: 4.1.1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Percentual (%)</label>
                                    <input
                                        type="number"
                                        value={editPropsTarget.percentage || ''}
                                        onChange={e => setEditPropsTarget({ ...editPropsTarget, percentage: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="input-outline h-9 text-sm"
                                        placeholder="Ex: 27.5"
                                    />
                                </div>
                                <p className="col-span-2 text-[10px] text-[var(--text-muted)] mt-1">
                                    * Se preenchido, esta conta será: (Soma da Conta Base) * Percentual / 100.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Código</label>
                            <input
                                type="text"
                                value={editPropsTarget.code}
                                onChange={e => setEditPropsTarget({ ...editPropsTarget, code: e.target.value })}
                                className="input-outline"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Nome</label>
                            <input
                                type="text"
                                value={editPropsTarget.name}
                                onChange={e => setEditPropsTarget({ ...editPropsTarget, name: e.target.value })}
                                className="input-outline"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsEditPropsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                            <button onClick={handleUpdateAccount} className="btn btn-primary">Salvar Alterações</button>
                        </div>
                    </div>
                </Modal>
            )}

            {editTarget && (
                <BudgetEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    accountName={editTarget.name}
                    initialValues={editTarget.values}
                    onSave={handleSaveBudget}
                />
            )}

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
            />
        </div>
    )
}
