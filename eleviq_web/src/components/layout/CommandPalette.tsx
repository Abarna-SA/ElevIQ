'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Plus, ScanLine, Sparkles, Moon, Sun, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { sections, bottomItems } from '@/config/sidebar-config';
import { useTheme } from '@/contexts/theme-context';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    category: 'recent' | 'pages' | 'actions';
    href?: string;
    action?: () => void;
    shortcut?: string;
    keywords?: string[];
}

// Build page items from sidebar config
const pageItems: CommandItem[] = [
    ...sections.flatMap((section) =>
        section.items.map((item) => ({
            id: `page-${item.href}`,
            label: item.label,
            icon: item.icon,
            category: 'pages' as const,
            href: item.href,
            keywords: [section.name.toLowerCase(), item.label.toLowerCase()],
        }))
    ),
    ...bottomItems.map((item) => ({
        id: `page-${item.href}`,
        label: item.label,
        icon: item.icon,
        category: 'pages' as const,
        href: item.href,
        keywords: [item.label.toLowerCase()],
    })),
];

// Recents from localStorage
const RECENT_KEY = 'eleviq-recent-pages';
const MAX_RECENT = 5;

function getRecentPages(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
        return [];
    }
}

function addRecentPage(href: string) {
    const recents = getRecentPages().filter((r) => r !== href);
    recents.unshift(href);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const { theme, setTheme, actualTheme } = useTheme();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Action items
    const actionItems: CommandItem[] = useMemo(
        () => [
            {
                id: 'action-add-expense',
                label: 'Add New Expense',
                icon: Plus,
                category: 'actions',
                href: '/expenses/add',
                shortcut: '⌘E',
            },
            {
                id: 'action-scan',
                label: 'Scan Receipt',
                icon: ScanLine,
                category: 'actions',
                href: '/scan',
                shortcut: '⌘S',
            },
            {
                id: 'action-chat',
                label: 'New AI Chat',
                icon: Sparkles,
                category: 'actions',
                href: '/chat',
                shortcut: '⌘J',
            },
            {
                id: 'action-theme',
                label: `Switch to ${actualTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
                icon: actualTheme === 'dark' ? Sun : Moon,
                category: 'actions',
                action: () => setTheme(actualTheme === 'dark' ? 'light' : 'dark'),
            },
            {
                id: 'action-settings',
                label: 'Open Settings',
                icon: SettingsIcon,
                category: 'actions',
                href: '/settings',
                shortcut: '⌘,',
            },
            {
                id: 'action-signout',
                label: 'Sign Out',
                icon: LogOut,
                category: 'actions',
                action: async () => {
                    if (auth) await signOut(auth);
                    router.push('/login');
                },
            },
        ],
        [actualTheme, setTheme, router]
    );

    // Build recent items
    const recentItems: CommandItem[] = useMemo(() => {
        const recentPaths = getRecentPages();
        return recentPaths
            .map((href) => {
                const page = pageItems.find((p) => p.href === href);
                if (!page) return null;
                return { ...page, id: `recent-${href}`, category: 'recent' as const };
            })
            .filter(Boolean) as CommandItem[];
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // All items
    const allItems = useMemo(
        () => [...recentItems, ...pageItems, ...actionItems],
        [recentItems, actionItems]
    );

    // Filtered items
    const filteredItems = useMemo(() => {
        if (!query.trim()) return allItems;
        const q = query.toLowerCase();
        return allItems.filter(
            (item) =>
                item.label.toLowerCase().includes(q) ||
                item.href?.toLowerCase().includes(q) ||
                item.keywords?.some((kw) => kw.includes(q))
        );
    }, [query, allItems]);

    // Group by category
    const grouped = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {};
        for (const item of filteredItems) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    }, [filteredItems]);

    const flatItems = useMemo(() => filteredItems, [filteredItems]);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Execute item
    const executeItem = useCallback(
        (item: CommandItem) => {
            if (item.href) {
                addRecentPage(item.href);
                router.push(item.href);
            }
            if (item.action) {
                item.action();
            }
            onClose();
        },
        [router, onClose]
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((i) => (i + 1) % flatItems.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (flatItems[selectedIndex]) {
                        executeItem(flatItems[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [flatItems, selectedIndex, executeItem, onClose]
    );

    if (!isOpen) return null;

    const categoryLabels: Record<string, string> = {
        recent: 'Recent',
        pages: 'Pages',
        actions: 'Actions',
    };

    const categoryOrder = ['recent', 'pages', 'actions'];
    let globalIndex = 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed z-[101] overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-2xl border border-gray-200 dark:border-white/10 inset-0 rounded-none animate-fade-in lg:inset-auto lg:top-[15%] lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-[560px] lg:rounded-xl lg:animate-palette-in">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/5">
                    <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, actions, settings..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="max-h-[calc(100vh-120px)] lg:max-h-[360px] overflow-y-auto py-2">
                    {flatItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                            No results found for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        categoryOrder.map((category) => {
                            const items = grouped[category];
                            if (!items || items.length === 0) return null;

                            return (
                                <div key={category} className="mb-1">
                                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-1.5">
                                        {categoryLabels[category]}
                                    </p>
                                    {items.map((item) => {
                                        const currentGlobalIndex = globalIndex++;
                                        const isSelected = currentGlobalIndex === selectedIndex;
                                        const Icon = item.icon;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => executeItem(item)}
                                                onMouseEnter={() => setSelectedIndex(currentGlobalIndex)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isSelected
                                                    ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                                                <span className="flex-1 text-left truncate">{item.label}</span>
                                                {item.href && (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                                        {item.href}
                                                    </span>
                                                )}
                                                {item.shortcut && (
                                                    <kbd className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium">
                                                        {item.shortcut}
                                                    </kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="hidden lg:flex px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-t border-gray-100 dark:border-white/5 items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium">↑↓</kbd>
                        Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium">↵</kbd>
                        Select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium">esc</kbd>
                        Close
                    </span>
                </div>
            </div>
        </>
    );
}
