
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.accountPlan.updateMany({
        where: { code: '4' },
        data: { parentId: null }
    })
    console.log('Fixed Account 4: Set parentId to null (Root).')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
