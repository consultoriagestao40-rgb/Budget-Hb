const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'admin@demo.com' // Ensure this matches the login email

    // Or update ALL users to admin for dev
    await prisma.user.updateMany({
        data: { role: 'ADMIN' }
    })

    console.log('All users promoted to ADMIN')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
