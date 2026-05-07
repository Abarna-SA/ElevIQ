'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Wallet, Pencil, X, Check } from 'lucide-react';

interface BudgetProgressWidgetProps {
    spent: number;
    budget: number;
    currency?: string;
    daysLeft?: number;
    onBudgetUpdate?: (newBudget: number) => void;
}

export default function BudgetProgressWidget({
    spent,
    budget,
    currency = '₹',
    daysLeft = 0,
    onBudgetUpdate,
}: BudgetProgressWidgetProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(budget.toString());

    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const remaining = Math.max(0, budget - spent);
    const isOverBudget = spent > budget;

    const handleSave = () => {
        const newBudget = parseInt(editValue.replace(/[^0-9]/g, ''), 10);
        if (newBudget > 0 && onBudgetUpdate) {
            onBudgetUpdate(newBudget);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(budget.toString());
        setIsEditing(false);
    };

    // Empty state
    if (!budget || budget === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm flex flex-col"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Monthly Budget</h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                        <Wallet className="w-7 h-7 text-green-500 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Set your monthly budget</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Track spending against your limit</p>
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <span className="text-lg">+</span> Set Budget
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm"
        >
            {/* Header with Edit */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Monthly Budget</h3>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Budget Display / Edit */}
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mb-4"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">{currency}</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-medium"
                                autoFocus
                            />
                            <button
                                onClick={handleSave}
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {currency}{spent.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-500">/ {currency}{budget.toLocaleString('en-IN')}</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`h-full rounded-full ${isOverBudget
                            ? 'bg-red-500'
                            : percentage > 80
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                        }`}
                />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {percentage}% used
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                    {isOverBudget ? (
                        <span className="text-red-600 dark:text-red-400">
                            {currency}{(spent - budget).toLocaleString('en-IN')} over
                        </span>
                    ) : (
                        <>
                            {currency}{remaining.toLocaleString('en-IN')} left
                            {daysLeft > 0 && <span className="ml-1">• {daysLeft}d</span>}
                        </>
                    )}
                </span>
            </div>
        </motion.div>
    );
}
