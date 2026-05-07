'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Target } from 'lucide-react';

interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: Date;
    icon?: string;
}

interface GoalsWidgetProps {
    goals: Goal[];
}

export default function GoalsWidget({ goals }: GoalsWidgetProps) {
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
    const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

    if (goals.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Goals</h3>
                </div>

                {/* Empty State */}
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                        <Target className="w-7 h-7 text-purple-500 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Add your first goal</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Start saving towards something special</p>
                    <Link
                        href="/goals"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <span className="text-lg">+</span> Create Goal
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
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Goals</h3>
                <Link
                    href="/goals"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    All
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-6 pt-5 flex-1 flex flex-col">

                {/* Stats */}
                <div className="flex items-baseline gap-3 mb-6">
                    <p className="text-3xl font-semibold text-gray-900 dark:text-white">{activeGoals.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">active</p>
                    {completedCount > 0 && (
                        <>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{completedCount} completed</p>
                        </>
                    )}
                </div>

                {/* Goals List */}
                <div className="flex-1 space-y-4">
                    {goals.slice(0, 3).map((goal) => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        const isCompleted = goal.currentAmount >= goal.targetAmount;

                        return (
                            <div key={goal.id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{goal.name}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gray-900 dark:bg-white'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <span>₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                                    <span>₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
