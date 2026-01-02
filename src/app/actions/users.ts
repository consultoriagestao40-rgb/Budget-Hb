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
    const session = await getSession()
    await checkAdmin(session)

    return prisma.userPermission.findMany({
        where: { userId },
        include: {
            company: { select: { id: true, name: true } },
            costCenter: { select: { id: true, name: true, code: true } },
            segment: { select: { id: true, name: true, code: true } }
        }
    })
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

    await prisma.$transaction(async (tx) => {
        // 1. Delete all existing permissions for this user
        await tx.userPermission.deleteMany({ where: { userId } })

        // 2. Create new permissions
        if (permissions.length > 0) {
            for (const p of permissions) {
                // Ensure booleans
                const data: any = {
                    userId,
                    canView: !!p.canView,
                    canEdit: !!p.canEdit,
                    canCreate: !!p.canCreate,
                    canDelete: !!p.canDelete
                }

                if (p.type === 'COMPANY') data.companyId = p.entityId
                if (p.type === 'COST_CENTER') data.costCenterId = p.entityId
                // if (p.type === 'SEGMENT') data.segmentId = p.entityId

                console.log('Creating permission:', data)

                try {
                    await tx.userPermission.create({ data })
                } catch (e: any) {
                    console.error('Error creating permission:', e)
                    // Throw a clearer error for the UI
                    throw new Error(`Falha ao salvar permissão (${p.type}): ${e.message}`)
                }
            }
        }
    })

    revalidatePath('/dashboard/settings')
}
