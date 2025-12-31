const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const acc = await prisma.accountPlan.findFirst()
    if (!acc) return console.log('No account found to test update')

    console.log(`Testing update on account: ${acc.code} (${acc.id})`)
    try {
        const updated = await prisma.accountPlan.update({
            where: { id: acc.id },
            data: {
                percentage: 10.5,
                baseCode: 'TEST.BASE'
            }
        })
        console.log('Update SUCCESSFUL:', updated.percentage, updated.baseCode)
    } catch (err) {
        console.error('Update FAILED with error:')
        console.error(err.message)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
