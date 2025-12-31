
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Force clear formula for Account "1"
    await prisma.accountPlan.updateMany({
        where: { code: '1' },
        data: { formula: null }
    })
    console.log('Fixed Account 1: Formula cleared.')

    // 2. Check Account "1.3" for children
    const acc13 = await prisma.accountPlan.findFirst({
        where: { code: '1.3' },
        include: { children: true }
    })

    if (acc13) {
        console.log(`Account 1.3 found. Type: ${acc13.type}. Children count: ${acc13.children.length}`)
    } else {
        console.log('Account 1.3 not found.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
