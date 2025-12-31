'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export async function createAccount(data: {
    tenantId: string
    name: string
    code: string
    type: 'INPUT' | 'CALCULATED'
    parentId?: string
    formula?: string
    percentage?: number
    baseCode?: string
}) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error('Unauthorized: Please login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    await prisma.accountPlan.create({
        data: {
            tenantId: data.tenantId,
            name: data.name,
            code: data.code,
            type: data.type,
            parentId: data.parentId,
            formula: data.formula,
            percentage: data.percentage,
            baseCode: data.baseCode
        }
    })
    revalidatePath('/dashboard/dre')
}

export async function deleteAccount(id: string) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error('Unauthorized: Please login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    console.log(`[AccountAction] Attempting to delete account ${id}`)
    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    try {
        // First delete budget entries associated
        console.log(`[AccountAction] Deleting budget entries for account ${id}`)
        const deletedEntries = await prisma.budgetEntry.deleteMany({
            where: { accountId: id }
        })
        console.log(`[AccountAction] Deleted ${deletedEntries.count} budget entries`)

        // Then delete the account
        console.log(`[AccountAction] Deleting account ${id}`)
        await prisma.accountPlan.delete({
            where: { id }
        })
        console.log(`[AccountAction] Account ${id} deleted successfully`)
    } catch (error: any) {
        console.error(`[AccountAction] Error deleting account ${id}:`, error)
        throw new Error(`Failed to delete account: ${error.message}`)
    }

    revalidatePath('/dashboard/dre')
}

export async function updateAccount(id: string, data: Partial<{
    name: string,
    code: string,
    formula: string,
    type: 'INPUT' | 'CALCULATED',
    percentage: number,
    baseCode: string
}>) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        throw new Error('Unauthorized: Please login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    await prisma.accountPlan.update({
        where: { id },
        data
    })
    revalidatePath('/dashboard/dre')
}
