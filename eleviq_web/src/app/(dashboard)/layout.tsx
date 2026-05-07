'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/navigation/bottom-nav';
import MobileHeader from '@/components/layout/MobileHeader';
import { useSidebarStore } from '@/store/sidebar-store';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();
    const { isExpanded } = useSidebarStore();
    const pathname = usePathname();
    const isChatPage = pathname?.startsWith('/chat');

    // Auto-hide bottom nav on scroll
    const [navHidden, setNavHidden] = useState(false);
    const lastScrollY = useRef(0);

    const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
        const currentY = e.currentTarget.scrollTop;
        const threshold = 10;

        if (currentY < 10) {
            // Always show at top
            setNavHidden(false);
        } else if (currentY > lastScrollY.current + threshold) {
            // Scrolling down past threshold
            setNavHidden(true);
        } else if (currentY < lastScrollY.current) {
            // Scrolling up
            setNavHidden(false);
        }

        lastScrollY.current = currentY;
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Dynamic sidebar width: icon rail (56px) + panel (220px when expanded)
    const sidebarWidth = isExpanded ? 276 : 56;

    return (
        <div className="bg-gray-50 dark:bg-[#0a0a0a]">
            {/* Desktop Layout */}
            <div className="hidden lg:block h-screen overflow-hidden">
                {/* Header - Full Width at Top */}
                <AppHeader />

                {/* Content Area with Sidebar */}
                <div className="flex">
                    {/* Sidebar - Fixed below header */}
                    <AppSidebar className="fixed left-0 top-14 z-40" />

                    {/* Main Content */}
                    <main
                        className="flex-1 h-[calc(100vh-56px)] overflow-y-auto transition-[margin] duration-200"
                        style={{ marginLeft: sidebarWidth }}
                    >
                        {children}
                    </main>
                </div>
            </div>

            {/* Mobile/Tablet Layout - Bottom Nav */}
            <div className="lg:hidden flex flex-col h-screen">
                {!isChatPage && <MobileHeader />}
                <main className={`flex-1 overflow-y-auto ${isChatPage ? '' : 'pb-20'}`} onScroll={handleScroll}>
                    {children}
                </main>
                {!isChatPage && <BottomNav hidden={navHidden} />}
            </div>
        </div>
    );
}
