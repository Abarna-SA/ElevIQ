'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
    User,
    Settings,
    Trophy,
    Keyboard,
    MessageSquare,
    LogOut,
    Sun,
    Moon,
    Monitor,
    ChevronRight,
} from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/contexts/theme-context';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ProfileDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user, userType } = useAuthStore();
    const { theme, setTheme } = useTheme();

    useClickOutside(ref, () => setIsOpen(false), isOpen);

    const handleSignOut = async () => {
        setIsOpen(false);
        if (auth) await signOut(auth);
        router.push('/login');
    };

    const themeOptions = [
        { value: 'light' as const, icon: Sun, label: 'Light' },
        { value: 'dark' as const, icon: Moon, label: 'Dark' },
        { value: 'system' as const, icon: Monitor, label: 'System' },
    ];

    const menuItems = [
        { href: '/profile', icon: User, label: 'Profile', shortcut: '⌘P' },
        { href: '/settings', icon: Settings, label: 'Settings', shortcut: '⌘,' },
        { href: '/achievements', icon: Trophy, label: 'Achievements', shortcut: '' },
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1 rounded-lg transition-colors ${isOpen
                    ? 'bg-gray-100 dark:bg-white/10'
                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-transparent hover:ring-gray-200 dark:hover:ring-white/10 transition-all">
                    {user?.displayName?.[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animate-dropdown-in">
                    {/* User Info */}
                    <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                {user?.displayName?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.displayName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || 'user@email.com'}
                                </p>
                            </div>
                        </div>
                        {userType && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                                {userType}
                            </span>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="py-1.5 border-b border-gray-100 dark:border-white/5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.shortcut && (
                                        <kbd className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 font-medium">
                                            {item.shortcut}
                                        </kbd>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Theme Switcher */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Theme
                        </p>
                        <div className="flex rounded-lg bg-gray-100 dark:bg-white/[0.06] p-0.5">
                            {themeOptions.map((option) => {
                                const Icon = option.icon;
                                const isActive = theme === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setTheme(option.value)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${isActive
                                            ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Extra Links */}
                    <div className="py-1.5 border-b border-gray-100 dark:border-white/5">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <Keyboard className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                            <span className="flex-1 text-left">Keyboard Shortcuts</span>
                            <kbd className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 font-medium">
                                ⌘/
                            </kbd>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                            <span className="flex-1 text-left">Send Feedback</span>
                        </button>
                    </div>

                    {/* Sign Out */}
                    <div className="py-1.5">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.75} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
