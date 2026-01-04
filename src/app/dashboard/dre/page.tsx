import { prisma, AccountPlan, BudgetEntry } from '@/lib/prisma'
import { DreView } from './DreView'
import { DreRow } from '@/types/dre'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'

async function getDreData(
    tenantId: string,
    year: number,
    filters: {
        companyId?: string
        costCenterId?: string
        clientId?: string
        versionId: string
        segmentId?: string // Centro de Despesa
        ccSegmentId?: string // Seguimento
        departmentId?: string
        cityId?: string
        state?: string
    },
    constraints?: {
        allowedCompanyIds?: string[]
        allowedCostCenterIds?: string[]
        allowedSegmentIds?: string[]
    }
) {
    // 1. Fetch Account Plan
    const accounts = await prisma.accountPlan.findMany({
        where: { tenantId },
        orderBy: { code: 'asc' }
    })

    // 2. Fetch Budget Entries for the year
    const whereClause: any = {
        tenantId,
        year,
        budgetVersionId: filters.versionId,
    }

    // 4. Robust Filtering Logic
    const andConditions: any[] = []

    // --- Company Filter ---
    // --- Permission Constraints (Base Scope) ---
    // User can see data if they have access to the Company OR the Cost Center
    // We must combine these constraints with OR, not AND.
    const permissionConditions: any[] = []

    const hasGranularCostCenters = constraints?.allowedCostCenterIds && constraints.allowedCostCenterIds.length > 0
    const hasGranularSegments = constraints?.allowedSegmentIds && constraints.allowedSegmentIds.length > 0

    if (hasGranularCostCenters || hasGranularSegments) {
        // Granular Mode: User has specified sub-items.
        if (hasGranularCostCenters) {
            permissionConditions.push({ costCenterId: { in: constraints!.allowedCostCenterIds } })
        }
        if (hasGranularSegments) {
            permissionConditions.push({ segmentId: { in: constraints!.allowedSegmentIds } })
        }
    } else if (constraints?.allowedCompanyIds?.length) {
        // Broad Mode: Full Company Access
        permissionConditions.push({
            OR: [
                { companyId: { in: constraints.allowedCompanyIds } },
                { grouping: { companyId: { in: constraints.allowedCompanyIds } } },
                { costCenter: { grouping: { companyId: { in: constraints.allowedCompanyIds } } } },
                { segment: { grouping: { companyId: { in: constraints.allowedCompanyIds } } } }
            ]
        })
    }

    // Apply Permissions as a single AND condition containing the ORs
    // WHERE (CompAllowed OR CCAllowed)
    if (permissionConditions.length > 0) {
        andConditions.push({ OR: permissionConditions })
    }


    // --- User Selected Filters (Refining the view) ---
    // These behave as standard filters (AND)

    // Company Filter
    if (filters.companyId && filters.companyId !== 'all') {
        andConditions.push({
            OR: [
                { companyId: filters.companyId },
                { grouping: { companyId: filters.companyId } },
                { costCenter: { grouping: { companyId: filters.companyId } } },
                { segment: { grouping: { companyId: filters.companyId } } }
            ]
        })
    }

    // Cost Center Filter
    if (filters.costCenterId && filters.costCenterId !== 'all') {
        andConditions.push({ costCenterId: filters.costCenterId })
    }

    // --- Department Filter (Grouping) ---
    if (filters.departmentId && filters.departmentId !== 'all') {
        andConditions.push({
            OR: [
                { groupingId: filters.departmentId },
                { costCenter: { groupingId: filters.departmentId } },
                { segment: { groupingId: filters.departmentId } }
            ]
        })
    }

    // Apply AND conditions
    if (andConditions.length > 0) {
        whereClause.AND = andConditions
    }

    // --- Other Simple Filters ---
    if (filters.segmentId && filters.segmentId !== 'all') whereClause.segmentId = filters.segmentId
    if (filters.clientId && filters.clientId !== 'all') whereClause.clientId = filters.clientId

    // Complex relationships filters
    if (filters.ccSegmentId && filters.ccSegmentId !== 'all') {
        whereClause.costCenter = { segmentId: filters.ccSegmentId }
    }

    if (filters.cityId && filters.cityId !== 'all') {
        // Resolve City Name? No, filter by linking to CostCenter or if BudgetEntry has cityId... 
        // Based on previous analysis, we'll try filtering via CostCenter cityId relationship if available
        // OR rely on BudgetEntry denormalized fields if they match.
        // Assuming CostCenter relationship is safest for metadata not on Entry
        whereClause.costCenter = { ...whereClause.costCenter, cityId: filters.cityId }
    }

    if (filters.state && filters.state !== 'all') {
        whereClause.costCenter = {
            ...whereClause.costCenter,
            city: { state: filters.state }
        }
    }

    const entries = await prisma.budgetEntry.findMany({
        where: whereClause
    })

    // 3. Transform to Tree & Calculate
    const accountMap = new Map<string, DreRow>()

    // Initialize rows
    accounts.forEach(acc => {
        accountMap.set(acc.id, {
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            formula: acc.formula,
            percentage: acc.percentage,
            baseCode: acc.baseCode,
            parentId: acc.parentId,
            values: Array(12).fill(0),
            children: [],
            level: acc.code.split('.').length - 1
        })
    })

    // Fill Input Values
    entries.forEach(entry => {
        const row = accountMap.get(entry.accountId)
        if (row && row.type === 'INPUT') {
            row.values[entry.month - 1] += entry.amount
        }
    })

    // Build Tree
    const rootRows: DreRow[] = []
    const allRows = Array.from(accountMap.values())

    allRows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))

    allRows.forEach(row => {
        if (row.parentId) {
            const parent = accountMap.get(row.parentId)
            if (parent) {
                parent.children.push(row)
            }
        } else {
            rootRows.push(row)
        }
    })

    // Calculate Function
    for (let pass = 0; pass < 10; pass++) {
        allRows.forEach(row => {
            if (row.type === 'CALCULATED') {
                if (row.formula) {
                    for (let m = 0; m < 12; m++) {
                        const expression = row.formula.replace(/@([\w\.]+)/g, (match, code) => {
                            const targetRow = allRows.find(r => r.code === code)
                            return targetRow ? targetRow.values[m].toString() : '0'
                        })
                        try {
                            // eslint-disable-next-line
                            const result = new Function(`return ${expression}`)()
                            row.values[m] = typeof result === 'number' && !isNaN(result) ? result : 0
                        } catch (e) {
                            console.error(`Error calculating formula for ${row.code}: ${row.formula}`, e)
                            row.values[m] = 0
                        }
                    }
                } else if (row.baseCode && row.percentage !== null && row.percentage !== undefined) {
                    const baseRow = allRows.find(r => r.code === row.baseCode)
                    for (let m = 0; m < 12; m++) {
                        const baseValue = baseRow ? baseRow.values[m] : 0
                        row.values[m] = baseValue * (row.percentage / 100)
                    }
                } else {
                    for (let m = 0; m < 12; m++) {
                        row.values[m] = row.children.reduce((sum, child) => sum + child.values[m], 0)
                    }
                }
            }
        })
    }

    return rootRows
}

