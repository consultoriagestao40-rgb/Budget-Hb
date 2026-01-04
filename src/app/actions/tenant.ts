'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function updateTenantProfile(data: {
    website?: string
    address?: string
    cnpj?: string
    phone?: string
    logoUrl?: string
    description?: string
    ownerName?: string
    name?: string
}) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.isLoggedIn || !session.tenantId) {
        throw new Error('Unauthorized')
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        throw new Error('Apenas administradores podem editar o perfil da empresa.')
    }

    try {
        await prisma.tenant.update({
            where: { id: session.tenantId },
            data: {
                website: data.website,
                address: data.address,
                cnpj: data.cnpj,
                phone: data.phone,
                logoUrl: data.logoUrl,
                description: data.description,
                ownerName: data.ownerName,
                name: data.name
            }
        })

        revalidatePath('/dashboard/settings')
        revalidatePath('/dashboard') // Revalidate master layout in case name/logo is used there
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update tenant profile:', error)
        throw new Error('Falha ao atualizar perfil: ' + error.message)
    }
}

export async function getTenantProfile() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.isLoggedIn || !session.tenantId) {
        throw new Error('Unauthorized')
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true,
            website: true,
            address: true,
            cnpj: true,
            phone: true,
            logoUrl: true,
            description: true
        }
    })

    return tenant
}
