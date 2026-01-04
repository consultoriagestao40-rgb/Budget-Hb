'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { useSidebarStore } from '@/store/sidebarStore'
import { logout } from '@/app/actions/auth'

export function Sidebar({
    tenantName,
    userRole,
    userEmail
}: {
    tenantName: string,
    userRole?: string,
    userEmail?: string
}) {
    const pathname = usePathname()
    const { isCollapsed, toggle } = useSidebarStore()

    const isSuperAdmin = userRole === 'SUPER_ADMIN' || userEmail === 'consultoria.gestao4.0@gmail.com'

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <HomeIcon /> },
        { name: 'DRE Gerencial', path: '/dashboard/dre', icon: <ChartIcon /> },
        { name: 'Cadastros', path: '/dashboard/registrations', icon: <FolderIcon /> },
        { name: 'Configurações', path: '/dashboard/settings', icon: <SettingsIcon /> },
    ]

    return (
        <aside className={`fixed top-0 left-0 h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
            {/* Toggle Button */}
            <button
                onClick={toggle}
                className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] shadow-sm z-50 cursor-pointer hover:bg-[var(--bg-surface-hover)]"
                title={isCollapsed ? "Expandir" : "Recolher"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
            </button>

            {/* Logo Area */}
            <div className={`h-[70px] flex items-center px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-main)] ${isCollapsed ? 'justify-center px-0' : ''}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                        B
                    </div>
                    {!isCollapsed && (
                        <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                            Budget<span className="text-[var(--accent-primary)]">Hub</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Tenant Info */}
            {!isCollapsed && (
                <div className="px-4 py-6">
                    <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase font-semibold mb-1">Organização</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tenantName}</p>
                        </div>
                    </div>
                </div>
            )}
            {isCollapsed && <div className="h-6"></div>}

            {/* Menu */}
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-[var(--shadow-glow)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                                }
                                ${isCollapsed ? 'justify-center px-0 py-3' : ''}
                            `}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}

                {/* Admin Link */}
                {isSuperAdmin && (
                    <>
                        <div className="my-2 border-t border-[var(--border-subtle)] mx-2"></div>
                        <Link
                            href="/admin"
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                text-red-500 hover:bg-red-500/10
                                ${isCollapsed ? 'justify-center px-0 py-3' : ''}
                            `}
                            title={isCollapsed ? "Admin Master" : undefined}
                        >
                            <span className="shrink-0"><ShieldIcon /></span>
                            {!isCollapsed && <span>Admin Master</span>}
                        </Link>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)] space-y-1">
                <div className={isCollapsed ? 'flex justify-center' : ''}>
                    <ThemeToggle />
                </div>
                <button
                    onClick={() => logout()}
                    className={`flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-full px-2 py-2 ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogoutIcon />
                    {!isCollapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
    )
}

function ShieldIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
}

function HomeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )
}

function ChartIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="20" y2="10" />
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
        </svg>
    )
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function LogoutIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    )
}

function FolderIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    )
}
