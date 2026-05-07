'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// Material Design style icons as SVG components for premium look
const icons = {
    addExpense: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
        </svg>
    ),
    scanBill: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
    ),
    calculator: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="8" y2="10.01" />
            <line x1="12" y1="10" x2="12" y2="10.01" />
            <line x1="16" y1="10" x2="16" y2="10.01" />
            <line x1="8" y1="14" x2="8" y2="14.01" />
            <line x1="12" y1="14" x2="12" y2="14.01" />
            <line x1="16" y1="14" x2="16" y2="14.01" />
            <line x1="8" y1="18" x2="8" y2="18.01" />
            <line x1="12" y1="18" x2="16" y2="18" />
        </svg>
    ),
    splitBill: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M16 3h5v5" />
            <path d="M8 3H3v5" />
            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
            <path d="m15 9 6-6" />
        </svg>
    ),
    reminder: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    ),
    currency: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <circle cx="12" cy="12" r="8" />
            <line x1="3" y1="3" x2="6" y2="6" />
            <line x1="21" y1="3" x2="18" y2="6" />
            <line x1="3" y1="21" x2="6" y2="18" />
            <line x1="21" y1="21" x2="18" y2="18" />
        </svg>
    ),
    goals: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
            <path d="M2 9v1c0 1.1.9 2 2 2h1" />
        </svg>
    ),
    analytics: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
        </svg>
    ),
};

const quickActions = [
    {
        href: '/expenses?add=true',
        icon: icons.addExpense,
        label: 'Add Expense',
        gradient: 'from-blue-500 to-blue-600',
        shadow: 'shadow-blue-500/30',
        delay: 0
    },
    {
        href: '/scan',
        icon: icons.scanBill,
        label: 'Scan Receipt',
        gradient: 'from-violet-500 to-purple-600',
        shadow: 'shadow-violet-500/30',
        delay: 0.03
    },
    {
        href: '/calculator',
        icon: icons.calculator,
        label: 'Calculator',
        gradient: 'from-emerald-500 to-teal-600',
        shadow: 'shadow-emerald-500/30',
        delay: 0.06
    },
    {
        href: '/split',
        icon: icons.splitBill,
        label: 'Split Bill',
        gradient: 'from-orange-500 to-amber-600',
        shadow: 'shadow-orange-500/30',
        delay: 0.09
    },
    {
        href: '/reminders',
        icon: icons.reminder,
        label: 'Reminders',
        gradient: 'from-pink-500 to-rose-600',
        shadow: 'shadow-pink-500/30',
        delay: 0.12
    },
    {
        href: '/currency',
        icon: icons.currency,
        label: 'Currency',
        gradient: 'from-amber-500 to-yellow-600',
        shadow: 'shadow-amber-500/30',
        delay: 0.15
    },
    {
        href: '/goals',
        icon: icons.goals,
        label: 'Goals',
        gradient: 'from-cyan-500 to-sky-600',
        shadow: 'shadow-cyan-500/30',
        delay: 0.18
    },
    {
        href: '/analytics',
        icon: icons.analytics,
        label: 'Analytics',
        gradient: 'from-indigo-500 to-blue-600',
        shadow: 'shadow-indigo-500/30',
        delay: 0.21
    },
];

export default function QuickActionsWidget() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm"
        >
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Quick Actions
                </h3>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Tap to access
                </span>
            </div>

            <div className="p-5 pt-4">

                {/* Actions Grid - Premium Design */}
                <div className="grid grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <motion.div
                            key={action.href}
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                                delay: action.delay,
                                type: 'spring',
                                stiffness: 300,
                                damping: 20
                            }}
                        >
                            <Link
                                href={action.href}
                                className="group flex flex-col items-center gap-3"
                            >
                                {/* Icon Container with Gradient */}
                                <div className={`
                                relative w-14 h-14 rounded-2xl 
                                bg-gradient-to-br ${action.gradient} 
                                flex items-center justify-center 
                                shadow-lg ${action.shadow}
                                group-hover:scale-110 group-hover:shadow-xl
                                transition-all duration-300 ease-out
                                before:absolute before:inset-0 before:rounded-2xl 
                                before:bg-white/10 before:opacity-0 
                                group-hover:before:opacity-100 before:transition-opacity
                            `}>
                                    <div className="text-white">
                                        {action.icon}
                                    </div>
                                </div>

                                {/* Label */}
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center leading-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    {action.label}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
