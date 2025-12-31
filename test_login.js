const { PrismaClient } = require('./prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
    try {
        const email = 'admin@demo.com';
        const password = 'password123';

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   TenantId: ${user.tenantId}`);
        console.log(`   Password match: ${user.password === password}`);

        if (user.password !== password) {
            console.log(`❌ Password mismatch! DB has: "${user.password}"`);
        } else {
            console.log('✅ Login would succeed!');
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
