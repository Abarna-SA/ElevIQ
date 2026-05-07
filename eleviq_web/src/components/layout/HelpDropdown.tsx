'use client';

import { useState, useRef } from 'react';
import {
    CircleHelp,
    Keyboard,
    BookOpen,
    MessageSquare,
    Bug,
} from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

export default function HelpDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => setIsOpen(false), isOpen);

    const helpItems = [
        { icon: Keyboard, label: 'Keyboard Shortcuts', shortcut: '⌘/', action: () => { } },
        { icon: BookOpen, label: 'Documentation', shortcut: '', action: () => { } },
        { icon: MessageSquare, label: 'Send Feedback', shortcut: '', action: () => { } },
        { icon: Bug, label: 'Report a Bug', shortcut: '', action: () => { } },
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-colors ${isOpen
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                title="Help & Resources"
            >
                <CircleHelp className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animate-dropdown-in">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/5">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Help & Resources
                        </p>
                    </div>
                    <div className="py-1.5">
                        {helpItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.action();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.shortcut && (
                                        <kbd className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 font-medium">
                                            {item.shortcut}
                                        </kbd>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* Version Footer */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-white/[0.03] border-t border-gray-100 dark:border-white/5">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            ElevIQ v1.0.0
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
