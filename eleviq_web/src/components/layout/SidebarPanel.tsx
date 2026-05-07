'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthStore } from '@/store/auth-store';
import { AuthService } from '@/lib/firebase/auth';
import { sections } from '@/config/sidebar-config';

export default function SidebarPanel() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, reset } = useAuthStore();
    const { activeSection, isExpanded, collapseSidebar } = useSidebarStore();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevSectionRef = useRef(activeSection);

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    const handleLogout = async () => {
        await AuthService.signOut();
        reset();
        router.push('/login');
    };

    // Get items for the active section
    const currentSection = sections.find((s) => s.name === activeSection);
    const currentItems = currentSection?.items || [];

    // Trigger transition when section changes
    useEffect(() => {
        if (prevSectionRef.current !== activeSection) {
            setIsTransitioning(true);
            prevSectionRef.current = activeSection;
            const timer = setTimeout(() => setIsTransitioning(false), 120);
            return () => clearTimeout(timer);
        }
    }, [activeSection]);

    // Don't render if sidebar collapsed
    if (!isExpanded) return null;

    return (
        <div className="w-[220px] h-[calc(100vh-56px)] bg-gray-50/80 dark:bg-[#111111] flex flex-col border-r border-gray-200 dark:border-white/5 overflow-hidden flex-shrink-0">
            {/* Section Header — matches chat page header style */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {activeSection}
                </span>
                <button
                    onClick={collapseSidebar}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-150"
                    title="Close panel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-2">
                <ul
                    className={`
                        space-y-0.5
                        transition-all duration-120 ease-out
                        ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}
                    `}
                >
                    {currentItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                                        relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                                        transition-all duration-150 ease-out
                                        ${active
                                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                                        }
                                    `}
                                >
                                    {/* Active indicator */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-blue-500 rounded-r-full" />
                                    )}
                                    <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={active ? 2 : 1.75} />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Section */}
            <div className="p-2.5 border-t border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-150">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm">
                        {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                            {user?.displayName || 'User'}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors duration-150 flex-shrink-0"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
