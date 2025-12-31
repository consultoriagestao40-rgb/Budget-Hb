import { getTenants } from '@/app/actions/admin'
import { AdminTenantsTable } from './AdminTenantsTable'

export default async function AdminPage() {
    const tenants = await getTenants()

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestão de Empresas (SaaS)</h1>
                    <p className="text-[var(--text-secondary)]">Gerencie assinaturas e acessos.</p>
                </div>
                <div className="stats shadow bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <div className="stat place-items-center px-6 py-2">
                        <div className="stat-title text-xs">Total MRR (Est.)</div>
                        <div className="stat-value text-lg text-green-500">R$ {tenants.filter(t => t.plan !== 'FREE').length * 299},00</div>
                    </div>
                    <div className="stat place-items-center px-6 py-2">
                        <div className="stat-title text-xs">Ativas</div>
                        <div className="stat-value text-lg">{tenants.filter(t => t.status === 'ACTIVE').length}</div>
                    </div>
                </div>
            </header>

            <AdminTenantsTable tenants={tenants} />
        </div>
    )
}
