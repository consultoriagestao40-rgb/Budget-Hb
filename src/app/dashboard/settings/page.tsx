import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.isLoggedIn) {
        redirect('/login')
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl text-[var(--danger)]">Acesso Negado</h1>
                <p className="text-[var(--text-secondary)]">Apenas administradores podem acessar as configurações.</p>
            </div>
        )
    }

    const [companies, costCenters, clients, users, cities, groups, segments, groupings, tenant] = await Promise.all([
        prisma.company.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.costCenter.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.client.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.user.findMany({
            where: { tenantId: session.tenantId },
            orderBy: { name: 'asc' }
        }),
        prisma.city.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.costCenterGroup.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.costCenterSegment.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.grouping.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: 'asc' } }),
        prisma.tenant.findUnique({ where: { id: session.tenantId } })
    ])

    return (
        <div className="container mx-auto max-w-5xl">
            <SettingsClient
                initialCompanies={companies}
                initialCostCenters={costCenters}
                initialClients={clients}
                initialUsers={users}
                initialCities={cities}
                initialGroups={groups}
                initialSegments={segments}
                initialGroupings={groupings}
                initialTenant={tenant}
            />
        </div>
    )
}
