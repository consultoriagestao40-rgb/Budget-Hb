'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface FilterOption {
    id: string
    name: string
}

interface HorizontalFilterBarProps {
    companies: FilterOption[]
    departments: any[] // Using any for now to avoid extensive type mapping updates
    costCenters: any[]
    clients: FilterOption[]
    segments: FilterOption[] // Centro de Despesa
    ccSegments: FilterOption[] // Seguimento
    cities: { id: string; name: string; state: string }[]
    states: string[]
}

export function HorizontalFilterBar({
    companies,
    departments,
    costCenters,
    clients,
    segments,
    ccSegments,
    cities,
    states
}: HorizontalFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set(key, value)

            // Cascading Resets
            if (key === 'companyId') {
                params.delete('departmentId')
                params.delete('costCenterId')
            }
            if (key === 'departmentId') {
                params.delete('costCenterId')
            }
        } else {
            params.delete(key)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    const currentFilters = {
        companyId: searchParams.get('companyId') || 'all',
        departmentId: searchParams.get('departmentId') || 'all',
        costCenterId: searchParams.get('costCenterId') || 'all',
        clientId: searchParams.get('clientId') || 'all',
        segmentId: searchParams.get('segmentId') || 'all', // Centro de Despesa
        ccSegmentId: searchParams.get('ccSegmentId') || 'all', // Seguimento
        cityId: searchParams.get('cityId') || 'all',
        state: searchParams.get('state') || 'all',
    }

    // --- Cascading Logic ---

    // 1. Filter Departments by Company
    const filteredDepartments = currentFilters.companyId !== 'all'
        ? departments.filter(d => d.companyId === currentFilters.companyId)
        : departments

    // 2. Filter CostCenters by Department (and indirectly by Company)
    const filteredCostCenters = costCenters.filter(cc => {
        // If specific Department selected, show only its CostCenters
        if (currentFilters.departmentId !== 'all') {
            return cc.groupingId === currentFilters.departmentId
        }
        // If Company selected (but no specific Dept), show CostCenters of that Company's Departments
        if (currentFilters.companyId !== 'all') {
            // Check if CC belongs to any of the filtered departments
            return filteredDepartments.some(d => d.id === cc.groupingId)
        }
        return true
    })

    // 3. Filter Cities by State
    const filteredCities = currentFilters.state !== 'all'
        ? cities.filter(c => c.state === currentFilters.state)
        : cities

    const FilterSelect = ({ label, value, onChange, options, disabled = false }: { label: string, value: string, onChange: (v: string) => void, options: FilterOption[], disabled?: boolean }) => (
        <div className="flex flex-col gap-1 min-w-[150px] flex-1">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="select select-sm select-bordered w-full text-sm bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-0 disabled:opacity-50"
            >
                <option value="all">Todos</option>
                {options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
        </div>
    )

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm mb-6">
            <div className="flex flex-wrap gap-4">
                <FilterSelect
                    label="Empresa"
                    value={currentFilters.companyId}
                    onChange={v => handleFilterChange('companyId', v)}
                    options={companies}
                />
                <FilterSelect
                    label="Departamento"
                    value={currentFilters.departmentId}
                    onChange={v => handleFilterChange('departmentId', v)}
                    options={filteredDepartments}
                    disabled={filteredDepartments.length === 0}
                />
                <FilterSelect
                    label="Centro de Custo"
                    value={currentFilters.costCenterId}
                    onChange={v => handleFilterChange('costCenterId', v)}
                    options={filteredCostCenters}
                    disabled={filteredCostCenters.length === 0}
                />
                <FilterSelect
                    label="Cliente"
                    value={currentFilters.clientId}
                    onChange={v => handleFilterChange('clientId', v)}
                    options={clients}
                />
                <FilterSelect
                    label="Seguimento"
                    value={currentFilters.ccSegmentId}
                    onChange={v => handleFilterChange('ccSegmentId', v)}
                    options={ccSegments}
                />
                <FilterSelect
                    label="Centro de Despesa"
                    value={currentFilters.segmentId}
                    onChange={v => handleFilterChange('segmentId', v)}
                    options={segments}
                />
                <div className="flex flex-col gap-1 min-w-[100px] w-[100px]">
                    <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">UF</label>
                    <select
                        value={currentFilters.state}
                        onChange={(e) => handleFilterChange('state', e.target.value)}
                        className="select select-sm select-bordered w-full text-sm bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                    >
                        <option value="all">Todas</option>
                        {states.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <FilterSelect
                    label="Cidade"
                    value={currentFilters.cityId}
                    onChange={v => handleFilterChange('cityId', v)}
                    options={filteredCities}
                />
            </div>
        </div>
    )
}
