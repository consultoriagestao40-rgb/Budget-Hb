'use client'

import { useState } from 'react'
import { DreTable } from '@/app/components/DreTable'
import { YearSelector } from '@/app/components/YearSelector'
import { VersionSelector } from '@/app/components/VersionSelector'
import { HorizontalFilterBar } from '@/app/components/HorizontalFilterBar'
import { DreRow } from '@/types/dre'
import { updateTenantDreTitle } from '@/app/actions/settings'
import { useSidebarStore } from '@/store/sidebarStore'

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
    departments: any[] // NEW
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
    departments, // NEW
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

    // Dynamic sizing to correct layout issues
    const sidebarWidth = isCollapsed ? 80 : 260
    const padding = 32 // p-4 = 1rem * 2 = 32px
    const buffer = 20
    const maxWidth = `calc(100vw - ${sidebarWidth + padding + buffer}px)`

    return (
        <div className="space-y-2 flex flex-col h-[calc(100vh-20px)] w-full">
            {/* Header Area */}
            <div className="flex justify-between items-center shrink-0">
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
                            <h2 className="text-2xl font-bold">{title}</h2>
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
                    <VersionSelector versions={versions} currentVersionId={currentVersionId} />
                    <YearSelector currentYear={currentYear} minYear={minYear} maxYear={maxYear} currentVersionId={currentVersionId} />
                </div>
            </div>

            {/* Horizontal Filter Bar */}
            <div style={{ width: '100%', maxWidth: maxWidth }}>
                <HorizontalFilterBar
                    companies={companies}
                    departments={departments} // NEW
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
                className="flex-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] shadow-2xl relative overflow-hidden"
                style={{ width: '100%', maxWidth: maxWidth }}
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
                />
            </div>
        </div>
    )
}
