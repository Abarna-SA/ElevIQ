'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';

interface SavingsRateWidgetProps {
    income: number;
    expenses: number;
    currency?: string;
    previousRate?: number; // Previous month's rate for comparison
}

export default function SavingsRateWidget({
    income,
    expenses,
    currency = '₹',
    previousRate,
}: SavingsRateWidgetProps) {
    const savings = income - expenses;
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
    const rateChange = previousRate !== undefined ? savingsRate - previousRate : 0;

    // Empty state
    if (!income || income === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm flex flex-col"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Savings Rate</h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                        <PiggyBank className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Track your savings rate</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">How much you save each month</p>
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Set Income
                    </Link>
                </div>
            </motion.div>
        );
    }

    const isPositive = savings > 0;
    const isImproving = rateChange > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Savings Rate</h3>
                {previousRate !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isImproving
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                        {isImproving ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(rateChange)}%
                    </div>
                )}
            </div>

            {/* Main Rate Display */}
            <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-bold ${savingsRate >= 20
                        ? 'text-green-600 dark:text-green-400'
                        : savingsRate >= 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : savingsRate >= 0
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-red-600 dark:text-red-400'
                    }`}>
                    {savingsRate}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">of income</span>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Income</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {currency}{income.toLocaleString('en-IN')}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Expenses</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        -{currency}{expenses.toLocaleString('en-IN')}
                    </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Saved</span>
                    <span className={`font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isPositive ? '+' : ''}{currency}{Math.abs(savings).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {/* Tip */}
            {savingsRate < 20 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        💡 Aim for 20%+ savings rate for financial security
                    </p>
                </div>
            )}
        </motion.div>
    );
}
