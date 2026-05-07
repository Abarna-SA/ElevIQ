'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Search,
    ChevronRight,
    Command,
} from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { sections, bottomItems } from '@/config/sidebar-config';

// Components
import CommandPalette from './CommandPalette';
import QuickAddDropdown from './QuickAddDropdown';
import NotificationDropdown from './NotificationDropdown';
import HelpDropdown from './HelpDropdown';
import ProfileDropdown from './ProfileDropdown';

// Build icon mapping from sidebar-config for breadcrumbs
const pathIconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {};
const pathLabelMap: Record<string, string> = {};

for (const section of sections) {
    for (const item of section.items) {
        const seg = item.href.replace('/', '');
        pathIconMap[seg] = item.icon;
        pathLabelMap[seg] = item.label;
    }
}
for (const item of bottomItems) {
    const seg = item.href.replace('/', '');
    pathIconMap[seg] = item.icon;
    pathLabelMap[seg] = item.label;
}

// Extra labels for sub-paths
pathLabelMap['add'] = 'Add';

export default function AppHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { actualTheme } = useTheme();
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Generate breadcrumbs from pathname with icons
    const breadcrumbs = useMemo(() => {
        const paths = pathname?.split('/').filter(Boolean) || [];
        return paths.map((path, index) => ({
            label: pathLabelMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
            href: '/' + paths.slice(0, index + 1).join('/'),
            isLast: index === paths.length - 1,
            icon: pathIconMap[path] || null,
        }));
    }, [pathname]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘K — Command palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            }
            // ⌘E — Add expense
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                router.push('/expenses/add');
            }
            // ⌘J — AI chat
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                router.push('/chat');
            }
            // ⌘, — Settings
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                router.push('/settings');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <>
            <header className="h-14 bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-5 sticky top-0 z-50">
                {/* ─── Left Section: Logo + Breadcrumbs ─── */}
                <div className="flex items-center gap-3 min-w-0">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex-shrink-0">
                        <Image
                            src={actualTheme === 'dark' ? '/ElevIQ_White.png' : '/ElevIQ_Gold.png'}
                            alt="ElevIQ"
                            width={120}
                            height={36}
                            className="h-8 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Separator */}
                    <div className="h-5 w-px bg-gray-200 dark:bg-white/10 flex-shrink-0" />

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-1 text-sm min-w-0">
                        {breadcrumbs.map((crumb, index) => {
                            const Icon = crumb.icon;
                            return (
                                <div key={crumb.href} className="flex items-center gap-1 min-w-0">
                                    {index > 0 && (
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                    )}
                                    {crumb.isLast ? (
                                        <span className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium truncate">
                                            {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" strokeWidth={1.75} />}
                                            <span className="truncate">{crumb.label}</span>
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors truncate"
                                        >
                                            {Icon && <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />}
                                            <span className="truncate">{crumb.label}</span>
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* ─── Right Section: Actions ─── */}
                <div className="flex items-center gap-1">
                    {/* Search Trigger */}
                    <button
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-500 dark:text-gray-400 text-sm transition-colors"
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500">Search...</span>
                        <span className="hidden sm:flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 ml-1">
                            <Command className="w-3 h-3" />K
                        </span>
                    </button>

                    {/* Divider */}
                    <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1" />

                    {/* Quick Add */}
                    <QuickAddDropdown />

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* Help */}
                    <HelpDropdown />

                    {/* Divider */}
                    <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1" />

                    {/* Profile */}
                    <ProfileDropdown />
                </div>
            </header>

            {/* Command Palette (⌘K) */}
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />
        </>
    );
}
