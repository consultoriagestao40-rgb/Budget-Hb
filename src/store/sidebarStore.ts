import { create } from 'zustand'

interface SidebarState {
    isCollapsed: boolean
    toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isCollapsed: true,
    toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}))
