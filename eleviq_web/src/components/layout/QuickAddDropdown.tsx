'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Plus, Receipt, ScanLine, Sparkles, Target, BellRing } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

const quickActions = [
    { href: '/expenses/add', icon: Receipt, label: 'Add Expense', shortcut: '⌘E' },
    { href: '/scan', icon: ScanLine, label: 'Scan Receipt', shortcut: '⌘S' },
    { href: '/chat', icon: Sparkles, label: 'New AI Chat', shortcut: '⌘J' },
    { href: '/goals', icon: Target, label: 'Create Goal', shortcut: '' },
    { href: '/reminders', icon: BellRing, label: 'Set Reminder', shortcut: '' },
];

export default function QuickAddDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => setIsOpen(false), isOpen);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded-lg transition-all duration-150 ${isOpen
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                title="Quick Actions"
            >
                <Plus className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animate-dropdown-in">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/5">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Quick Actions
                        </p>
                    </div>
                    <div className="py-1.5">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.75} />
                                    </div>
                                    <span className="flex-1">{action.label}</span>
                                    {action.shortcut && (
                                        <kbd className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 font-medium">
                                            {action.shortcut}
                                        </kbd>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
