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
                params.delete('clientId')
                params.delete('segmentId')
                params.delete('ccSegmentId')
            }
            if (key === 'departmentId') {
                params.delete('costCenterId')
                params.delete('segmentId')
                // Indirect children of CostCenter need reset too as their context changes
                params.delete('clientId')
                params.delete('ccSegmentId')
            }
            if (key === 'costCenterId') {
                params.delete('clientId')
                params.delete('ccSegmentId')
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
            return filteredDepartments.some(d => d.id === cc.groupingId)
        }
        return true
    })

    // 3. Filter "Centro de Despesa" (Segment) by Department
    // Requirements: Must match selected Department, or belongs to selected Company's departments
    const filteredSegments = (segments as any[]).filter(seg => {
        if (currentFilters.departmentId !== 'all') {
            return seg.groupingId === currentFilters.departmentId
        }
        if (currentFilters.companyId !== 'all') {
            return filteredDepartments.some(d => d.id === seg.groupingId)
        }
        return true
    })

    // 4. Filter "Seguimento" (ccSegment) based on AVAILABLE CostCenters
    // Only show segments that are used by the currently filtered cost centers
    const activeCCSegmentIds = new Set(filteredCostCenters.map((cc: any) => cc.segmentId).filter(Boolean))
    const filteredCCSegments = ccSegments.filter(ccs => activeCCSegmentIds.has(ccs.id))

    // 5. Filter "Cliente" based on AVAILABLE CostCenters
    // Only show clients that are used by the currently filtered cost centers
    const activeClientIds = new Set(filteredCostCenters.map((cc: any) => cc.clientId).filter(Boolean))
    const filteredClients = clients.filter(c => activeClientIds.has(c.id))

    // 6. Filter Cities by State
    // --- Hierarchical Label Helpers ---
    const getCompanyCode = (id: string | null | undefined) => {
        if (!id) return ''
        const c = companies.find(x => x.id === id)
        return c?.code ? c.code : ''
    }

    const getDepartmentCode = (id: string | null | undefined) => {
        if (!id) return ''
        const d = departments.find(x => x.id === id)
        if (!d) return ''
        const cCode = getCompanyCode(d.companyId)
        // Ensure we handle cases where Company Code might be missing but Dept Code exists
        if (cCode && d.code) return `${cCode}.${d.code}`
        if (d.code) return d.code
        return ''
    }

    // Prepare Options with Full Codes
    const preparedDepartments = filteredDepartments.map(d => ({
        ...d,
        fullCode: (() => {
            const val = getCompanyCode(d.companyId)
            return val && d.code ? `${val}.${d.code}` : d.code
        })()
    }))

    const preparedCostCenters = filteredCostCenters.map(cc => ({
        ...cc,
        fullCode: (() => {
            const deptFull = getDepartmentCode(cc.groupingId)
            // Format: Company.Dept.CostCenterCode
            return deptFull && cc.code ? `${deptFull}.${cc.code}` : cc.code
        })()
    }))

    const preparedSegments = (filteredSegments as FilterOption[]).map(s => ({
        ...s,
        fullCode: (() => {
            const deptFull = getDepartmentCode(s.groupingId)
            // Format: Company.Dept.ExpenseCenterCode
            return deptFull && s.code ? `${deptFull}.${s.code}` : s.code
        })()
    }))

    // 6. Filter Cities by State
    const filteredCities = currentFilters.state !== 'all'
        ? cities.filter(c => c.state === currentFilters.state)
        : cities

    const FilterSelect = ({ label, value, onChange, options, disabled = false }: { label: string, value: string, onChange: (v: string) => void, options: (FilterOption & { fullCode?: string | null })[], disabled?: boolean }) => (
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
                    <option key={opt.id} value={opt.id}>
                        {opt.fullCode ? `${opt.fullCode} - ${opt.name}` : (opt.code ? `${opt.code} - ${opt.name}` : opt.name)}
                    </option>
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
            </div>
        </div>
    )
}
