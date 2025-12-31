import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Cleanup
  await prisma.budgetEntry.deleteMany()
  await prisma.userPermission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.accountPlan.deleteMany()
  await prisma.costCenter.deleteMany()
  await prisma.client.deleteMany()
  await prisma.segment.deleteMany()
  await prisma.grouping.deleteMany()
  await prisma.city.deleteMany()
  await prisma.costCenterGroup.deleteMany()
  await prisma.costCenterSegment.deleteMany()
  await prisma.company.deleteMany()
  await prisma.tenant.deleteMany()

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Grupo JVS',
      users: {
        create: [
          {
            email: 'admin@demo.com',
            name: 'Admin User',
            password: 'password123',
            role: 'ADMIN'
          }
        ]
      },
      companies: {
        create: {
          name: 'JVS Facilities',
          code: '001'
        }
      },
      costCenters: {
        createMany: {
          data: [
            { name: 'Administrativo', code: 'CC01' },
            { name: 'Vendas', code: 'CC02' },
          ]
        }
      }
    },
    include: {
      companies: true
    }
  })

  const company = tenant.companies[0]

  // 2. Create Complete DRE Account Plan
  const accounts = [
    { code: '1', name: 'RECEITA BRUTA', type: 'CALCULATED', formula: '' },
    { code: '1.1', name: 'Receita Bruta de Vendas', type: 'INPUT', parentCode: '1' },

    { code: '2', name: 'DEDUÇÕES E IMPOSTOS', type: 'CALCULATED', formula: '' },
    { code: '2.1', name: 'Impostos Sobre Vendas', type: 'CALCULATED', formula: '', parentCode: '2' },
    { code: '2.1.1', name: 'ISS', type: 'CALCULATED', percentage: 5.0, baseCode: '1.1', parentCode: '2.1' },

    { code: '3', name: 'RECEITA LÍQUIDA', type: 'CALCULATED', formula: '@1 - @2' },

    { code: '4', name: 'CUSTOS OPERACIONAIS', type: 'CALCULATED', formula: '' },
    { code: '4.1', name: 'Mão de Obra', type: 'CALCULATED', formula: '', parentCode: '4' },
    { code: '4.1.1', name: 'Salários', type: 'INPUT', parentCode: '4.1' },
    { code: '4.1.2', name: 'Encargos Sociais', type: 'CALCULATED', formula: '', parentCode: '4.1' },
    { code: '4.1.2.1', name: 'INSS', type: 'CALCULATED', percentage: 20.0, baseCode: '4.1.1', parentCode: '4.1.2' },
    { code: '4.1.2.2', name: 'FGTS', type: 'CALCULATED', percentage: 8.0, baseCode: '4.1.1', parentCode: '4.1.2' },

    { code: '5', name: 'MARGEM BRUTA', type: 'CALCULATED', formula: '@3 - @4' },

    { code: '6', name: 'DESPESAS OPERACIONAIS', type: 'CALCULATED', formula: '' },
    { code: '6.1', name: 'Despesas Administrativas', type: 'CALCULATED', formula: '', parentCode: '6' },
    { code: '6.1.1', name: 'Aluguel', type: 'INPUT', parentCode: '6.1' },
    { code: '6.1.2', name: 'Energia Elétrica', type: 'INPUT', parentCode: '6.1' },
    { code: '6.1.3', name: 'Telefone e Internet', type: 'INPUT', parentCode: '6.1' },
    { code: '6.1.4', name: 'Material de Escritório', type: 'INPUT', parentCode: '6.1' },
    { code: '6.1.5', name: 'Despesas Com Veículos', type: 'CALCULATED', formula: '', parentCode: '6.1' },
    { code: '6.1.5.1', name: 'Combustível', type: 'INPUT', parentCode: '6.1.5' },
    { code: '6.1.5.2', name: 'Manutenção', type: 'INPUT', parentCode: '6.1.5' },
    { code: '6.1.6', name: 'Despesas Com Viagens', type: 'CALCULATED', formula: '', parentCode: '6.1' },
    { code: '6.1.6.1', name: 'Hospedagem', type: 'INPUT', parentCode: '6.1.6' },
    { code: '6.1.6.2', name: 'Refeição', type: 'INPUT', parentCode: '6.1.6' },
    { code: '6.1.6.3', name: 'Pedágio', type: 'INPUT', parentCode: '6.1.6' },

    { code: '7', name: 'LUCRO BRUTO', type: 'CALCULATED', formula: '@5 - @6' },

    { code: '8', name: 'DESPESAS ADMINISTRATIVAS', type: 'CALCULATED', formula: '' },

    { code: '9', name: 'EBITDA', type: 'CALCULATED', formula: '' },
  ]

  const accountMap = new Map()

  for (const acc of accounts) {
    const parentId = acc.parentCode ? accountMap.get(acc.parentCode) : null
    const created = await prisma.accountPlan.create({
      data: {
        tenantId: tenant.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        formula: acc.formula || null,
        percentage: acc.percentage || null,
        baseCode: acc.baseCode || null,
        parentId
      }
    })
    accountMap.set(acc.code, created.id)
  }

  // Create Restricted User
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'user@demo.com',
      name: 'Restricted User',
      password: 'password123',
      role: 'ADMIN',
      permissions: {
        create: [
          { companyId: company.id }
        ]
      }
    }
  })

  console.log('Seed finished. Users created:')
  console.log('Admin: admin@demo.com / password123')
  console.log('User: user@demo.com / password123 (Restricted to Main Company)')
  console.log(`Created ${accounts.length} accounts in DRE structure`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
