'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { updateYearRange, clearYearData } from '@/app/actions/versions'
import { useState } from 'react'

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
            if (confirm(`Deseja remover o ano ${currentYear} da linha do tempo GLOBALMENTE?\n\nIsso afetará todas as versões e usuários.\n\nClique em OK para Remover o Ano da Linha do Tempo.\nClique em Cancelar para manter o ano e ver opções de limpeza de dados.`)) {
                setIsLoading(true)
                try {
                    let newMin = minYear
                    let newMax = maxYear
                    if (currentYear === minYear) newMin++
                    if (currentYear === maxYear) newMax--

                    if (newMin > newMax) {
                        alert('Não é possível remover o último ano restante.')
                        setIsLoading(false)
                        return
                    }

                    await updateYearRange(newMin, newMax)

                    // Redirect to a safe year
                    const safeYear = currentYear === minYear ? newMin : newMax
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('year', safeYear.toString())
                    router.push(`${pathname}?${params.toString()}`)
                    return
                } catch (e) {
                    console.error('Failed to remove year', e)
                    alert('Erro ao remover ano.')
                    setIsLoading(false)
                    return
                }
            }
        }

        if (confirm(`Deseja ZERAR todos os valores do ano ${currentYear} APENAS nesta versão (${currentVersionId === 'v1' ? 'Principal' : 'Simulação'})?\n\nO ano continuará visível na linha do tempo.`)) {
            setIsLoading(true)
            try {
                await clearYearData(currentYear, currentVersionId)
                alert('Dados do ano limpos com sucesso.')
            } catch (e) {
                console.error('Failed to clear year', e)
                alert('Erro ao limpar dados do ano.')
            } finally {
                setIsLoading(false)
            }
        }
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
        </div>
    )
}
