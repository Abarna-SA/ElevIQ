'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
    Bell,
    ShieldAlert,
    CalendarClock,
    Lightbulb,
    Target,
    Check,
} from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

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

// Mock notifications — connect to real data later
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

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const ref = useRef<HTMLDivElement>(null);

    useClickOutside(ref, () => setIsOpen(false), isOpen);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isOpen
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                title="Notifications"
            >
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0A0A0A]" />
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animate-dropdown-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[340px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = notification.icon;
                                return (
                                    <div
                                        key={notification.id}
                                        className={`flex gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-gray-50 dark:border-white/[0.03] last:border-0 ${!notification.read ? 'bg-blue-50/40 dark:bg-blue-900/[0.06]' : ''
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-9 h-9 rounded-lg ${notification.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <Icon className={`w-4 h-4 ${notification.iconColor}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-2">
                                                <p className={`text-sm leading-snug ${!notification.read
                                                    ? 'font-medium text-gray-900 dark:text-white'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
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
                    <div className="border-t border-gray-100 dark:border-white/5">
                        <Link
                            href="/alerts"
                            onClick={() => setIsOpen(false)}
                            className="block text-center py-2.5 text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                        >
                            View All Notifications →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
