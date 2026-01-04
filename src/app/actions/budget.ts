'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { verifyPermission } from '@/lib/auth-checks'

export async function updateBudgetEntry(
    tenantId: string,
    accountId: string,
    month: number,
    year: number,
    amount: number,
    budgetVersionId: string,
    dimensions: {
        companyId: string
        costCenterId?: string | null
        clientId?: string | null
        groupingId?: string | null
        segmentId?: string | null
    }
) {
    // 1. Auth Check
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || session.tenantId !== tenantId) {
        throw new Error('Unauthorized')
    }

    // 2. Permission Check
    if (session.role !== 'ADMIN') {
        const hasPermission = await verifyPermission(session.userId, dimensions, 'canEdit')
        if (!hasPermission) {
            throw new Error('Forbidden: You do not have permission to edit entries in this scope')
        }
    }
    const existing = await prisma.budgetEntry.findFirst({
        where: {
            tenantId,
            accountId,
            month,
            year,
            budgetVersionId,
            companyId: dimensions.companyId,
            costCenterId: dimensions.costCenterId,
            clientId: dimensions.clientId,
            groupingId: dimensions.groupingId,
            segmentId: dimensions.segmentId
        }
    })

    if (existing) {
        if (amount === 0) {
            await prisma.budgetEntry.delete({ where: { id: existing.id } })
        } else {
            await prisma.budgetEntry.update({
                where: { id: existing.id },
                data: { amount }
            })
        }
    } else {
        if (amount !== 0) {
            await prisma.budgetEntry.create({
                data: {
                    tenantId,
                    accountId,
                    month,
                    year,
                    amount,
                    budgetVersionId,
                    companyId: dimensions.companyId,
                    costCenterId: dimensions.costCenterId,
                    clientId: dimensions.clientId,
                    groupingId: dimensions.groupingId,
                    segmentId: dimensions.segmentId
                }
            })
        }
    }

    revalidatePath('/dashboard/dre')
}

export async function batchUpdateBudgetEntries(
    tenantId: string,
    accountId: string,
    year: number,
    entries: { month: number; amount: number }[],
    budgetVersionId: string,
    dimensions: {
        companyId: string
        costCenterId?: string | null
        clientId?: string | null
        groupingId?: string | null
        segmentId?: string | null
    }
) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || session.tenantId !== tenantId) throw new Error('Unauthorized')

    // Verify and Sanitize Dimensions
    // Enforce empty strings to null for optional FKs to avoid "foreign key constraint failed" on empty strings
    const safeDimensions = {
        companyId: dimensions.companyId === 'all' ? '' : dimensions.companyId,
        costCenterId: (dimensions.costCenterId === 'all' || dimensions.costCenterId === '') ? null : dimensions.costCenterId,
        clientId: (dimensions.clientId === 'all' || dimensions.clientId === '') ? null : dimensions.clientId,
        groupingId: (dimensions.groupingId === 'all' || dimensions.groupingId === '') ? null : dimensions.groupingId,
        segmentId: (dimensions.segmentId === 'all' || dimensions.segmentId === '') ? null : dimensions.segmentId
    }

    if (!safeDimensions.companyId) {
        return { success: false, error: 'Database Error: Company ID is required for saving.' }
    }

    // Smart Context Resolution for "All" filters
    // If Cost Center is 'null' (All), but user only has permission for ONE specific Cost Center,
    // we assume they mean to save to that specific Cost Center.
    if (!safeDimensions.costCenterId && session.role !== 'ADMIN') {
        const userPerms = await prisma.userPermission.findMany({
            where: { userId: session.userId, companyId: safeDimensions.companyId }
        })

        // Check for Global Permission first
        const hasGlobalPerm = userPerms.some(p => p.costCenterId === null && p.canEdit)

        if (!hasGlobalPerm) {
            // No global permission. Check specific permissions.
            const allowedCCs = userPerms
                .filter(p => p.costCenterId !== null && p.canEdit)
                .map(p => p.costCenterId!)

            const uniqueCCs = Array.from(new Set(allowedCCs))

            if (uniqueCCs.length === 1) {
                // Auto-Scope to the single allowed Cost Center
                safeDimensions.costCenterId = uniqueCCs[0]
            } else if (uniqueCCs.length > 1) {
                return {
                    success: false,
                    error: 'Ambiguidade: Você tem acesso a múltiplos Centros de Custo. Por favor, selecione um específico no filtro para salvar.'
                }
            } else {
                // No permissions at all (will be caught by verifyPermission, but good to check)
            }
        }
    }

    if (session.role !== 'ADMIN') {
        const hasPermission = await verifyPermission(session.userId, safeDimensions, 'canEdit')
        if (!hasPermission) {
            // DEBUG DUMP
            const allPerms = await prisma.userPermission.findMany({
                where: { userId: session.userId },
                select: { companyId: true, costCenterId: true, segmentId: true, canEdit: true }
            })
            const debugInfo = JSON.stringify({
                ctx: safeDimensions,
                perms: allPerms
            }, null, 2)

            return { success: false, error: `Forbidden: Debug Info: ${debugInfo}` }
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            for (const entry of entries) {
                const existing = await tx.budgetEntry.findFirst({
                    where: {
                        tenantId,
                        accountId,
                        month: entry.month,
                        year,
                        budgetVersionId,
                        companyId: safeDimensions.companyId,
                        costCenterId: safeDimensions.costCenterId,
                        clientId: safeDimensions.clientId,
                        groupingId: safeDimensions.groupingId,
                        segmentId: safeDimensions.segmentId
                    }
                })

                if (existing) {
                    if (entry.amount === 0) {
                        await tx.budgetEntry.delete({ where: { id: existing.id } })
                    } else {
                        await tx.budgetEntry.update({ where: { id: existing.id }, data: { amount: entry.amount } })
                    }
                } else if (entry.amount !== 0) {
                    await tx.budgetEntry.create({
                        data: {
                            tenantId,
                            accountId,
                            month: entry.month,
                            year,
                            amount: entry.amount,
                            budgetVersionId,
                            companyId: safeDimensions.companyId!, // Assuming validated
                            costCenterId: safeDimensions.costCenterId,
                            clientId: safeDimensions.clientId,
                            groupingId: safeDimensions.groupingId,
                            segmentId: safeDimensions.segmentId
                        }
                    })
                }
            }
        })
    } catch (error: any) {
        console.error('Batch Update Failed:', error)
        // Unwrap Prisma Error
        const msg = error.code ? `Database Error ${error.code}: ${error.meta?.target || error.message}` : error.message
        return { success: false, error: msg }
    }

    // revalidatePath('/dashboard/dre')
    return { success: true }
}
