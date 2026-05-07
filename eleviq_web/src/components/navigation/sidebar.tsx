'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Receipt,
    PieChart,
    MessageSquare,
    Settings,
    User,
    Calculator,
    Bell,
    Plus,
    ChevronRight,
    ChevronDown,
    LogOut,
    Download,
    Repeat,
    Target,
    Clock,
    Camera,
    Lightbulb,
    Gauge,
    ArrowLeftRight,
    Users,
    Home as HomeIcon,
    Trophy,
    Wallet,
    CalendarCheck,
    Search,
    Command,
    LayoutDashboard,
    FolderOpen,
    LineChart,
    Zap,
    CreditCard,
    HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AuthService } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    className?: string;
}

interface NavSection {
    title: string;
    items: {
        href: string;
        icon: React.ElementType;
        label: string;
    }[];
}

const navSections: NavSection[] = [
    {
        title: 'Overview',
        items: [
            { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/expenses', icon: Receipt, label: 'Expenses' },
            { href: '/analytics', icon: LineChart, label: 'Analytics' },
            { href: '/networth', icon: Wallet, label: 'Net Worth' },
        ]
    },
    {
        title: 'Tools',
        items: [
            { href: '/scan', icon: Camera, label: 'Scan Receipt' },
            { href: '/chat', icon: MessageSquare, label: 'AI Assistant' },
            { href: '/calculator', icon: Calculator, label: 'Calculators' },
            { href: '/bills', icon: CalendarCheck, label: 'Bill Calendar' },
            { href: '/export', icon: Download, label: 'Export Data' },
        ]
    },
    {
        title: 'Insights',
        items: [
            { href: '/insights', icon: Lightbulb, label: 'Smart Insights' },
            { href: '/limits', icon: Gauge, label: 'Spending Limits' },
            { href: '/compare', icon: ArrowLeftRight, label: 'Compare' },
        ]
    },
    {
        title: 'Planning',
        items: [
            { href: '/goals', icon: Target, label: 'Goals' },
            { href: '/recurring', icon: Repeat, label: 'Recurring' },
            { href: '/reminders', icon: Clock, label: 'Reminders' },
        ]
    },
    {
        title: 'Social',
        items: [
            { href: '/split', icon: Users, label: 'Split Expenses' },
            { href: '/family', icon: HomeIcon, label: 'Family Budget' },
        ]
    },
];

const bottomItems = [
    { href: '/achievements', icon: Trophy, label: 'Achievements' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, reset } = useAuthStore();
    const [expandedSections, setExpandedSections] = useState<string[]>(['Overview', 'Tools']);

    const handleLogout = async () => {
        await AuthService.signOut();
        reset();
        router.push('/login');
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    return (
        <aside className={`w-64 h-screen bg-[#1C1C1C] flex flex-col ${className}`}>
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">ElevIQ</span>
                </Link>
            </div>

            {/* Search */}
            <div className="px-3 py-3">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors">
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">Search...</span>
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                        <Command className="w-3 h-3" />K
                    </span>
                </button>
            </div>

            {/* Quick Action */}
            <div className="px-3 pb-3">
                <Link
                    href="/expenses/add"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Expense
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2">
                {navSections.map((section) => {
                    const isExpanded = expandedSections.includes(section.title);
                    const hasActiveItem = section.items.some(item => isActive(item.href));

                    return (
                        <div key={section.title} className="mb-1">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="w-full flex items-center gap-2 px-2 py-2 text-xs font-medium text-gray-500 hover:text-gray-300 uppercase tracking-wider transition-colors"
                            >
                                <ChevronRight
                                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                                <span>{section.title}</span>
                                {hasActiveItem && !isExpanded && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto" />
                                )}
                            </button>

                            {/* Section Items */}
                            {isExpanded && (
                                <ul className="space-y-0.5 mb-3">
                                    {section.items.map((item) => {
                                        const active = isActive(item.href);
                                        const Icon = item.icon;

                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center gap-3 px-3 py-2 ml-2 rounded-lg text-sm transition-colors ${active
                                                            ? 'bg-white/10 text-white'
                                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 py-2 border-t border-white/5">
                {bottomItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-white/5">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {user?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
