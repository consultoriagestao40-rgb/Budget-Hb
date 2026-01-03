'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface FilterOption {
    id: string
    name: string
    code?: string | null
    companyId?: string | null
    groupingId?: string | null // For Department linkage
}

interface HorizontalFilterBarProps {
    companies: FilterOption[]
    departments: FilterOption[]
    costCenters: FilterOption[]
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
    states,
    userRole = 'USER' // Default to restrictive
}: HorizontalFilterBarProps & { userRole?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    // ... [rest of hooks]

    // ... [keep existing handleFilterChange and logic]

    // --- Cascading Logic ---
    // ... [keep existing logic]

    // ... [keep existing FilterSelect component and consts]

    // Rule: Non-Admins only see basic filters (Company, Dept, CostCenter, Client)
    const showAdvanced = userRole === 'ADMIN'

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
                    options={preparedDepartments}
                    disabled={filteredDepartments.length === 0}
                />
                <FilterSelect
                    label="Centro de Custo"
                    value={currentFilters.costCenterId}
                    onChange={v => handleFilterChange('costCenterId', v)}
                    options={preparedCostCenters}
                    disabled={filteredCostCenters.length === 0}
                />
                <FilterSelect
                    label="Cliente"
                    value={currentFilters.clientId}
                    onChange={v => handleFilterChange('clientId', v)}
                    options={filteredClients}
                    disabled={filteredClients.length === 0}
                />

                {/* Advanced Filters - Admin Only */}
                {showAdvanced && (
                    <>
                        <FilterSelect
                            label="Seguimento"
                            value={currentFilters.ccSegmentId}
                            onChange={v => handleFilterChange('ccSegmentId', v)}
                            options={filteredCCSegments}
                            disabled={filteredCCSegments.length === 0}
                        />
                        <FilterSelect
                            label="Centro de Despesa"
                            value={currentFilters.segmentId}
                            onChange={v => handleFilterChange('segmentId', v)}
                            options={preparedSegments}
                            disabled={filteredSegments.length === 0}
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
                    </>
                )}
            </div>
        </div>
    )
}
