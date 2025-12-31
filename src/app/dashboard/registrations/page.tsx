
import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import { RegistrationsView } from './RegistrationsView'

export default async function RegistrationsPage() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        redirect('/login')
    }

    const tenantId = session.tenantId

    // Parallel Fetch all entities
    const [
        companies,
        departments,
        costCenters,
        clients,
        expenseCenters,
        cities,
        costCenterGroups,
        costCenterSegments
    ] = await Promise.all([
        prisma.company.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.grouping.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.costCenter.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.client.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.segment.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.city.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.costCenterGroup.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
        prisma.costCenterSegment.findMany({ where: { tenantId }, orderBy: { name: 'asc' } })
    ])

    return (
        <RegistrationsView
            companies={companies}
            departments={departments}
            costCenters={costCenters}
            clients={clients}
            expenseCenters={expenseCenters}
            cities={cities}
            costCenterGroups={costCenterGroups}
            costCenterSegments={costCenterSegments}
        />
    )
}
