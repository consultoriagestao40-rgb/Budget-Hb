import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
    console.log('--- Starting Verification ---')

    // 1. Setup Data
    const tenant = await prisma.tenant.create({
        data: { name: 'Test Corp' }
    })
    const companyA = await prisma.company.create({
        data: { name: 'Company A', tenantId: tenant.id }
    })
    const companyB = await prisma.company.create({
        data: { name: 'Company B', tenantId: tenant.id }
    })

    // Account Structure
    // Revenue (Calc)
    //   - Sales A (Input)
    const revenue = await prisma.accountPlan.create({
        data: {
            tenantId: tenant.id,
            name: 'Revenue',
            code: '1',
            type: 'CALCULATED',
            formula: '@1.1'
        }
    })
    const sales = await prisma.accountPlan.create({
        data: {
            tenantId: tenant.id,
            name: 'Sales',
            code: '1.1',
            type: 'INPUT',
            parentId: revenue.id
        }
    })

    console.log('1. Setup Data: OK')

    // 2. Insert Values
    // Jan 2025, Company A, $1000
    await prisma.budgetEntry.create({
        data: {
            tenantId: tenant.id,
            accountId: sales.id,
            companyId: companyA.id,
            year: 2025,
            month: 1,
            amount: 1000
        }
    })

    // Jan 2025, Company B, $2000
    await prisma.budgetEntry.create({
        data: {
            tenantId: tenant.id,
            accountId: sales.id,
            companyId: companyB.id,
            year: 2025,
            month: 1,
            amount: 2000
        }
    })

    console.log('2. Insert Values: OK')

    // 3. Verify Queries

    // Case A: Filter by Company A
    const entriesA = await prisma.budgetEntry.findMany({
        where: {
            tenantId: tenant.id,
            year: 2025,
            companyId: companyA.id
        }
    })
    const totalA = entriesA.reduce((sum: number, e: any) => sum + e.amount, 0)
    if (totalA !== 1000) throw new Error(`Expected 1000 for Company A, got ${totalA}`)
    console.log('3a. Filter Company A: OK')

    // Case B: Filter by Company B
    const entriesB = await prisma.budgetEntry.findMany({
        where: {
            tenantId: tenant.id,
            year: 2025,
            companyId: companyB.id
        }
    })
    const totalB = entriesB.reduce((sum: number, e: any) => sum + e.amount, 0)
    if (totalB !== 2000) throw new Error(`Expected 2000 for Company B, got ${totalB}`)
    console.log('3b. Filter Company B: OK')

    // Case C: Consolidated (No Company Filter)
    // Logic in getDreData (simplified simulation here)
    const entriesAll = await prisma.budgetEntry.findMany({
        where: {
            tenantId: tenant.id,
            year: 2025
        }
    })
    const totalAll = entriesAll.reduce((sum: number, e: any) => sum + e.amount, 0)
    if (totalAll !== 3000) throw new Error(`Expected 3000 Consolidated, got ${totalAll}`)
    console.log('3c. Consolidated: OK')

    // 4. Cleanup
    await prisma.budgetEntry.deleteMany({ where: { tenantId: tenant.id } })
    await prisma.accountPlan.deleteMany({ where: { tenantId: tenant.id } })
    await prisma.company.deleteMany({ where: { tenantId: tenant.id } })
    await prisma.tenant.delete({ where: { id: tenant.id } })

    console.log('--- Verification Success ---')
}

verify()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
