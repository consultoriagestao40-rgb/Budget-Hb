
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const accounts = await prisma.accountPlan.findMany({
        where: {
            OR: [
                { code: '3' },
                { code: '4' }
            ]
        },
        include: {
            parent: true,
            children: true
        }
    })
    console.log('Accounts 3 and 4 details:', JSON.stringify(accounts, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
