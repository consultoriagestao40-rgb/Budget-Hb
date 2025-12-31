'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createVersion, updateVersion, deleteVersion } from '@/app/actions/versions'
import { Modal } from './Modal'

interface BudgetVersion {
    id: string
    name: string
    color?: string | null
}

export function VersionSelector({
    versions,
    currentVersionId
}: {
    versions: BudgetVersion[]
    currentVersionId: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [isManageOpen, setIsManageOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Manage Modal State
    const [editingVersion, setEditingVersion] = useState<BudgetVersion | null>(null) // If null and creating -> new
    const [isCreating, setIsCreating] = useState(false)
    const [formName, setFormName] = useState('')
    const [formCopyFrom, setFormCopyFrom] = useState<string>('')

    const currentVersion = versions.find(v => v.id === currentVersionId) || versions[0]

    const handleVersionChange = (versionId: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('versionId', versionId)
        router.push(`${pathname}?${params.toString()}`)
    }

    const openCreate = () => {
        setFormName('')
        setFormCopyFrom(currentVersionId || '')
        setIsCreating(true)
        setEditingVersion(null)
    }

    const openEdit = (v: BudgetVersion) => {
        setFormName(v.name)
        setEditingVersion(v)
        setIsCreating(false)
    }

    const handleSubmit = async () => {
        if (!formName.trim()) return
        setIsLoading(true)
        try {
            if (isCreating) {
                const newVersion = await createVersion({
                    name: formName,
                    copyFromId: formCopyFrom || undefined
                })
                // Switch to new version
                handleVersionChange(newVersion.id)
                setIsManageOpen(false)
            } else if (editingVersion) {
                await updateVersion(editingVersion.id, { name: formName })
                setEditingVersion(null)
            }
        } catch (e) {
            alert('Erro ao salvar versão')
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará TODOS os dados desta versão.')) return
        setIsLoading(true)
        try {
            await deleteVersion(id)
            if (currentVersionId === id) {
                // Determine fallback version
                const fallback = versions.find(v => v.id !== id)
                if (fallback) handleVersionChange(fallback.id)
            }
        } catch (e) {
            alert('Erro ao excluir')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Versão:</span>
                <select
                    value={currentVersionId}
                    onChange={(e) => {
                        if (e.target.value === 'MANAGE') {
                            setIsManageOpen(true)
                        } else {
                            handleVersionChange(e.target.value)
                        }
                    }}
                    className="select select-sm select-bordered w-full max-w-[200px] text-sm font-medium bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-0"
                >
                    {versions.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.name}
                        </option>
                    ))}
                    <option disabled>──────────</option>
                    <option value="MANAGE">⚙️ Gerenciar Versões...</option>
                </select>
            </div>

            <Modal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} title="Gerenciar Versões">
                <div className="space-y-6">
                    {/* List of Versions */}
                    <div className="space-y-2">
                        {versions.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded border border-[var(--border-subtle)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    {editingVersion?.id === v.id ? (
                                        <input
                                            value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                            className="input-outline h-8 text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="font-medium text-sm">{v.name}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingVersion?.id === v.id ? (
                                        <>
                                            <button onClick={handleSubmit} className="btn-xs btn-primary text-green-500">Salvar</button>
                                            <button onClick={() => setEditingVersion(null)} className="btn-xs text-[var(--text-muted)]">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => openEdit(v)} className="btn-icon p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]" title="Renomear">
                                                ✎
                                            </button>
                                            {versions.length > 1 && (
                                                <button onClick={() => handleDelete(v.id)} className="btn-icon p-1 text-[var(--text-secondary)] hover:text-red-500" title="Excluir">
                                                    🗑️
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Create New Section */}
                    {isCreating ? (
                        <div className="p-4 bg-[var(--bg-surface-hover)] rounded border border-[var(--border-subtle)]">
                            <h4 className="text-sm font-bold mb-3">Nova Versão / Simulação</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs mb-1">Nome da Versão</label>
                                    <input
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        className="input-outline w-full text-sm"
                                        placeholder="Ex: Cenário Otimista 2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Baseada em (Copiar dados de)</label>
                                    <select
                                        value={formCopyFrom}
                                        onChange={e => setFormCopyFrom(e.target.value)}
                                        className="input-outline w-full text-sm"
                                    >
                                        {versions.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">Todos os valores da versão selecionada serão copiados para a nova.</p>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setIsCreating(false)} className="btn-secondary text-xs">Cancelar</button>
                                    <button onClick={handleSubmit} disabled={isLoading} className="btn-primary text-xs">
                                        {isLoading ? 'Criando...' : 'Criar Versão'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={openCreate}
                            className="w-full py-2 border border-dashed border-[var(--border-subtle)] rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2"
                        >
                            <span>+ Criar Nova Simulação</span>
                        </button>
                    )}
                </div>
            </Modal>
        </>
    )
}
