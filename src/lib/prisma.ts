// Import from standard @prisma/client for Vercel compatibility
import { PrismaClient } from '@prisma/client'
export * from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Force a new instance when needed, though local import usually fixes it
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient()

if (typeof window === 'undefined') {
    const models = Object.keys(prismaInstance).filter(k => !k.startsWith('$'))
    console.log(`[Prisma Init - ${new Date().toISOString()}] Local Client Models:`, models)
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance
}
