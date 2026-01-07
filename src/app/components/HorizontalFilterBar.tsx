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
    clientId?: string | null
    segmentId?: string | null
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

    // --- Mutual Interdependence Logic ---

    // 1. "Valid Cost Centers" - The Key to Interdependence
    // Determine which Cost Centers are valid based on ALL active filters EXCEPT the dimension being filtered.
    // However, to simply filter option lists, we can define a simpler approach:
    // "Which CCs survive the current global filter set?" (ignoring the specific filter we are populating to avoiding circular empty lists?)
    // No, standard behavior:
    // If I select Client A, I should only see Depts that have CCs for Client A.
    // If I select Dept B, I should only see Clients that have CCs in Dept B.
    // If I select Client A AND Dept B, I should only see CCs that are in BOTH.

    // Step 1: Filter the "Central" table (Cost Centers) based on all criteria.
    // Since Cost Center links almost everything, we use it as the hub.

    const getValidCostCenters = (excludeFilter?: 'company' | 'dept' | 'client' | 'segment' | 'ccSegment' | 'city' | 'state') => {
        return costCenters.filter(cc => {
            // Check Company (via Dept)
            if (excludeFilter !== 'company' && currentFilters.companyIds.length > 0) {
                // Find department for this CC
                const dept = departments.find(d => d.id === cc.groupingId)
                if (!dept || !dept.companyId || !currentFilters.companyIds.includes(dept.companyId)) return false
            }

            // Check Department (Grouping)
            if (excludeFilter !== 'dept' && currentFilters.departmentIds.length > 0) {
                if (!cc.groupingId || !currentFilters.departmentIds.includes(cc.groupingId)) return false
            }

            // Check Client
            if (excludeFilter !== 'client' && currentFilters.clientIds.length > 0) {
                if (!cc.clientId || !currentFilters.clientIds.includes(cc.clientId)) return false
            }

            // Check Segment (Centro de Despesa linked to Dept - Logic Check)
            // If Segment Filter is active, it restricts Departments.
            if (excludeFilter !== 'segment' && currentFilters.segmentIds.length > 0) {
                // Find Dept, see if it has ANY segment in list? No, Segment filter usually means "Expenses tagged with Segment X".
                // But budget entries are what link Segment. CCs are structural.
                // However, schema says Segment is sibling to CC under Grouping.
                // If the user filters by Segment X, they likely want to see Cost Centers in the SAME Department as Segment X?
                // Or is it unrelated?
                // Re-reading Schema: BudgetEntry links Account, Company, CC, Client, Grouping, Segment independently?
                // Yes. But logical constraint: Segment belongs to Dept.
                // So if Segment X is selected, only CCs in Dept(Segment X) might be relevant structure-wise.
                // Simplification for now: Link via Department.
                // If Segment X selected -> Get Dept of Segment X -> Filter CCs by that Dept.
                const validDeptsForSegments = segments
                    .filter(s => currentFilters.segmentIds.includes(s.id))
                    .map(s => s.groupingId)
                    .filter(Boolean) as string[]

                if (validDeptsForSegments.length > 0) {
                    if (!cc.groupingId || !validDeptsForSegments.includes(cc.groupingId)) return false
                }
            }

            // Check CC Segment (Seguimento linked to CC)
            if (excludeFilter !== 'ccSegment' && currentFilters.ccSegmentIds.length > 0) {
                if (!cc.segmentId || !currentFilters.ccSegmentIds.includes(cc.segmentId)) return false
            }

            // Check City / State
            if (excludeFilter !== 'city' && excludeFilter !== 'state') {
                if (currentFilters.cityIds.length > 0) {
                    // Assuming CC has city linkage. If not directly in object, we need to look it up.
                    // FilterOption usually just has basic props.
                    // We need to ensure we have cityId.
                    // Assuming cityId matches (props are spread).
                    // If not, we might need a lookup using `cities`?
                    // Let's assume passed CC object has cityId if schema has it.
                    const ccCityId = (cc as any).cityId
                    if (!ccCityId || !currentFilters.cityIds.includes(ccCityId)) return false
                }
                if (currentFilters.states.length > 0) {
                    // Check via City
                    const ccCityId = (cc as any).cityId
                    const city = cities.find(c => c.id === ccCityId)
                    if (!city || !currentFilters.states.includes(city.state)) return false
                }
            }

            return true
        })
    }

    // --- Generate Options based on Valid CCs ---

    // 1. Cost Centers List:
    // Should be filtered by ALL other filters (Company, Dept, Client, etc.)
    // But NOT by itself (so we can select more).
    // Actually, usually dropdown shows options compatible with *other* fields.
    const validCCsForCCDropdown = getValidCostCenters() // Filter by everything active
    // But wait, if I have CC "A" selected, and I'm looking at list, I still want to see valid ones.
    // The list content should be "All CCs compatible with Company X, Client Y...".
    // It should NOT be filtered by `costCenterIds` (the selection itself).
    const compatibleCCs = getValidCostCenters() // This considers current CC selection?
    // No, `getValidCCs` filters *individual instances*.
    // We want the LIST OF OPTIONS.
    // The list of options available for "Cost Center" should be strictly determined by:
    // Companies, Depts, Clients, Segments, Cities.
    // IT SHOULD NOT BE FILTERED BY `costCenterIds` (current selection).
    // Use `getValidCostCenters` but pass nothing?
    // Wait, the logic inside `getValidCostCenters` DOES check `currentFilters`.
    // We should pass an ignore flag. But my helper signature logic was...
    // Let's rely on specific calls.

    const getCompatibleCCs = () => {
        // Start with ALL, filter by everything EXCEPT 'costCenterId'
        // Just re-use logic but ignore specific filter keys
        const companiesActive = currentFilters.companyIds.length > 0
        const departmentsActive = currentFilters.departmentIds.length > 0
        const clientsActive = currentFilters.clientIds.length > 0
        const ccSegmentsActive = currentFilters.ccSegmentIds.length > 0

        return costCenters.filter(cc => {
            if (companiesActive) {
                const dept = departments.find(d => d.id === cc.groupingId)
                if (!dept || !dept.companyId || !currentFilters.companyIds.includes(dept.companyId)) return false
            }
            if (departmentsActive) {
                if (!cc.groupingId || !currentFilters.departmentIds.includes(cc.groupingId)) return false
            }
            if (clientsActive) {
                if (!cc.clientId || !currentFilters.clientIds.includes(cc.clientId)) return false
            }
            if (ccSegmentsActive) {
                if (!cc.segmentId || !currentFilters.ccSegmentIds.includes(cc.segmentId)) return false
            }
            return true
        })
    }

    const filteredCostCenters = getCompatibleCCs()

    // 2. Clients List:
    // Filtered by Valid CCs (which are filtered by Company, Dept, Segment...)
    // BUT NOT filtered by Client selection itself.
    const getCompatibleClients = () => {
        const validCCsIgnoringClient = costCenters.filter(cc => {
            if (currentFilters.companyIds.length > 0) {
                const dept = departments.find(d => d.id === cc.groupingId)
                if (!dept || !dept.companyId || !currentFilters.companyIds.includes(dept.companyId)) return false
            }
            if (currentFilters.departmentIds.length > 0) {
                if (!cc.groupingId || !currentFilters.departmentIds.includes(cc.groupingId)) return false
            }
            // Ignore Client Filter here
            return true
        })

        const allowedClientIds = new Set(validCCsIgnoringClient.map(cc => cc.clientId).filter(Boolean))
        return clients.filter(c => allowedClientIds.has(c.id))
    }

    const filteredClients = getCompatibleClients()


    // 3. Departments List:
    // Filtered by Company.
    // AND filtered by Client? (If Client X selected, show only Depts that have CCs for Client X).
    const getCompatibleDepartments = () => {
        // Valid CCs ignoring Department filter
        const validCCsIgnoringDept = costCenters.filter(cc => {
            // Check Company
            if (currentFilters.companyIds.length > 0) {
                const dept = departments.find(d => d.id === cc.groupingId)
                // Filter Dept based on Company directly?
                // Yes, logic: Dept must belong to Company.
                // But we are finding VALID CCs first.
                // Logic: A CC is valid if its Dept belongs to Company.
                // So this check is essentially enforcing Company constraint on CC.
                if (!dept || !dept.companyId || !currentFilters.companyIds.includes(dept.companyId)) return false
            }
            // Check Client
            if (currentFilters.clientIds.length > 0) {
                if (!cc.clientId || !currentFilters.clientIds.includes(cc.clientId)) return false
            }
            return true
        })

        // Get Departments from these valid CCs
        const validDeptIdsFromCCs = new Set(validCCsIgnoringDept.map(cc => cc.groupingId).filter(Boolean))

        // Also, include Departments that match Company filter directly (even if no CCs? No, empty depts are valid if they match company).
        // But if Client is selected, we MUST restrict to Depts with that Client.

        return departments.filter(d => {
            // 1. Basic Company Check
            if (currentFilters.companyIds.length > 0 && (!d.companyId || !currentFilters.companyIds.includes(d.companyId))) return false

            // 2. Client/CC Linkage Check
            // If Client is selected, the Dept MUST be in the valid list derived from CCs.
            if (currentFilters.clientIds.length > 0) {
                if (!validDeptIdsFromCCs.has(d.id)) return false
            }

            return true
        })
    }

    const filteredDepartments = getCompatibleDepartments()


    // 4. Companies List:
    // Filtered by Client -> CC -> Dept -> Company
    const getCompatibleCompanies = () => {
        // Valid CCs ignoring Company filter
        const validCCsIgnoringCompany = costCenters.filter(cc => {
            if (currentFilters.clientIds.length > 0) {
                if (!cc.clientId || !currentFilters.clientIds.includes(cc.clientId)) return false
            }
            if (currentFilters.departmentIds.length > 0) {
                if (!cc.groupingId || !currentFilters.departmentIds.includes(cc.groupingId)) return false
            }
            return true
        })

        const validDeptIds = new Set(validCCsIgnoringCompany.map(cc => cc.groupingId).filter(Boolean))
        const validCompanyIds = new Set<string>()

        // Find companies for these departments
        departments.forEach(d => {
            if (validDeptIds.has(d.id) && d.companyId) validCompanyIds.add(d.companyId)
        })

        // If NO filters active that constrain company (Client, Dept, CC), return all.
        const isConstrained = currentFilters.clientIds.length > 0 || currentFilters.departmentIds.length > 0 || currentFilters.costCenterIds.length > 0

        if (!isConstrained) return companies

        return companies.filter(c => validCompanyIds.has(c.id))
    }

    const filteredCompanies = getCompatibleCompanies()


    // 5. Segments (Centro de Despesa)
    // Linked to Departments.
    const filteredSegments = (segments as any[]).filter(seg => {
        // Must belong to a valid Department (from the filtered list)
        return seg.groupingId && filteredDepartments.some(d => d.id === seg.groupingId)
    })

    // 6. CC Segments (Seguimento)
    // Derived from active CCs
    const filteredCCSegments = ccSegments.filter(ccs => {
        // Valid if ANY compatible CC uses it.
        // Use `filteredCostCenters` (which represents the set of CCs valid for OTHER filters)
        return filteredCostCenters.some(cc => cc.segmentId === ccs.id)
    })

    // 7. Cities / States
    // Derived from active CCs
    const filteredCities = cities.filter(city => {
        return filteredCostCenters.some(cc => (cc as any).cityId === city.id)
    })

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
