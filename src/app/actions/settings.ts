'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function getSession() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.tenantId) {
        throw new Error('Unauthorized')
    }
    return session
}

async function checkAdmin(session: SessionData) {
    if (session.role !== 'ADMIN') {
        throw new Error('Forbidden: Only Admins can manage settings')
    }
}

// --- Company Actions ---

export async function getCompanies() {
    const session = await getSession()
    return prisma.company.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createCompany(data: { name: string; code?: string }) {
    const session = await getSession()
    await checkAdmin(session)

    await prisma.company.create({
        data: {
            name: data.name,
            code: data.code,
            tenantId: session.tenantId
        }
    })
    revalidatePath('/dashboard/settings')
}

export async function deleteCompany(id: string) {
    const session = await getSession()
    await checkAdmin(session)

    // Check for dependencies
    const hasEntries = await prisma.budgetEntry.count({ where: { companyId: id } })
    if (hasEntries > 0) throw new Error('Cannot delete: Company has budget entries')

    await prisma.company.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

// --- Cost Center Actions ---

export async function getCostCenters() {
    const session = await getSession()
    return prisma.costCenter.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createCostCenter(data: { name: string; code?: string }) {
    const session = await getSession()
    await checkAdmin(session)

    await prisma.costCenter.create({
        data: {
            name: data.name,
            code: data.code,
            tenantId: session.tenantId
        }
    })
    revalidatePath('/dashboard/settings')
}

export async function deleteCostCenter(id: string) {
    const session = await getSession()
    await checkAdmin(session)

    const hasEntries = await prisma.budgetEntry.count({ where: { costCenterId: id } })
    if (hasEntries > 0) throw new Error('Cannot delete: Cost Center has budget entries')

    await prisma.costCenter.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

// --- Client Actions ---

export async function getClients() {
    const session = await getSession()
    return prisma.client.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createClient(name: string) {
    const session = await getSession()
    await checkAdmin(session)

    await prisma.client.create({
        data: {
            name,
            tenantId: session.tenantId
        }
    })
    revalidatePath('/dashboard/settings')
}

export async function deleteClient(id: string) {
    const session = await getSession()
    await checkAdmin(session)

    // Check for dependencies
    const hasCostCenters = await prisma.costCenter.count({ where: { clientId: id } })
    if (hasCostCenters > 0) throw new Error('Cannot delete: Client is linked to Cost Centers')

    const hasEntries = await prisma.budgetEntry.count({ where: { clientId: id } })
    if (hasEntries > 0) throw new Error('Cannot delete: Client has budget entries')

    await prisma.client.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

// --- Grouping (Department) Actions ---

export async function getGroupings() {
    const session = await getSession()
    return prisma.grouping.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createGrouping(data: { name: string; companyId?: string }) {
    const session = await getSession()
    await checkAdmin(session)
    await prisma.grouping.create({
        data: {
            name: data.name,
            companyId: data.companyId,
            tenantId: session.tenantId
        }
    })
    revalidatePath('/dashboard/settings')
}

export async function deleteGrouping(id: string) {
    const session = await getSession()
    await checkAdmin(session)
    const count = await prisma.costCenter.count({ where: { groupingId: id } })
    if (count > 0) throw new Error('Cannot delete: Department is used in Cost Centers')
    await prisma.grouping.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

// --- City Actions ---

export async function getCities() {
    const session = await getSession()
    return prisma.city.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createCity(name: string, state: string) {
    const session = await getSession()
    await checkAdmin(session)
    await prisma.city.create({ data: { name, state, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

export async function deleteCity(id: string) {
    const session = await getSession()
    await checkAdmin(session)
    const count = await prisma.costCenter.count({ where: { cityId: id } })
    if (count > 0) throw new Error('Cannot delete: City is used in Cost Centers')
    await prisma.city.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

// --- Cost Center Group Actions ---

export async function getCostCenterGroups() {
    const session = await getSession()
    return prisma.costCenterGroup.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createCostCenterGroup(name: string) {
    const session = await getSession()
    await checkAdmin(session)
    await prisma.costCenterGroup.create({ data: { name, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

export async function deleteCostCenterGroup(id: string) {
    const session = await getSession()
    await checkAdmin(session)
    const count = await prisma.costCenter.count({ where: { groupId: id } })
    if (count > 0) throw new Error('Cannot delete: Group is used in Cost Centers')
    await prisma.costCenterGroup.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

// --- Cost Center Segment Actions ---

export async function getCostCenterSegments() {
    const session = await getSession()
    return prisma.costCenterSegment.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' }
    })
}

export async function createCostCenterSegment(name: string) {
    const session = await getSession()
    await checkAdmin(session)
    await prisma.costCenterSegment.create({ data: { name, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

export async function deleteCostCenterSegment(id: string) {
    const session = await getSession()
    await checkAdmin(session)
    const count = await prisma.costCenter.count({ where: { segmentId: id } })
    if (count > 0) throw new Error('Cannot delete: Segment is used in Cost Centers')
    await prisma.costCenterSegment.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}
// --- Tenant Settings Actions ---

export async function updateTenantDreTitle(title: string) {
    const session = await getSession()
    await checkAdmin(session)
    await prisma.tenant.update({
        where: { id: session.tenantId },
        data: { dreTitle: title }
    })
    revalidatePath('/dashboard/dre')
}
