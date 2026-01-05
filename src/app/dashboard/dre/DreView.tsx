'use client'

import { useState } from 'react'
import { DreTable } from '@/app/components/DreTable'
import { YearSelector } from '@/app/components/YearSelector'
import { VersionSelector } from '@/app/components/VersionSelector'
import { HorizontalFilterBar } from '@/app/components/HorizontalFilterBar'
import { DreRow } from '@/types/dre'
import { updateTenantDreTitle } from '@/app/actions/settings'
import { createAccount } from '@/app/actions/account' // Import createAccount
import { Modal } from '@/app/components/Modal' // Import Modal
import { useSidebarStore } from '@/store/sidebarStore'
import { Maximize2, Minimize2 } from 'lucide-react'

interface DreViewProps {
    initialData: DreRow[]
    tenantId: string
    dreTitle: string
    currentYear: number

    // Version Props
    versions: any[]
    currentVersionId: string
    minYear: number
    maxYear: number

    // Filter Data
    companies: any[]
    departments: any[]
    costCenters: any[]
    clients: any[]
    segments: any[]
    ccSegments: any[]
    cities: any[]
    states: any[]

    filters: {
        companyId?: string
        departmentId?: string
        costCenterId?: string
        clientId?: string
        segmentId?: string
        ccSegmentId?: string
    }
    userRole: string
    userPermissions: any[]
}

export function DreView({
    initialData,
    tenantId,
    dreTitle,
    currentYear,
    versions,
    currentVersionId,
    minYear,
    maxYear,
    companies,
    departments,
    costCenters,
    clients,
    segments,
    ccSegments,
    cities,
    states,
    filters,
    userRole,
    userPermissions
}: DreViewProps) {
    const { isCollapsed } = useSidebarStore()

    // Title Editing State
    const [title, setTitle] = useState(dreTitle)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [tempTitle, setTempTitle] = useState(dreTitle)

    // Fullscreen State
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Create Account State (Hoisted)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [targetParent, setTargetParent] = useState<{ id: string, code: string } | null>(null)
    const [newAccountName, setNewAccountName] = useState('')
    const [newAccountCode, setNewAccountCode] = useState('')
    const [newAccountType, setNewAccountType] = useState<'INPUT' | 'CALCULATED'>('INPUT')

    async function handleSaveTitle() {
        if (!tempTitle.trim()) return
        try {
            await updateTenantDreTitle(tempTitle)
            setTitle(tempTitle)
            setIsEditingTitle(false)
        } catch (e) {
            alert('Falha ao atualizar título')
            console.error(e)
        }
    }

    const handleOpenCreateRoot = () => {
        setTargetParent(null)
        setNewAccountCode('')
        setNewAccountName('')
        setNewAccountType('CALCULATED')
        setIsCreateModalOpen(true)
    }

    const handleOpenCreateSub = (parent: { id: string, code: string }, suggestedCode: string) => {
        setTargetParent(parent)
        setNewAccountCode(suggestedCode)
        setNewAccountName('')
        setNewAccountType('INPUT')
        setIsCreateModalOpen(true)
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

    const canManageStructure = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

    // Dynamic sizing to correct layout issues
    const sidebarWidth = isCollapsed ? 80 : 260
    const padding = 32 // p-4
    const buffer = 20
    const maxWidth = `calc(100vw - ${sidebarWidth + padding + buffer}px)`

    return (
        <div className="space-y-2 flex flex-col h-[calc(100vh-20px)] w-full">
            {/* Header Area */}
            <div className="flex justify-between items-center shrink-0 relative z-50">
                <div className="flex items-center gap-4">
                    {/* Title Section */}
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={tempTitle}
                                onChange={e => setTempTitle(e.target.value)}
                                className="input-outline h-9 text-xl font-bold w-full min-w-[300px]"
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveTitle()
                                    if (e.key === 'Escape') {
                                        setTempTitle(title)
                                        setIsEditingTitle(false)
                                    }
                                }}
                            />
                            <button onClick={handleSaveTitle} className="btn-icon text-[var(--success)] hover:bg-[var(--bg-surface-hover)]" title="Salvar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                            <button onClick={() => {
                                setTempTitle(title)
                                setIsEditingTitle(false)
                            }} className="btn-icon text-[var(--error)] hover:bg-[var(--bg-surface-hover)]" title="Cancelar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <h2 className="text-xl font-bold">{title}</h2>
                            <button
                                onClick={() => {
                                    setTempTitle(title)
                                    setIsEditingTitle(true)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[var(--bg-surface-hover)] rounded-md text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                                title="Editar Título"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="btn-icon text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                        title={isFullscreen ? "Restaurar" : "Tela Cheia"}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>

                    {canManageStructure && (
                        <button
                            onClick={handleOpenCreateRoot}
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors shadow-sm"
                        >
                            <span>+</span> Nova Conta Principal
                        </button>
                    )}
                    <div className="h-6 w-px bg-[var(--border-subtle)] mx-1"></div>
                    <VersionSelector versions={versions} currentVersionId={currentVersionId} />
                    <YearSelector currentYear={currentYear} minYear={minYear} maxYear={maxYear} currentVersionId={currentVersionId} />
                </div>
            </div>

            {/* Horizontal Filter Bar */}
            <div style={{ width: '100%', maxWidth: maxWidth }}>
                <HorizontalFilterBar
                    companies={companies}
                    departments={departments}
                    costCenters={costCenters}
                    clients={clients}
                    segments={segments}
                    ccSegments={ccSegments}
                    cities={cities}
                    states={states}
                    userRole={userRole}
                />
            </div>

            {/* Main Content Wrapper - strictly constrained */}
            <div
                className={`bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-2xl relative overflow-hidden transition-all duration-200 ${isFullscreen ? '!fixed !inset-0 !z-[99999] !w-screen !h-screen !m-0 !rounded-none !border-0' : 'flex-1'}`}
                style={isFullscreen ? { maxWidth: 'none' } : { width: '100%', maxWidth: maxWidth }}
            >
                <DreTable
                    initialData={initialData}
                    tenantId={tenantId}
                    year={currentYear}
                    availableCompanies={companies}
                    filters={filters}
                    activeVersionId={currentVersionId}
                    userRole={userRole}
                    userPermissions={userPermissions}
                    onAddSubAccount={handleOpenCreateSub}
                />
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
        </div>
    )
}
