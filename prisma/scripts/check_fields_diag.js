const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- AccountPlan Model Check ---')

    // Check if properties exist on the model object (rarely useful for fields but good to check)
    const dmmf = prisma._baseDmmf || prisma.dmmf
    if (dmmf) {
        const model = dmmf.datamodel.models.find(m => m.name === 'AccountPlan')
        if (model) {
            console.log('Fields in DMMF for AccountPlan:')
            console.log(model.fields.map(f => f.name).join(', '))
        } else {
            console.log('AccountPlan model not found in DMMF')
        }
    } else {
        console.log('Prisma DMMF not accessible')
    }

    // Try to create/update with the fields again, but catch the error and log its full details
    try {
        const acc = await prisma.accountPlan.findFirst()
        if (acc) {
            console.log('Trying update...')
            await prisma.accountPlan.update({
                where: { id: acc.id },
                data: { percentage: 9.9, baseCode: 'DIAG' }
            })
            console.log('Update SUCCESSFUL in diag script')
        }
    } catch (err) {
        console.log('Update FAILED in diag script')
        console.log(err)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
