import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.isLoggedIn || session.role !== 'SUPER_ADMIN') {
        redirect('/dashboard/dre') // Redirect to dashboard if trying to access admin without perms
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
            {/* Simple Admin Sidebar */}
            <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col">
                <div className="p-6 border-b border-[var(--border-subtle)]">
                    <h1 className="text-xl font-bold text-red-500">Super Admin</h1>
                    <p className="text-xs text-[var(--text-muted)] mt-1">SaaS Management</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="block px-4 py-2 rounded text-sm hover:bg-[var(--bg-surface-hover)]">
                        🏢 Empresas (Tenants)
                    </Link>
                    {/* Future: Analytics, Global Settings */}
                </nav>

                <div className="p-4 border-t border-[var(--border-subtle)]">
                    <Link href="/dashboard" className="block px-4 py-2 rounded text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        ⬅ Voltar ao App
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
