
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const accounts = await prisma.accountPlan.findMany({
        where: {
            OR: [
                { code: '1' },
                { code: '2' }
            ]
        }
    })
    console.log('Accounts state:', JSON.stringify(accounts, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
