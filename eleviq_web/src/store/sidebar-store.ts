import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
    activeSection: string;
    isExpanded: boolean;
    setActiveSection: (section: string) => void;
    toggleSection: (section: string) => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set) => ({
            activeSection: 'Home',
            isExpanded: true,

            // Used by pathname sync — just update section, never collapse
            setActiveSection: (section: string) =>
                set({ activeSection: section }),

            // Used by icon rail clicks — toggle collapse on same section
            toggleSection: (section: string) =>
                set((state) => {
                    if (state.activeSection === section && state.isExpanded) {
                        return { isExpanded: false };
                    }
                    return { activeSection: section, isExpanded: true };
                }),

            collapseSidebar: () => set({ isExpanded: false }),
            expandSidebar: () => set({ isExpanded: true }),
        }),
        {
            name: 'eleviq-sidebar-state',
        }
    )
);
