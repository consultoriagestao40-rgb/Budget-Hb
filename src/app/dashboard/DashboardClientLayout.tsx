'use client'

import { Sidebar } from '@/app/components/Sidebar'
import { useSidebarStore } from '@/store/sidebarStore'

export function DashboardClientLayout({
    children,
    tenantName,
    userRole,
    userEmail
}: {
    children: React.ReactNode
    tenantName: string
    userRole?: string
    userEmail?: string
}) {
    const { isCollapsed } = useSidebarStore()

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)]">
            <Sidebar
                tenantName={tenantName}
                userRole={userRole}
                userEmail={userEmail}
            />
            <main
                className={`flex-1 p-8 transition-all duration-300 ${isCollapsed ? 'ml-[80px]' : 'ml-[260px]'}`}
            >
                {children}
            </main>
        </div>
    )
}
