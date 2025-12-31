const { PrismaClient } = require('./prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const accounts = await prisma.accountPlan.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                formula: true
            },
            orderBy: {
                code: 'asc'
            }
        });
        console.log(JSON.stringify(accounts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
