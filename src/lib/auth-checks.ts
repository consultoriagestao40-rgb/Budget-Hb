import { prisma } from '@/lib/prisma'

export type PermissionAction = 'canView' | 'canEdit' | 'canCreate' | 'canDelete'

/**
 * Verifies if a user has specific permission for a context.
 * 
 * Rules:
 * 1. If user has NO permissions recorded, access is DENIED (unless Admin, checked by caller).
 * 2. If 'companyId' is provided, user MUST have a permission record for that company, AND the record must enable the action.
 * 3. If 'costCenterId' is provided:
 *    - If user has specific CC permissions designated, they MUST match this CC, AND enable the action.
 *    - If user has NO CC permissions designated (UserPermission.costCenterId is null for all), they inherit Company access.
 */
export async function verifyPermission(
    userId: string,
    context: { companyId?: string | null, costCenterId?: string | null },
    action: PermissionAction
): Promise<boolean> {
    const perms = await prisma.userPermission.findMany({ where: { userId } })

    if (perms.length === 0) return false

    // 1. Company Level Check
    if (context.companyId) {
        const companyPerm = perms.find(p => p.companyId === context.companyId)
        if (!companyPerm) return false
        if (!companyPerm[action]) return false
    }

    // 2. Cost Center Level Check
    if (context.costCenterId) {
        const hasCCRestrictions = perms.some(p => p.costCenterId !== null)

        if (hasCCRestrictions) {
            const ccPerm = perms.find(p => p.costCenterId === context.costCenterId)
            // If restricted to specific CCs, and this one is not in list -> Deny
            if (!ccPerm) return false

            // If found, check action flag
            if (!ccPerm[action]) return false
        } else {
            // No CC restrictions, so if Company check passed, we are good.
            // (Implied access to all CCs in the permitted company)
        }
    }

    return true
}
