import { DashboardClientLayout } from './DashboardClientLayout'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    let tenantName = 'Minha Empresa'

    if (session.isLoggedIn && session.tenantId) {
        // Check tenant status
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.tenantId },
            select: { status: true, name: true }
        })

        if (!tenant || tenant.status === 'BLOCKED') {
            // Allow access if Super Admin? Maybe, but usually they login as blocked user to debug?
            // If the LOGGED user is Super Admin, we might bypass.
            if (session.role !== 'SUPER_ADMIN') {
                redirect('/payment-required')
            }
        }

        if (tenant?.name) {
            tenantName = tenant.name
        }
    }

    return (
        <DashboardClientLayout
            tenantName={tenantName}
            userRole={session.role}
            userEmail={session.email}
        >
            {children}
        </DashboardClientLayout>
    )
}
