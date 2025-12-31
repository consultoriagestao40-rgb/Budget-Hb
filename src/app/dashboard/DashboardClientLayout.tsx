'use client'

import { Sidebar } from '@/app/components/Sidebar'
import { useSidebarStore } from '@/store/sidebarStore'

export function DashboardClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isCollapsed } = useSidebarStore()

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)]">
            <Sidebar />
            <main
                className={`flex-1 p-8 transition-all duration-300 ${isCollapsed ? 'ml-[80px]' : 'ml-[260px]'}`}
            >
                {children}
            </main>
        </div>
    )
}
