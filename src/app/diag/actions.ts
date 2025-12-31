'use server'

import { prisma } from "@/lib/prisma"

export async function repairSchema() {
    try {
        console.log('Starting Schema Repair...')

        // Execute Raw SQL to add missing columns safely
        // Postgres syntax
        const commands = [
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "website" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "address" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "cnpj" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "phone" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "description" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "ownerName" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "ownerEmail" TEXT;`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';`,
            `ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';`
        ]

        for (const sql of commands) {
            await prisma.$executeRawUnsafe(sql)
        }

        console.log('Schema Repair Completed.')
        return { success: true, message: 'Database schema repaired successfully.' }
    } catch (e: any) {
        console.error('Schema Repair Failed:', e)
        return { success: false, error: e.message }
    }
}
