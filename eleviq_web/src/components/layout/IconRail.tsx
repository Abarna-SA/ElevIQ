'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebar-store';
import { sections, bottomItems, findSectionForPath } from '@/config/sidebar-config';

export default function IconRail() {
    const pathname = usePathname();
    const prevPathnameRef = useRef<string | null>(null);
    const { activeSection, setActiveSection, toggleSection } = useSidebarStore();

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    // Sync active section when pathname changes
    useEffect(() => {
        if (!pathname || prevPathnameRef.current === pathname) return;
        prevPathnameRef.current = pathname;

        const section = findSectionForPath(pathname);
        if (section) {
            setActiveSection(section);
            return;
        }

        // Don't change section for bottom items
        const isBottomItem = bottomItems.some((item) => isActive(item.href));
        if (isBottomItem) return;
    }, [pathname]);

    return (
        <div className="w-14 h-[calc(100vh-56px)] bg-white dark:bg-[#0A0A0A] flex flex-col border-r border-gray-200 dark:border-white/5 flex-shrink-0">
            {/* Section Icons */}
            <nav className="flex-1 py-3 flex flex-col items-center gap-1">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isSelected = activeSection === section.name;

                    return (
                        <div key={section.name} className="relative group">
                            <button
                                onClick={() => toggleSection(section.name)}
                                className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center
                                    transition-all duration-150 ease-out
                                    ${isSelected
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                <Icon className="w-[20px] h-[20px]" strokeWidth={isSelected ? 2 : 1.75} />
                            </button>

                            {/* Active indicator bar */}
                            <div
                                className={`
                                    absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full
                                    bg-blue-500 transition-all duration-200 ease-out
                                    ${isSelected ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}
                                `}
                            />

                            {/* Tooltip */}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                {section.name}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Icons */}
            <div className="py-3 flex flex-col items-center gap-1 border-t border-gray-200 dark:border-white/5">
                {bottomItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <div key={item.href} className="relative group">
                            <Link
                                href={item.href}
                                className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center
                                    transition-all duration-150 ease-out
                                    ${active
                                        ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                <Icon className="w-[20px] h-[20px]" strokeWidth={1.75} />
                            </Link>
                            {/* Tooltip */}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                {item.label}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
