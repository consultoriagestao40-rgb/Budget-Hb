import { getDashboardSummary } from '../actions/dashboard'
import { DashboardSummary } from './DashboardSummary'
import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import { YearSelector } from '../components/YearSelector'
import { VersionSelector } from '../components/VersionSelector'

export default async function DashboardPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.tenantId) {
        redirect('/login')
    }

    const resolvedParams = await searchParams
    const yearParam = resolvedParams.year as string | undefined
    const currentYearStr = yearParam || '2025' // Default logic below handles clamping
    const rawYear = parseInt(currentYearStr)

    const tenantId = session.tenantId

    // 1. Fetch Tenant Config (Min/Max Year)
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const minYear = tenant?.minYear || 2024
    const maxYear = tenant?.maxYear || 2027

    // Clamp currentYear
    const currentYear = Math.min(Math.max(rawYear, minYear), maxYear)

    // 2. Fetch Versions
    const budgetVersions = await prisma.budgetVersion.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' }
    })

    // Resolve Active Version
    const versionParam = resolvedParams.versionId as string | undefined
    const activeVersionId = (versionParam && budgetVersions.find(v => v.id === versionParam))
        ? versionParam
        : (budgetVersions[0]?.id || '')

    const summaryData = await getDashboardSummary(currentYear, activeVersionId)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                    Visão Geral ({currentYear})
                </h2>

                <div className="flex flex-wrap items-center gap-4">
                    <VersionSelector
                        versions={budgetVersions}
                        currentVersionId={activeVersionId}
                    />
                    <YearSelector
                        currentYear={currentYear}
                        minYear={minYear}
                        maxYear={maxYear}
                        currentVersionId={activeVersionId}
                    />
                </div>
            </div>

            <DashboardSummary data={summaryData} userRole={session.role || 'USER'} />
        </div>
    )
}
