'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { updateYearRange, clearYearData } from '@/app/actions/versions'
import { useState } from 'react'
import { ConfirmationModal } from './ConfirmationModal'

export function YearSelector({
    currentYear,
    minYear = 2024,
    maxYear = 2027,
    currentVersionId
}: {
    currentYear: number
    minYear?: number
    maxYear?: number
    currentVersionId: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean
        title: string
        message: React.ReactNode
        onConfirm: () => void
        variant: 'danger' | 'warning'
        confirmText?: string
        cancelText?: string
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'danger'
    })

    const handleYearChange = (year: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('year', year.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleAddYear = async () => {
        setIsLoading(true)
        try {
            await updateYearRange(minYear, maxYear + 1)
        } catch (e) {
            console.error('Failed to add year', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearYear = async () => {
        const isEdge = currentYear === minYear || currentYear === maxYear

        if (isEdge) {
            setConfirmConfig({
                isOpen: true,
                title: 'Remover Ano Globalmente?',
                message: `Deseja remover o ano **${currentYear}** da linha do tempo?\n\nIsso afetará **TODAS** as versões e usuários.\nEsta ação não pode ser desfeita.`,
                variant: 'danger',
                onConfirm: async () => {
                    setIsLoading(true)
                    try {
                        let newMin = minYear
                        let newMax = maxYear
                        if (currentYear === minYear) newMin++
                        if (currentYear === maxYear) newMax--

                        if (newMin > newMax) {
                            setConfirmConfig({
                                isOpen: true,
                                title: 'Operação Inválida',
                                message: 'Não é possível remover o último ano restante.',
                                variant: 'warning',
                                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
                                confirmText: 'OK',
                                cancelText: ''
                            })
                            setIsLoading(false)
                            return
                        }

                        await updateYearRange(newMin, newMax)

                        // Redirect to a safe year
                        const safeYear = currentYear === minYear ? newMin : newMax
                        const params = new URLSearchParams(searchParams.toString())
                        params.set('year', safeYear.toString())
                        router.push(`${pathname}?${params.toString()}`)
                        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                    } catch (e: any) {
                        console.error('Failed to remove year', e)
                        setConfirmConfig({
                            isOpen: true,
                            title: 'Erro Critico',
                            message: `Não foi possível remover o ano.\n\nDetalhes: ${e.message || 'Erro desconhecido.'}\n\nTente recarregar a página.`,
                            variant: 'danger',
                            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
                            confirmText: 'Fechar',
                            cancelText: ''
                        })
                        setIsLoading(false)
                    }
                }
            })
            return
        }

        setConfirmConfig({
            isOpen: true,
            title: `Zerar Valores de ${currentYear}?`,
            message: `Deseja zerar todos os valores deste ano APENAS na versão **${currentVersionId === 'v1' ? 'Principal' : 'Simulação'}**?\n\nO ano continuará visível, mas os lançamentos serão apagados.`,
            variant: 'warning',
            onConfirm: async () => {
                setIsLoading(true)
                try {
                    await clearYearData(currentYear, currentVersionId)
                    // Success feedback handled by UI refresh or toast eventually
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                } catch (e) {
                    console.error('Failed to clear year', e)
                    alert('Erro ao limpar dados do ano.')
                } finally {
                    setIsLoading(false)
                }
            }
        })
    }

    const availableYears = []
    for (let y = minYear; y <= maxYear; y++) {
        availableYears.push(y)
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-surface)] rounded-lg p-1 border border-[var(--border-subtle)]">
                {availableYears.map(year => (
                    <button
                        key={year}
                        onClick={() => handleYearChange(year)}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${year === currentYear
                            ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]'
                            }`}
                    >
                        {year}
                    </button>
                ))}
            </div>

            <div className="flex gap-1">
                <button
                    onClick={handleAddYear}
                    disabled={isLoading}
                    className="btn-icon bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-8 h-8 rounded-lg hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50"
                    title="Adicionar próximo ano"
                >
                    {isLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    )}
                </button>

                <button
                    onClick={handleClearYear}
                    disabled={isLoading}
                    className="btn-icon bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-8 h-8 rounded-lg hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:opacity-50"
                    title={`Limpar dados de ${currentYear}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.cancelText}
                isLoading={isLoading}
            />
        </div >
    )
}
