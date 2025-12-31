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
