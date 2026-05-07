'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Plus, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getCategoryById, Expense } from '@/types/expense';

interface TransactionsWidgetProps {
    expenses: Expense[];
}

export default function TransactionsWidget({ expenses }: TransactionsWidgetProps) {
    const recentExpenses = expenses.slice(0, 6);

    const getTimeText = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 5) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return format(date, 'MMM d');
    };

    if (recentExpenses.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm"
            >
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No transactions yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Start tracking your spending</p>
                    <Link
                        href="/expenses/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Expense
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Recent Transactions</h3>
                <Link
                    href="/expenses"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    All
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Transactions List */}
            <div className="flex-1 px-6">
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {recentExpenses.map((expense, index) => {
                        const category = getCategoryById(expense.categoryId);

                        return (
                            <motion.div
                                key={expense.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="py-3 flex items-center gap-4 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 -mx-6 px-6 transition-colors"
                            >
                                {/* Category Dot */}
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: category?.color || '#6B7280' }}
                                />

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {expense.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {category?.name || 'Other'} · {getTimeText(expense.date)}
                                    </p>
                                </div>

                                {/* Amount */}
                                <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                    ₹{expense.amount.toLocaleString('en-IN')}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
