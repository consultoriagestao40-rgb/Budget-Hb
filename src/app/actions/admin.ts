'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function getSession() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error('Unauthorized')
    }
    return session
}

async function checkSuperAdmin() {
    const session = await getSession()
    if (session.role !== 'SUPER_ADMIN') {
        throw new Error('Forbidden: Acesso restrito a Super Admins.')
    }
    return session
}

export interface TenantWithStats {
    id: string
    name: string
    status: string
    plan: string
    createdAt: Date
    ownerName: string | null
    ownerEmail: string | null
    _count: {
        users: number
        companies: number
    }
}

export async function getTenants(): Promise<TenantWithStats[]> {
    await checkSuperAdmin()

    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            name: true,
            status: true,
            plan: true,
            createdAt: true,
            ownerName: true,
            ownerEmail: true,
            _count: {
                select: {
                    users: true,
                    companies: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return tenants
}

export async function updateTenantStatus(tenantId: string, status: string) {
    await checkSuperAdmin()

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { status }
    })

    revalidatePath('/admin')
}

export async function updateTenantPlan(tenantId: string, plan: string) {
    await checkSuperAdmin()

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan }
    })

    revalidatePath('/admin')
}

export async function deleteTenant(tenantId: string) {
    await checkSuperAdmin()

    // Prisma handles cascade deletes if configured, but let's be safe and explicit or rely on relation onDelete: Cascade.
    // Looking at schema, we don't have explicit Cascade on all relations (detected via User relation).
    // Let's rely on Prisma's ability or do a transaction.
    // Ideally schema should have onDelete: Cascade. 
    // Checking schema: User -> Tenant (no cascade), Company -> Tenant (no cascade).
    // So we must delete children first.

    await prisma.$transaction(async (tx) => {
        // Delete related data in order of dependency
        // 1. Budget Entries
        await tx.budgetEntry.deleteMany({ where: { tenantId } })

        // 2. Budget Versions
        await tx.budgetVersion.deleteMany({ where: { tenantId } })

        // 3. User Permissions
        const users = await tx.user.findMany({ where: { tenantId }, select: { id: true } })
        const userIds = users.map(u => u.id)
        await tx.userPermission.deleteMany({ where: { userId: { in: userIds } } })

        // 4. Users
        await tx.user.deleteMany({ where: { tenantId } })

        // 5. Structure (Cost Centers, Companies, etc.)
        await tx.costCenter.deleteMany({ where: { tenantId } })
        await tx.costCenterGroup.deleteMany({ where: { tenantId } })
        await tx.costCenterSegment.deleteMany({ where: { tenantId } })
        await tx.grouping.deleteMany({ where: { tenantId } })
        await tx.segment.deleteMany({ where: { tenantId } })
        await tx.client.deleteMany({ where: { tenantId } })
        await tx.city.deleteMany({ where: { tenantId } })
        await tx.company.deleteMany({ where: { tenantId } })
        await tx.accountPlan.deleteMany({ where: { tenantId } })

        // 6. Finally Delete Tenant
        await tx.tenant.delete({ where: { id: tenantId } })
    })

    revalidatePath('/admin')
}
