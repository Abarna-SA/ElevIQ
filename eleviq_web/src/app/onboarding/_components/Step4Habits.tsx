'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { ExpenseCategory, SavingDifficulty, TrackingFrequency } from '@/app/(auth)/_hooks/useUserDocument';

interface Step4HabitsProps {
    biggestExpense: ExpenseCategory | null;
    savingDifficulty: SavingDifficulty | null;
    trackingFrequency: TrackingFrequency | null;
    onBiggestExpenseChange: (value: ExpenseCategory) => void;
    onSavingDifficultyChange: (value: SavingDifficulty) => void;
    onTrackingFrequencyChange: (value: TrackingFrequency) => void;
}

const expenseCategories: { value: ExpenseCategory; label: string; icon: string }[] = [
    { value: 'food', label: 'Food', icon: '🍔' },
    { value: 'transport', label: 'Transport', icon: '🚗' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'rent', label: 'Rent', icon: '🏠' },
    { value: 'bills', label: 'Bills', icon: '📱' },
    { value: 'entertainment', label: 'Fun', icon: '🎮' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'health', label: 'Health', icon: '⚕️' },
    { value: 'other', label: 'Other', icon: '💡' },
];

const savingDifficulties: { value: SavingDifficulty; label: string; emoji: string }[] = [
    { value: 'easy', label: 'Easy', emoji: '😊' },
    { value: 'moderate', label: 'Medium', emoji: '😐' },
    { value: 'hard', label: 'Hard', emoji: '😓' },
    { value: 'very_hard', label: 'V. Hard', emoji: '😰' },
];

const trackingFrequencies: { value: TrackingFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'rarely', label: 'Rarely' },
];

export default function Step4Habits({
    biggestExpense,
    savingDifficulty,
    trackingFrequency,
    onBiggestExpenseChange,
    onSavingDifficultyChange,
    onTrackingFrequencyChange,
}: Step4HabitsProps) {
    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Tell us about your spending
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    This helps us personalize insights
                </p>
            </motion.div>

            {/* Biggest Expense */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Where do you spend the most? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {expenseCategories.map((cat, index) => (
                        <motion.button
                            key={cat.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + index * 0.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onBiggestExpenseChange(cat.value)}
                            className={`p-2.5 sm:p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 ${biggestExpense === cat.value
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-xs font-medium">{cat.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Saving Difficulty */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    How difficult is saving for you? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {savingDifficulties.map((diff, index) => (
                        <motion.button
                            key={diff.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSavingDifficultyChange(diff.value)}
                            className={`p-2.5 sm:p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 ${savingDifficulty === diff.value
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <span className="text-2xl">{diff.emoji}</span>
                            <span className="text-xs font-medium">{diff.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Tracking Frequency */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    How often will you track expenses? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {trackingFrequencies.map((freq, index) => (
                        <motion.button
                            key={freq.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + index * 0.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onTrackingFrequencyChange(freq.value)}
                            className={`p-3 sm:p-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${trackingFrequency === freq.value
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {freq.label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
