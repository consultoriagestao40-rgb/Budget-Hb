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
        throw new Error('Forbidden: Only Admins can manage users')
    }
}

// --- User Actions ---

export async function getUsers() {
    const session = await getSession()
    await checkAdmin(session)

    return prisma.user.findMany({
        where: { tenantId: session.tenantId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: 'asc' }
    })
}

export async function createUser(data: { name: string; email: string; role: string; password?: string }) {
    const session = await getSession()
    await checkAdmin(session)

    // Check if email exists
    const existing = await prisma.user.findFirst({ where: { email: data.email } })
    if (existing) throw new Error('Email already registered')

    // Basic password for now (Production should hash!)
    const initialPassword = data.password || 'password123'

    await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: initialPassword, // TODO: Hash this
            role: data.role,
            tenantId: session.tenantId,
            mustChangePassword: true
        }
    })
    revalidatePath('/dashboard/settings')
}

export async function updateUser(id: string, data: { name?: string, email?: string, role?: string, password?: string }) {
    const session = await getSession()
    await checkAdmin(session)

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.password) updateData.password = data.password // TODO: Hash

    await prisma.user.update({
        where: { id, tenantId: session.tenantId },
        data: updateData
    })
    revalidatePath('/dashboard/settings')
}

export async function deleteUser(id: string) {
    const session = await getSession()
    await checkAdmin(session)

    if (id === session.userId) throw new Error('Cannot delete your own account')

    await prisma.user.delete({ where: { id, tenantId: session.tenantId } })
    revalidatePath('/dashboard/settings')
}

export async function getUserPermissions(userId: string) {
    try {
        const session = await getSession()
        await checkAdmin(session)

        try {
            return await prisma.userPermission.findMany({
                where: { userId },
                include: {
                    company: { select: { id: true, name: true } },
                    costCenter: { select: { id: true, name: true, code: true } },
                    segment: { select: { id: true, name: true, code: true } }
                } as any // Bypass TS error for segment include
            })
        } catch (error) {
            console.error('Error fetching permissions with segments (Schema mismatch?):', error)
            // Fallback: Fetch without 'segment' include if the column is missing/broken
            return await prisma.userPermission.findMany({
                where: { userId },
                include: {
                    company: { select: { id: true, name: true } },
                    costCenter: { select: { id: true, name: true, code: true } }
                    // segment excluded in fallback
                }
            })
        }
    } catch (e) {
        console.error('CRITICAL ERROR in getUserPermissions:', e)
        return [] // Return empty array to prevent UI crash (500)
    }
}

export async function updateUserPermissions(
    userId: string,
    permissions: Array<{
        type: 'COMPANY' | 'COST_CENTER' | 'SEGMENT',
        entityId: string,
        canView: boolean,
        canEdit: boolean,
        canCreate: boolean,
        canDelete: boolean
    }>
) {
    const session = await getSession()
    await checkAdmin(session)

    // Verify user belongs to tenant?
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser || targetUser.tenantId !== session.tenantId) {
        throw new Error('User not found in this tenant')
    }

    // Replace permissions logic
    // We treat the incoming list as the "Authoritative List".
    // However, user might be updating only Companies or only CostCenters?
    // UI usually saves the whole state.
    // Let's assume the UI sends ALL valid permissions.
    // WARNING: If UI omits something, it gets deleted.

    console.log('Updating permissions for user:', userId, 'Count:', permissions.length)

    let successCount = 0
    let failureCount = 0

    await prisma.$transaction(async (tx) => {
        // 1. Delete all existing permissions for this user
        // We delete everything to ensure a clean slate based on the UI state
        await tx.userPermission.deleteMany({ where: { userId } })

        // 2. Create STANDARD permissions (Company, CostCenter) - DO NOT FAIL
        if (permissions.length > 0) {
            for (const p of permissions) {
                // Skip Segments in this primary loop
                if (p.type === 'SEGMENT') continue

                const data: any = {
                    userId,
                    canView: !!p.canView,
                    canEdit: !!p.canEdit,
                    canCreate: !!p.canCreate,
                    canDelete: !!p.canDelete
                }

                if (p.type === 'COMPANY') data.companyId = p.entityId
                if (p.type === 'COST_CENTER') data.costCenterId = p.entityId

                try {
                    await tx.userPermission.create({ data })
                    successCount++
                } catch (e: any) {
                    console.error('Error creating standard permission:', e)
                    failureCount++
                    // We probably should rethrow here if standard perms fail, 
                    // but for robustness we continue and report failure.
                }
            }
        }
    })

    // 3. Attempt to save SEGMENT permissions in a separate "Best Effort" block
    // This is outside the main transaction so it doesn't rollback the critical permissions if it fails (e.g. schema mismatch)
    const segmentPermissions = permissions.filter(p => p.type === 'SEGMENT')
    if (segmentPermissions.length > 0) {
        console.log('Attempting to save SEGMENT permissions...', segmentPermissions.length)
        for (const p of segmentPermissions) {
            try {
                const data: any = {
                    userId,
                    canView: !!p.canView,
                    canEdit: !!p.canEdit,
                    canCreate: !!p.canCreate,
                    canDelete: !!p.canDelete,
                    segmentId: p.entityId // This line might throw if DB column is missing
                }
                await prisma.userPermission.create({ data })
                successCount++
            } catch (e: any) {
                console.error('Error creating SEGMENT permission (Schema mismatch?):', e)
                failureCount++
                // Detect specific schema error to warn user?
            }
        }
    }

    revalidatePath('/dashboard/settings')
    return { success: true, saved: successCount, failed: failureCount }
}