export default async function DrePage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams
    const companyId = resolvedParams.companyId as string | undefined
    const costCenterId = resolvedParams.costCenterId as string | undefined
    const clientId = resolvedParams.clientId as string | undefined
    const segmentId = resolvedParams.segmentId as string | undefined
    const ccSegmentId = resolvedParams.ccSegmentId as string | undefined
    const departmentId = resolvedParams.departmentId as string | undefined
    const cityId = resolvedParams.cityId as string | undefined
    const state = resolvedParams.state as string | undefined

    const yearParam = resolvedParams.year as string | undefined
    const currentYear = yearParam ? parseInt(yearParam) : 2025

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        redirect('/login')
    }

    const tenantId = session.tenantId

    // Get User Permissions
    // Get User Permissions with Defensive Fallback
    let user;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: {
                permissions: {
                    select: {
                        companyId: true,
                        costCenterId: true,
                        segmentId: true,
                        canView: true
                    }
                }
            }
        })
    } catch (error) {
        console.error("Error fetching permissions with segmentId in DRE:", error)
        // Fallback: Fetch without segmentId if schema mismatch occurs
        user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: {
                permissions: {
                    select: {
                        companyId: true,
                        costCenterId: true,
                        // segmentId omitted
                        canView: true
                    }
                }
            }
        })
    }

    // Cast to any to bypass TS error if schema type is outdated in editor
    const userTyped = user as any

    // @ts-ignore - Prisma include inference
    const permissions = userTyped?.permissions || []

    const allowedCompanyIds = permissions.filter((p: any) => p.companyId).map((p: any) => p.companyId!)
    const allowedCostCenterIds = permissions.filter((p: any) => p.costCenterId).map((p: any) => p.costCenterId!)
    const allowedSegmentIds = permissions.filter((p: any) => p.segmentId).map((p: any) => p.segmentId!)

    const companyFilter: any = { tenantId }
    if (allowedCompanyIds.length > 0) {
        companyFilter.id = { in: allowedCompanyIds }
    }

    const costCenterFilter: any = { tenantId }
    if (allowedCostCenterIds.length > 0) {
        costCenterFilter.id = { in: allowedCostCenterIds }
    }

    // Security Check: Deny if no permissions and not Admin
    const hasAnyPermission = allowedCompanyIds.length > 0 || allowedCostCenterIds.length > 0 || allowedSegmentIds.length > 0
    if (!hasAnyPermission && user?.role !== 'ADMIN') {
        // Return empty view immediately
        return (
            <div className="flex items-center justify-center h-screen text-[var(--text-secondary)]">
                Acesso negado. Nenhuma permissão atribuída.
            </div>
        )
    }

    // Version Logic
    const budgetVersions = await prisma.budgetVersion.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' }
    })
    const versionParam = resolvedParams.versionId as string | undefined
    const activeVersionId = (versionParam && budgetVersions.find(v => v.id === versionParam))
        ? versionParam
        : (budgetVersions[0]?.id || '')

    // 1. Fetch Tenant Config FIRST to ensure safe year
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const tMin = tenant?.minYear || 2024
    const tMax = tenant?.maxYear || 2027

    // Clamp Year - Ensure we never fetch/render data for an invalid year
    const effectiveYear = Math.min(Math.max(currentYear, tMin), tMax)

    // 2. Fetch Data using SAFE effectiveYear
    let [data, companies, costCenters, clients, segments, ccSegments, cities, departments] = await Promise.all([
        getDreData(tenantId, effectiveYear, {
            companyId, costCenterId, clientId, versionId: activeVersionId,
            segmentId, ccSegmentId, departmentId, cityId, state
        }, {
            allowedCompanyIds: allowedCompanyIds.length > 0 ? allowedCompanyIds : undefined,
            allowedCostCenterIds: allowedCostCenterIds.length > 0 ? allowedCostCenterIds : undefined,
            allowedSegmentIds: allowedSegmentIds.length > 0 ? allowedSegmentIds : undefined
        }),
        prisma.company.findMany({ where: companyFilter }),
        prisma.costCenter.findMany({ where: costCenterFilter }),
        prisma.client.findMany({ where: { tenantId } }),
        prisma.segment.findMany({ where: { tenantId } }),
        prisma.costCenterSegment.findMany({ where: { tenantId } }),
        prisma.city.findMany({ where: { tenantId } }),
        prisma.grouping.findMany({ where: { tenantId } }), // Departments
    ])

    // SECURITY: Limit Lines for Non-Admins
    if (user?.role !== 'ADMIN') {
        // Universal Rule: Show lines 1 to 7 (Operational). Hide 8+ (Financial/Result)
        data = data.filter(row => {
            if (!row.code) return true // Headers?
            // Parse first part of code (e.g., "7.1" -> 7)
            const mainGroup = parseInt(row.code.split('.')[0], 10)
            return !isNaN(mainGroup) && mainGroup < 8
        })
    }

    // Extract unique states
    const states = Array.from(new Set(cities.filter(c => c.state).map(c => c.state!))).sort()

    return (
        <>
            <DreView
                initialData={data}
                tenantId={tenantId}
                dreTitle={tenant?.dreTitle || "Demonstrativo de Resultados (DRE)"}
                currentYear={effectiveYear} // Pass effective year
                versions={budgetVersions}
                currentVersionId={activeVersionId}
                minYear={tMin}
                maxYear={tMax}

                // Filter Data
                companies={companies}
                departments={departments}
                costCenters={costCenters}
                clients={clients}
                segments={segments}
                ccSegments={ccSegments}
                cities={cities}
                states={states}

                filters={{ companyId, departmentId, costCenterId, clientId, segmentId, ccSegmentId }}
                userRole={user?.role || 'USER'}
                userPermissions={permissions}
            />
            {resolvedParams.debug === 'true' && (
                <div className="p-4 mt-8 bg-black/80 text-green-400 font-mono text-xs rounded border border-green-800 overflow-auto">
                    <h3 className="font-bold text-lg mb-2">🔍 DRE Debug Panel</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-bold text-white mb-1">User Permissions (Resolved)</h4>
                            <pre>{JSON.stringify({
                                allowedCompanyIds,
                                allowedCostCenterIds,
                                allowedSegmentIds
                            }, null, 2)}</pre>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mt-2 mb-1">Query Conditions</h4>
                            <p>Tenant ID: {tenantId}</p>
                            <p>Year: {effectiveYear}</p>
                            <h4 className="font-bold text-white mt-2 mb-1">Entries Found</h4>
                            <p className="text-xl font-bold">{data.reduce((acc: number, r: any) => acc + r.values.reduce((s: number, v: number) => s + v, 0), 0) !== 0 ? 'Has Values' : 'All Zeros'}</p>
                            <p>Total Rows: {data.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
