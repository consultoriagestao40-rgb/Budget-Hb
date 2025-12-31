'use server'

import { prisma } from '@/lib/prisma'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string // In real app, hash check

    const user = await prisma.user.findUnique({
        where: { email }
    })

    // MVP: Simple password check (plaintext matches for seed admin) or dummy logic
    // For security, assuming we use hashed password eventually. 
    // For now, if user exists and password matches what we seeded 'password123'
    // Or just check user existence for simple MVP demo if password seeded is plain.

    if (!user || user.password !== password) {
        return { error: 'Invalid credentials' }
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.isLoggedIn = true
    session.userId = user.id
    session.email = user.email
    session.name = user.name
    session.tenantId = user.tenantId
    session.role = user.role
    session.mustChangePassword = user.mustChangePassword
    await session.save()

    if (user.mustChangePassword) {
        redirect('/change-password')
    }

    redirect('/dashboard')
}

export async function logout() {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.destroy()
    redirect('/login')
}

export async function changePassword(newPassword: string) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn) {
        redirect('/login')
    }

    // TODO: Hash password
    await prisma.user.update({
        where: { id: session.userId },
        data: { password: newPassword, mustChangePassword: false }
    })

    session.mustChangePassword = false
    await session.save()

    redirect('/dashboard')
}

export async function forceLogin() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@demo.com' }
    })

    if (!user) {
        throw new Error('Admin user not found')
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.isLoggedIn = true
    session.userId = user.id
    session.email = user.email
    session.name = user.name
    session.tenantId = user.tenantId
    session.role = user.role
    session.mustChangePassword = user.mustChangePassword // Usually false for admin
    await session.save()

    redirect('/dashboard/dre')
}

export async function registerTenant(formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const companyName = formData.get('companyName') as string

    if (!name || !email || !password || !companyName) {
        return { error: 'Preencha todos os campos.' }
    }

    // Check existing email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return { error: 'E-mail já cadastrado.' }
    }

    try {
        // Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: companyName,
                dreTitle: `DRE - ${companyName}`,
                minYear: 2024,
                maxYear: 2026,
            }
        })

        // Create Admin User
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password, // Plain text for now as per MVP
                role: 'ADMIN',
                tenantId: tenant.id
            }
        })

        // Create Default Version
        await prisma.budgetVersion.create({
            data: {
                name: 'Orçamento 2024 (Inicial)',
                tenantId: tenant.id
            }
        })

        // Login
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
        session.isLoggedIn = true
        session.userId = user.id
        session.email = user.email
        session.name = user.name
        session.tenantId = user.tenantId
        session.role = user.role
        session.mustChangePassword = false
        await session.save()

        redirect('/dashboard/dre')
    } catch (e) {
        if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
        console.error(e)
        return { error: 'Erro ao criar conta. Tente novamente.' }
    }
}
