'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

// --- Helpers ---
async function checkAuth() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) throw new Error('Unauthorized: Please login')

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) throw new Error('Unauthorized: User not found')

    // For now, allow all logged in users to edit registrations? Or restrict to ADMIN?
    // Let's restrict to ADMIN for safety as per original plan
    if (user.role !== 'ADMIN') throw new Error('Unauthorized: Admin access required')

    return { session, user }
}

// --- Companies ---
export async function createCompany(data: { name: string, code?: string }) {
    const { session } = await checkAuth()
    await prisma.company.create({
        data: {
            name: data.name,
            code: data.code,
            tenantId: session.tenantId
        }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateCompany(id: string, data: { name: string, code?: string }) {
    await checkAuth()
    await prisma.company.update({
        where: { id },
        data
    })
    revalidatePath('/dashboard/registrations')
}

export async function deleteCompany(id: string) {
    await checkAuth()
    // Check dependencies: Budget Entries OR Departments
    const entriesCount = await prisma.budgetEntry.count({ where: { companyId: id } })
    const deptsCount = await prisma.grouping.count({ where: { companyId: id } })

    if (entriesCount > 0) throw new Error('Cannot delete: Company has associated budget entries.')
    if (deptsCount > 0) throw new Error('Cannot delete: Company has associated Departments.')

    await prisma.company.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Departments (Grouping) ---
export async function createDepartment(data: { name: string, code?: string, companyId: string }) {
    const { session } = await checkAuth()
    await prisma.grouping.create({
        data: { name: data.name, code: data.code, tenantId: session.tenantId, companyId: data.companyId }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateDepartment(id: string, data: { name: string, code?: string, companyId: string }) {
    await checkAuth()
    await prisma.grouping.update({ where: { id }, data: { name: data.name, code: data.code, companyId: data.companyId } })
    revalidatePath('/dashboard/registrations')
}

export async function deleteDepartment(id: string) {
    await checkAuth()
    const entriesCount = await prisma.budgetEntry.count({ where: { groupingId: id } })
    const ccCount = await prisma.costCenter.count({ where: { groupingId: id } })
    const segCount = await prisma.segment.count({ where: { groupingId: id } })

    if (entriesCount > 0) throw new Error('Cannot delete: Department has budget entries.')
    if (ccCount > 0) throw new Error('Cannot delete: Department has Cost Centers.')
    if (segCount > 0) throw new Error('Cannot delete: Department has Expense Centers.')

    await prisma.grouping.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Cost Centers ---
export async function createCostCenter(data: {
    name: string,
    code?: string,
    groupingId: string,
    clientId: string,
    cityId: string,
    groupId: string,
    segmentId: string
}) {
    const { session } = await checkAuth()
    await prisma.costCenter.create({
        data: {
            name: data.name,
            code: data.code,
            tenantId: session.tenantId,
            groupingId: data.groupingId,
            clientId: data.clientId,
            cityId: data.cityId,
            groupId: data.groupId,
            segmentId: data.segmentId
        }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateCostCenter(id: string, data: {
    name: string,
    code?: string,
    groupingId: string,
    clientId: string,
    cityId: string,
    groupId: string,
    segmentId: string
}) {
    await checkAuth()
    await prisma.costCenter.update({ where: { id }, data })
    revalidatePath('/dashboard/registrations')
}

export async function deleteCostCenter(id: string) {
    await checkAuth()
    const entriesCount = await prisma.budgetEntry.count({ where: { costCenterId: id } })

    if (entriesCount > 0) throw new Error('Cannot delete: Cost Center has budget entries.')

    await prisma.costCenter.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Clients ---
export async function createClient(data: { name: string }) {
    const { session } = await checkAuth()
    await prisma.client.create({
        data: { name: data.name, tenantId: session.tenantId }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateClient(id: string, data: { name: string }) {
    await checkAuth()
    await prisma.client.update({ where: { id }, data })
    revalidatePath('/dashboard/registrations')
}

export async function deleteClient(id: string) {
    await checkAuth()
    const count = await prisma.budgetEntry.count({ where: { clientId: id } })
    if (count > 0) throw new Error('Cannot delete: Client has budget entries.')
    const ccCount = await prisma.costCenter.count({ where: { clientId: id } })
    if (ccCount > 0) throw new Error('Cannot delete: Client has associated Cost Centers.')
    await prisma.client.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Cities ---
export async function createCity(data: { name: string, state: string }) {
    const { session } = await checkAuth()
    await prisma.city.create({
        data: { name: data.name, state: data.state, tenantId: session.tenantId }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateCity(id: string, data: { name: string, state: string }) {
    await checkAuth()
    await prisma.city.update({ where: { id }, data })
    revalidatePath('/dashboard/registrations')
}

export async function deleteCity(id: string) {
    await checkAuth()
    const ccCount = await prisma.costCenter.count({ where: { cityId: id } })
    if (ccCount > 0) throw new Error('Cannot delete: City has associated Cost Centers.')
    await prisma.city.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Cost Center Groups (Agrupamentos) ---
export async function createCostCenterGroup(data: { name: string }) {
    const { session } = await checkAuth()
    await prisma.costCenterGroup.create({
        data: { name: data.name, tenantId: session.tenantId }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateCostCenterGroup(id: string, data: { name: string }) {
    await checkAuth()
    await prisma.costCenterGroup.update({ where: { id }, data })
    revalidatePath('/dashboard/registrations')
}

export async function deleteCostCenterGroup(id: string) {
    await checkAuth()
    const ccCount = await prisma.costCenter.count({ where: { groupId: id } })
    if (ccCount > 0) throw new Error('Cannot delete: Group has associated Cost Centers.')
    await prisma.costCenterGroup.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Cost Center Segments (Seguimentos) ---
export async function createCostCenterSegment(data: { name: string }) {
    const { session } = await checkAuth()
    await prisma.costCenterSegment.create({
        data: { name: data.name, tenantId: session.tenantId }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateCostCenterSegment(id: string, data: { name: string }) {
    await checkAuth()
    await prisma.costCenterSegment.update({ where: { id }, data })
    revalidatePath('/dashboard/registrations')
}

export async function deleteCostCenterSegment(id: string) {
    await checkAuth()
    const ccCount = await prisma.costCenter.count({ where: { segmentId: id } })
    if (ccCount > 0) throw new Error('Cannot delete: Segment has associated Cost Centers.')
    await prisma.costCenterSegment.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

// --- Expense Centers (Segment/Centro de Despesa) ---
export async function createExpenseCenter(data: { name: string, code?: string, groupingId: string }) {
    const { session } = await checkAuth()
    await prisma.segment.create({
        data: { name: data.name, code: data.code, tenantId: session.tenantId, groupingId: data.groupingId }
    })
    revalidatePath('/dashboard/registrations')
}

export async function updateExpenseCenter(id: string, data: { name: string, code?: string, groupingId: string }) {
    await checkAuth()
    await prisma.segment.update({ where: { id }, data: { name: data.name, code: data.code, groupingId: data.groupingId } })
    revalidatePath('/dashboard/registrations')
}

export async function deleteExpenseCenter(id: string) {
    await checkAuth()
    const count = await prisma.budgetEntry.count({ where: { segmentId: id } })
    if (count > 0) throw new Error('Cannot delete: Expense Center has budget entries.')
    await prisma.segment.delete({ where: { id } })
    revalidatePath('/dashboard/registrations')
}

