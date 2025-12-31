const { PrismaClient } = require('../client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration to Budget Versions...');

    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
        console.log(`Processing Tenant: ${tenant.name} (${tenant.id})`);

        // Check if a default version exists, create if not
        let defaultVersion = await prisma.budgetVersion.findFirst({
            where: { tenantId: tenant.id, name: 'Versão Oficial' }
        });

        if (!defaultVersion) {
            defaultVersion = await prisma.budgetVersion.create({
                data: {
                    name: 'Versão Oficial',
                    color: '#10b981', // green-500
                    tenantId: tenant.id
                }
            });
            console.log(`  -> Created default version: ${defaultVersion.name}`);
        } else {
            console.log(`  -> Default version already exists: ${defaultVersion.name}`);
        }

        // Update entries
        const result = await prisma.budgetEntry.updateMany({
            where: {
                tenantId: tenant.id,
                budgetVersionId: null
            },
            data: {
                budgetVersionId: defaultVersion.id
            }
        });

        console.log(`  -> Migrated ${result.count} entries to version ${defaultVersion.name}`);
    }

    console.log('Migration complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
