'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    Search,
    Bell,
    User,
    ChevronRight,
    ShieldAlert,
    CalendarClock,
    Lightbulb,
    Target,
    Check,
    Settings,
    Trophy,
    Sun,
    Moon,
    Monitor,
    LogOut,
    MessageSquare,
    BookOpen,
    X,
} from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { useAuthStore } from '@/store/auth-store';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { sections, bottomItems } from '@/config/sidebar-config';
import CommandPalette from './CommandPalette';

// ─── Build breadcrumb maps from sidebar-config ───
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
pathLabelMap['add'] = 'Add';

// ─── Mock notifications (same as NotificationDropdown) ───
interface Notification {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

const initialNotifications: Notification[] = [
    {
        id: '1',
        icon: ShieldAlert,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-50 dark:bg-red-900/20',
        title: 'Spending limit reached',
        description: 'Dining budget exceeded by ₹1,200',
        time: '2 min ago',
        read: false,
    },
    {
        id: '2',
        icon: CalendarClock,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-50 dark:bg-amber-900/20',
        title: 'Bill reminder: Netflix',
        description: '₹649 due tomorrow',
        time: '1 hour ago',
        read: false,
    },
    {
        id: '3',
        icon: Lightbulb,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        title: 'Weekly insight ready',
        description: 'Your spending analysis is available',
        time: '3 hours ago',
        read: true,
    },
    {
        id: '4',
        icon: Target,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-50 dark:bg-green-900/20',
        title: 'Goal milestone: Emergency Fund',
        description: "You've reached 50% of your goal!",
        time: 'Yesterday',
        read: true,
    },
];

// ─── Bottom Sheet wrapper ───
function BottomSheet({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] animate-fade-in"
                onClick={onClose}
            />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[91] animate-slide-up">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-t-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                    {children}
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function MobileHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const { actualTheme, theme, setTheme } = useTheme();
    const { user, userType } = useAuthStore();

    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleSignOut = async () => {
        setIsProfileOpen(false);
        if (auth) await signOut(auth);
        router.push('/login');
    };

    // ─── Breadcrumbs ───
    const breadcrumbs = useMemo(() => {
        const paths = pathname?.split('/').filter(Boolean) || [];
        return paths.map((path, index) => ({
            label: pathLabelMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
            href: '/' + paths.slice(0, index + 1).join('/'),
            isLast: index === paths.length - 1,
            icon: pathIconMap[path] || null,
        }));
    }, [pathname]);

    // Show logo only when breadcrumb is short
    const showFullLogo = breadcrumbs.length <= 2;

    const themeOptions = [
        { value: 'light' as const, icon: Sun, label: 'Light' },
        { value: 'dark' as const, icon: Moon, label: 'Dark' },
        { value: 'system' as const, icon: Monitor, label: 'System' },
    ];

    const profileMenuItems = [
        { href: '/profile', icon: User, label: 'Profile' },
        { href: '/settings', icon: Settings, label: 'Settings' },
        { href: '/achievements', icon: Trophy, label: 'Achievements' },
    ];

    return (
        <>
            {/* ─── Sticky Header Bar ─── */}
            <header className="h-14 bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-4 sticky top-0 z-50 flex-shrink-0">
                {/* Left: Logo + Breadcrumbs */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    {showFullLogo ? (
                        <Link href="/dashboard" className="flex-shrink-0">
                            <Image
                                src={actualTheme === 'dark' ? '/ElevIQ_White.png' : '/ElevIQ_Gold.png'}
                                alt="ElevIQ"
                                width={90}
                                height={28}
                                className="h-7 w-auto object-contain"
                                priority
                            />
                        </Link>
                    ) : (
                        <Link href="/dashboard" className="flex-shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">E</span>
                            </div>
                        </Link>
                    )}

                    {/* Separator */}
                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 flex-shrink-0" />

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-0.5 text-sm min-w-0 overflow-hidden">
                        {breadcrumbs.map((crumb, index) => {
                            // On mobile, only show last 2 breadcrumbs when there are 3+
                            if (breadcrumbs.length >= 3 && index < breadcrumbs.length - 2) {
                                if (index === 0) {
                                    return (
                                        <div key="ellipsis" className="flex items-center gap-0.5">
                                            <span className="text-gray-400 dark:text-gray-500 text-xs">…</span>
                                            <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                        </div>
                                    );
                                }
                                return null;
                            }

                            return (
                                <div key={crumb.href} className="flex items-center gap-0.5 min-w-0">
                                    {index > 0 && breadcrumbs.length < 3 && (
                                        <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                    )}
                                    {breadcrumbs.length >= 3 && index === breadcrumbs.length - 2 && index > 0 && (
                                        <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                    )}
                                    {crumb.isLast ? (
                                        <span className="text-gray-900 dark:text-white font-medium text-[13px] truncate">
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="text-gray-500 dark:text-gray-400 text-[13px] truncate"
                                        >
                                            {crumb.label}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Right: Action Icons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {/* Search */}
                    <button
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0A0A0A]" />
                        )}
                    </button>

                    {/* Profile */}
                    <button
                        onClick={() => setIsProfileOpen(true)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {user?.displayName?.[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                        </div>
                    </button>
                </div>
            </header>

            {/* ─── Command Palette (Search) ─── */}
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />

            {/* ─── Notification Bottom Sheet ─── */}
            <BottomSheet isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Notifications
                    </h3>
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={() => setIsNotificationsOpen(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {notifications.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const Icon = notification.icon;
                            return (
                                <div
                                    key={notification.id}
                                    className={`flex gap-3 px-5 py-4 ${!notification.read ? 'bg-blue-50/40 dark:bg-blue-900/[0.06]' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl ${notification.iconBg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-5 h-5 ${notification.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2">
                                            <p className={`text-sm leading-snug ${!notification.read
                                                ? 'font-medium text-gray-900 dark:text-white'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {notification.description}
                                        </p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 dark:border-white/5 p-2">
                    <Link
                        href="/alerts"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block text-center py-3 text-sm font-medium text-blue-500 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-xl transition-colors"
                    >
                        View All Notifications →
                    </Link>
                </div>
            </BottomSheet>

            {/* ─── Profile Bottom Sheet ─── */}
            <BottomSheet isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)}>
                {/* User Info */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                                {user?.displayName?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.displayName || 'User'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || 'user@email.com'}
                                </p>
                                {userType && (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                                        {userType}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsProfileOpen(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="py-2 border-b border-gray-100 dark:border-white/5">
                    {profileMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-5 py-3 text-[15px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                                <span className="flex-1">{item.label}</span>
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </Link>
                        );
                    })}
                </div>

                {/* Theme Switcher */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                        Theme
                    </p>
                    <div className="flex rounded-xl bg-gray-100 dark:bg-white/[0.06] p-1">
                        {themeOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = theme === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setTheme(option.value)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Extra Links */}
                <div className="py-2 border-b border-gray-100 dark:border-white/5">
                    <button className="w-full flex items-center gap-3 px-5 py-3 text-[15px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                        <span className="flex-1 text-left">Documentation</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-5 py-3 text-[15px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={1.75} />
                        <span className="flex-1 text-left">Send Feedback</span>
                    </button>
                </div>

                {/* Sign Out */}
                <div className="py-2 pb-6">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-5 py-3 text-[15px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" strokeWidth={1.75} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </BottomSheet>
        </>
    );
}
