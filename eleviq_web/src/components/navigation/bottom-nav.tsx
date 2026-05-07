'use client';

import Link from 'next/link';
import { Home, Receipt, PieChart, Sparkles, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
    className?: string;
    hidden?: boolean;
}

export default function BottomNav({ className, hidden }: BottomNavProps) {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', icon: Home, label: 'Home' },
        { href: '/expenses', icon: Receipt, label: 'Expenses' },
        { href: '/chat', icon: Sparkles, label: 'AI Chat', isCenter: true },
        { href: '/analytics', icon: PieChart, label: 'Analytics' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#171717] border-t border-gray-200 dark:border-white/5 z-50 transition-transform duration-300 ease-in-out ${hidden ? 'translate-y-full' : 'translate-y-0'} ${className}`}>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        const Icon = item.icon;

                        if (item.isCenter) {
                            return (
                                <Link key={item.href} href={item.href} className="flex flex-col items-center">
                                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center -mt-6 shadow-lg hover:bg-blue-700 transition-colors">
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center py-2 px-4 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
