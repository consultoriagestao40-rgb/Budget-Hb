import { getDashboardSummary } from '../actions/dashboard'
import { DashboardSummary } from './DashboardSummary'

export default async function DashboardPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams
    const yearParam = resolvedParams.year as string | undefined
    const currentYear = yearParam ? parseInt(yearParam) : 2025 // Default to 2025 or use Tenant logic ideally
    const versionId = resolvedParams.versionId as string | undefined

    const summaryData = await getDashboardSummary(currentYear, versionId)

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                Visão Geral ({currentYear})
            </h2>
            <DashboardSummary data={summaryData} />
        </div>
    )
}
