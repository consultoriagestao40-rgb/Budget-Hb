const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) return console.log('No tenant found')

    const charges = [
        { code: '4.1.2.1', perc: 8.0 },
        { code: '4.1.2.2', perc: 8.33 },
        { code: '4.1.2.3', perc: 11.11 },
        { code: '4.1.2.4', perc: 3.20 },
        { code: '4.1.2.5', perc: 20.0 }
    ]

    for (const charge of charges) {
        const acc = await prisma.accountPlan.findFirst({
            where: { tenantId: tenant.id, code: charge.code.trim() }
        })
        if (acc) {
            console.log(`Setting ${acc.code} (${acc.name}) to ${charge.perc}% of 4.1.1`)
            await prisma.accountPlan.update({
                where: { id: acc.id },
                data: {
                    type: 'CALCULATED',
                    baseCode: '4.1.1',
                    percentage: charge.perc,
                    formula: null
                }
            })
        } else {
            console.log(`Account ${charge.code} not found`)
        }
    }

    console.log('Update complete.')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
