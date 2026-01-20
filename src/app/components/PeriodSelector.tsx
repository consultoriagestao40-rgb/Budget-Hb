'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

export function PeriodSelector() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPeriod = searchParams.get('period') || 'ALL'

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', e.target.value)
        router.push(`?${params.toString()}`)
    }

    /*
      Options:
      ALL - Ano Completo
      1S, 2S - Semestres
      1Q, 2Q, 3Q, 4Q - Trimestres
      M1...M12 - Meses
    */

    return (
        <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 shadow-sm">
            <Calendar size={16} className="text-[var(--text-secondary)]" />
            <select
                value={currentPeriod}
                onChange={handlePeriodChange}
                className="bg-transparent border-none text-sm font-medium text-[var(--text-primary)] focus:ring-0 cursor-pointer outline-none"
            >
                <option value="ALL">Ano Completo</option>

                <optgroup label="Semestres">
                    <option value="1S">1º Semestre</option>
                    <option value="2S">2º Semestre</option>
                </optgroup>

                <optgroup label="Trimestres">
                    <option value="1Q">1º Trimestre</option>
                    <option value="2Q">2º Trimestre</option>
                    <option value="3Q">3º Trimestre</option>
                    <option value="4Q">4º Trimestre</option>
                </optgroup>

                <optgroup label="Meses">
                    <option value="M1">Janeiro</option>
                    <option value="M2">Fevereiro</option>
                    <option value="M3">Março</option>
                    <option value="M4">Abril</option>
                    <option value="M5">Maio</option>
                    <option value="M6">Junho</option>
                    <option value="M7">Julho</option>
                    <option value="M8">Agosto</option>
                    <option value="M9">Setembro</option>
                    <option value="M10">Outubro</option>
                    <option value="M11">Novembro</option>
                    <option value="M12">Dezembro</option>
                </optgroup>
            </select>
        </div>
    )
}
