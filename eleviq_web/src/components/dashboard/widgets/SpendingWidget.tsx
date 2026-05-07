'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { getCategoryById } from '@/types/expense';

interface SpendingWidgetProps {
    monthlyTotal: number;
    budget: number;
    categoryTotals: Record<string, number>;
    transactionCount: number;
}

// Mock trend data
const trendData = [
    { day: 'Mon', value: 2400 },
    { day: 'Tue', value: 1800 },
    { day: 'Wed', value: 3200 },
    { day: 'Thu', value: 2800 },
    { day: 'Fri', value: 4100 },
    { day: 'Sat', value: 3500 },
    { day: 'Sun', value: 2900 },
];

export default function SpendingWidget({ monthlyTotal, budget, categoryTotals, transactionCount }: SpendingWidgetProps) {
    const budgetProgress = budget > 0 ? Math.min((monthlyTotal / budget) * 100, 100) : 0;
    const remaining = Math.max(budget - monthlyTotal, 0);
    const isOverBudget = monthlyTotal > budget && budget > 0;

    const topCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm"
        >
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">This Month</h3>
                <Link
                    href="/analytics"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    Analytics
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-6 pt-5">

                {/* Main Stats */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                            ₹{monthlyTotal.toLocaleString('en-IN')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                {isOverBudget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {Math.round(budgetProgress)}% of budget
                            </span>
                        </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="w-28 h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#111827" stopOpacity={0.08} />
                                        <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="spendingGradientDark" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.1} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    className="[--stroke:#111827] dark:[--stroke:#ffffff]"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    fill="url(#spendingGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Budget used</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{remaining.toLocaleString('en-IN')} left</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-gray-900 dark:bg-white'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${budgetProgress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Category Breakdown */}
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Top Categories</p>
                    <div className="space-y-3">
                        {topCategories.slice(0, 4).map(([categoryId, amount]) => {
                            const category = getCategoryById(categoryId);
                            const percentage = monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0;

                            return (
                                <div key={categoryId}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{category?.name || 'Other'}</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            ₹{amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gray-400 dark:bg-gray-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transactions</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">{transactionCount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Daily Avg</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-0.5">
                            ₹{Math.round(monthlyTotal / new Date().getDate()).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
