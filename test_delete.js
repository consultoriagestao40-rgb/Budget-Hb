const { PrismaClient } = require('./prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = '560c6257-29a1-4c68-82db-8374e35db666'; // 1.1 Receita Bruta de Vendas
    console.log(`[Test] Attempting to delete account ${id}`);

    try {
        // First delete budget entries associated
        const entriesDeleted = await prisma.budgetEntry.deleteMany({
            where: { accountId: id }
        });
        console.log(`[Test] Budget entries deleted:`, entriesDeleted.count);

        // Then delete the account
        const accountDeleted = await prisma.accountPlan.delete({
            where: { id }
        });
        console.log(`[Test] Account deleted:`, accountDeleted.name);
    } catch (error) {
        console.error(`[Test] ERROR:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
