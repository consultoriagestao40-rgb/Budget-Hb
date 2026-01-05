'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { MultiSelect } from './MultiSelect'

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
    userRole?: string
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
    userRole = 'USER'
}: HorizontalFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Helper to get array from comma-separated string
    const getValues = (key: string): string[] => {
        const val = searchParams.get(key)
        return val && val !== 'all' ? val.split(',') : []
    }

    const handleFilterChange = (key: string, values: string[]) => {
        const params = new URLSearchParams(searchParams.toString())

        if (values.length > 0) {
            params.set(key, values.join(','))

            // Cascading Resets (If parent filter changes, clear children to avoid invalid states)
            // Note: In multi-select, we might be ADDING a parent option, so clearing might be annoying.
            // But strict hierarchy requires children to belong to parents.
            // Let's Keep strict reset for safety for now.
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
        companyIds: getValues('companyId'),
        departmentIds: getValues('departmentId'),
        costCenterIds: getValues('costCenterId'),
        clientIds: getValues('clientId'),
        segmentIds: getValues('segmentId'),
        ccSegmentIds: getValues('ccSegmentId'),
        cityIds: getValues('cityId'),
        states: getValues('state'),
    }

    // --- Cascading Logic ---

    // 1. Filter Departments by Companies
    const filteredDepartments = currentFilters.companyIds.length > 0
        ? departments.filter(d => d.companyId && currentFilters.companyIds.includes(d.companyId))
        : departments

    // 2. Filter CostCenters
    const filteredCostCenters = costCenters.filter(cc => {
        if (currentFilters.departmentIds.length > 0) {
            return cc.groupingId && currentFilters.departmentIds.includes(cc.groupingId)
        }
        if (currentFilters.companyIds.length > 0) {
            return filteredDepartments.some(d => d.id === cc.groupingId)
        }
        return true
    })

    // 3. Filter "Centro de Despesa" (Separate segments)
    const filteredSegments = (segments as any[]).filter(seg => {
        if (currentFilters.departmentIds.length > 0) {
            return seg.groupingId && currentFilters.departmentIds.includes(seg.groupingId)
        }
        if (currentFilters.companyIds.length > 0) {
            return filteredDepartments.some(d => d.id === seg.groupingId)
        }
        return true
    })

    // 4. Filter segments (Followups)
    const activeCCSegmentIds = new Set(filteredCostCenters.map((cc: any) => cc.segmentId).filter(Boolean))
    const filteredCCSegments = ccSegments.filter(ccs => activeCCSegmentIds.has(ccs.id))

    // 5. Filter Clients
    const activeClientIds = new Set(filteredCostCenters.map((cc: any) => cc.clientId).filter(Boolean))
    const filteredClients = clients.filter(c => activeClientIds.has(c.id))

    // 6. Filter Cities
    const filteredCities = currentFilters.states.length > 0
        ? cities.filter(c => currentFilters.states.includes(c.state))
        : cities

    // Helper functions for codes (unchanged logic, just moved inline or simplified if needed)
    // ... kept simple for rendering

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
        if (cCode && d.code) return `${cCode}.${d.code}`
        if (d.code) return d.code
        return ''
    }

    // Prepare Options
    const prepare = (list: any[], type: 'dept' | 'cc' | 'seg') => list.map(item => ({
        ...item,
        fullCode: (() => {
            if (type === 'dept') {
                const val = getCompanyCode(item.companyId)
                return val && item.code ? `${val}.${item.code}` : item.code
            }
            if (type === 'cc' || type === 'seg') {
                const deptFull = getDepartmentCode(item.groupingId)
                return deptFull && item.code ? `${deptFull}.${item.code}` : item.code
            }
            return item.code || ''
        })()
    }))

    const prepDepts = prepare(filteredDepartments, 'dept')
    const prepCCs = prepare(filteredCostCenters, 'cc')
    const prepSegs = prepare(filteredSegments, 'seg')

    const showAdvanced = userRole === 'ADMIN'

    const [isExpanded, setIsExpanded] = useState(false)
    const [overflowVisible, setOverflowVisible] = useState(false)

    const hasActiveSecondaryFilters = currentFilters.departmentIds.length > 0 ||
        currentFilters.ccSegmentIds.length > 0 ||
        currentFilters.segmentIds.length > 0 ||
        currentFilters.states.length > 0 ||
        currentFilters.cityIds.length > 0

    // Auto-expand if active filters
    useEffect(() => {
        if (hasActiveSecondaryFilters) {
            setIsExpanded(true)
        }
    }, [hasActiveSecondaryFilters])

    // Handle overflow visibility for dropdowns matching transition duration (300ms)
    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (isExpanded) {
            // Wait for transition to finish then allow overflow
            timeout = setTimeout(() => setOverflowVisible(true), 300)
        } else {
            // Immediately clip for hiding transition
            setOverflowVisible(false)
        }
        return () => clearTimeout(timeout)
    }, [isExpanded])

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm relative transition-all duration-300">
            {/* Top Row: Primary Filters */}
            <div className={`grid grid-cols-4 gap-3 mb-2`}>
                {/* Row 1: Always Visible */}
                <MultiSelect
                    label="Empresa"
                    options={companies}
                    selectedIds={currentFilters.companyIds}
                    onChange={v => handleFilterChange('companyId', v)}
                />
                <MultiSelect
                    label="Centro de Custo"
                    options={prepCCs}
                    selectedIds={currentFilters.costCenterIds}
                    onChange={v => handleFilterChange('costCenterId', v)}
                    disabled={filteredCostCenters.length === 0}
                />
                <MultiSelect
                    label="Cliente"
                    options={filteredClients}
                    selectedIds={currentFilters.clientIds}
                    onChange={v => handleFilterChange('clientId', v)}
                    disabled={filteredClients.length === 0}
                />

                {/* 4th slot: Department OR Toggle placeholder if not expanded? 
                    Actually, let's put Department in Row 1 if fits, but user asked for 4 per row. 
                    So Dept goes here. */}
                {showAdvanced && (
                    <MultiSelect
                        label="Departamento"
                        options={prepDepts}
                        selectedIds={currentFilters.departmentIds}
                        onChange={v => handleFilterChange('departmentId', v)}
                        disabled={filteredDepartments.length === 0}
                    />
                )}

                {/* Toggle Button Absolute or Row? 
                    If we have 4 items, Row 1 is full.
                    Row 2 starts below.
                */}
            </div>

            {/* Row 2: Collapsible */}
            {showAdvanced && (
                <div
                    className={`
                        grid grid-cols-4 gap-3 mt-3 transition-all duration-300 ease-in-out
                        ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 mt-0'}
                        ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}
                    `}
                >
                    <MultiSelect
                        label="Seguimento"
                        options={filteredCCSegments}
                        selectedIds={currentFilters.ccSegmentIds}
                        onChange={v => handleFilterChange('ccSegmentId', v)}
                        disabled={filteredCCSegments.length === 0}
                    />
                    <MultiSelect
                        label="Centro de Despesa"
                        options={prepSegs}
                        selectedIds={currentFilters.segmentIds}
                        onChange={v => handleFilterChange('segmentId', v)}
                        disabled={filteredSegments.length === 0}
                    />
                    <MultiSelect
                        label="UF"
                        options={states.map(s => ({ id: s, name: s }))}
                        selectedIds={currentFilters.states}
                        onChange={v => handleFilterChange('state', v)}
                    />
                    <MultiSelect
                        label="Cidade"
                        options={filteredCities}
                        selectedIds={currentFilters.cityIds}
                        onChange={v => handleFilterChange('cityId', v)}
                    />
                </div>
            )}

            {/* Toggle Action */}
            {showAdvanced && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full p-1 shadow-sm hover:bg-[var(--bg-surface-hover)] z-10 text-[var(--text-secondary)]"
                    title={isExpanded ? "Recolher Filtros" : "Expandir Filtros"}
                >
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            )}
        </div>
    )
}
