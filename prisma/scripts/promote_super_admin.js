const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find the first user (usually the one created during dev)
    const user = await prisma.user.findFirst();

    if (!user) {
        console.log('No user found to promote.');
        return;
    }

    console.log(`Promoting user ${user.email} (ID: ${user.id}) to SUPER_ADMIN...`);

    await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' }
    });

    console.log('Done! Role updated to SUPER_ADMIN.');

    // Also verify
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    console.log('Role now:', updated.role);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
