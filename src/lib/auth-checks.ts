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
    context: { companyId?: string | null, costCenterId?: string | null, segmentId?: string | null },
    action: PermissionAction
): Promise<boolean> {
    const perms = await prisma.userPermission.findMany({ where: { userId } })

    if (perms.length === 0) return false

    // 1. Company Level Check & Global Short-circuit
    if (context.companyId && context.companyId !== 'all') {
        const companyPerm = perms.find(p => p.companyId === context.companyId)
        if (!companyPerm) return false

        // If user has a "Global" permission for this company (no CC/Segment validation needed), 
        // and it allows the action, return TRUE immediately.
        // This covers "Admins" defined via UserPermission logic (null/null)
        const isGlobalPerm = perms.find(p =>
            p.companyId === context.companyId &&
            p.costCenterId === null &&
            p.segmentId === null
        )
        if (isGlobalPerm && isGlobalPerm[action]) {
            return true
        }

        if (!companyPerm[action]) return false
    }

    // 2. Cost Center Level Check
    if (context.costCenterId && context.costCenterId !== 'all') {
        const specificCCPerm = perms.find(p => p.costCenterId === context.costCenterId)

        if (specificCCPerm) {
            // Explicit rule for this CC takes precedence
            if (!specificCCPerm[action]) return false
        } else {
            // No specific rule. Check if we are in "Strict Mode".
            // Strict Mode = User has at least one CC restriction AND NO broad company permission?
            // BETTER LOGIC: If no specific rule, fallback to Broad/Company rule.
            // Find a permission for this company that has NO CC restriction (is Global)
            const broadPerm = perms.find(p => p.companyId === context.companyId && p.costCenterId === null)
            if (!broadPerm) return false // No broad permission either -> Deny
            if (!broadPerm[action]) return false
        }
    }

    // 3. Segment Level Check (Centro de Despesa)
    if (context.segmentId && context.segmentId !== 'all') {
        const specificSegmentPerm = perms.find(p => p.segmentId === context.segmentId)

        if (specificSegmentPerm) {
            if (!specificSegmentPerm[action]) return false
        } else {
            // Fallback to Broad Permission (Company or CC level) that has NO segment restriction
            // We need a perm that covers the current hierarchy but has segmentId = null
            // For simplicity: Check if there is ANY permission allowing this context with segmentId=null

            // Filter perms that match the current Company/CC context (or are broad enough)
            const applicableBroadPerms = perms.filter(p =>
                (p.companyId === context.companyId) &&
                (p.costCenterId === null || p.costCenterId === context.costCenterId) &&
                (p.segmentId === null)
            )

            // If any of these broad perms allow the action, we are good.
            const hasBroadAccess = applicableBroadPerms.some(p => p[action])
            if (!hasBroadAccess) return false
        }
    }

    return true
}
