const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Available models in Prisma Client:')
    const models = Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key] === 'object')
    console.log(models)

    if (prisma.city) {
        console.log('City model FOUND')
    } else {
        console.log('City model NOT FOUND')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
