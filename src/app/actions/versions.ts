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
    if (session.role === 'ADMIN') return

    // Heuristics for "Owner" who might have missed the ADMIN tag
    // 1. If Tenant has ownerEmail set and matches session
    const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })
    if (tenant?.ownerEmail === session.email) return

    // 2. If Tenant has only 1 user, that user is effectively Admin
    const userCount = await prisma.user.count({ where: { tenantId: session.tenantId } })
    if (userCount === 1) return

    throw new Error('Forbidden: Only Admins can manage versions')
}

// --- Versions ---

export async function getVersions() {
    const session = await getSession()
    return prisma.budgetVersion.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { createdAt: 'asc' }
    })
}

export async function createVersion(data: { name: string; color?: string; copyFromId?: string }) {
    const session = await getSession()
    await checkAdmin(session)

    // 1. Create Version
    const newVersion = await prisma.budgetVersion.create({
        data: {
            name: data.name,
            color: data.color || '#94a3b8',
            tenantId: session.tenantId
        }
    })

    // 2. Duplicate Data if requested
    if (data.copyFromId) {
        const sourceEntries = await prisma.budgetEntry.findMany({
            where: {
                tenantId: session.tenantId,
                budgetVersionId: data.copyFromId
            }
        })

        if (sourceEntries.length > 0) {
            const newEntries = sourceEntries.map(entry => ({
                month: entry.month,
                year: entry.year,
                amount: entry.amount,
                tenantId: session.tenantId,
                budgetVersionId: newVersion.id,
                accountId: entry.accountId,
                companyId: entry.companyId,
                costCenterId: entry.costCenterId,
                groupingId: entry.groupingId,
                clientId: entry.clientId,
                segmentId: entry.segmentId,
                city: entry.city,
                state: entry.state
                // id, createdAt, updatedAt are auto-generated
            }))

            // Batch insert
            await prisma.budgetEntry.createMany({
                data: newEntries
            })
        }
    }

    revalidatePath('/dashboard/dre')
    return newVersion
}

export async function updateVersion(id: string, data: { name?: string; color?: string }) {
    const session = await getSession()
    await checkAdmin(session)

    await prisma.budgetVersion.update({
        where: { id, tenantId: session.tenantId },
        data
    })
    revalidatePath('/dashboard/dre')
}

export async function deleteVersion(id: string) {
    const session = await getSession()
    await checkAdmin(session)

    // Budget Entries will be deleted cascade? No, we didn't set onDelete: Cascade in database.
    // So we must delete entries manually first.

    await prisma.budgetEntry.deleteMany({
        where: { budgetVersionId: id, tenantId: session.tenantId }
    })

    await prisma.budgetVersion.delete({
        where: { id, tenantId: session.tenantId }
    })
    revalidatePath('/dashboard/dre')
}

// --- Year Configuration ---

export async function updateYearRange(minYear: number, maxYear: number) {
    try {
        const session = await getSession()
        await checkAdmin(session)

        console.log(`Updating year range for tenant ${session.tenantId}: ${minYear} - ${maxYear}`)

        await prisma.tenant.update({
            where: { id: session.tenantId },
            data: { minYear, maxYear }
        })

        revalidatePath('/dashboard/dre')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update year range:', error)
        return { success: false, error: error.message || 'Failed to update year range' }
    }
}

export async function clearYearData(year: number, versionId: string) {
    const session = await getSession()
    await checkAdmin(session)

    await prisma.budgetEntry.deleteMany({
        where: {
            tenantId: session.tenantId,
            year: year,
            budgetVersionId: versionId
        }
    })
    revalidatePath('/dashboard/dre')
}
