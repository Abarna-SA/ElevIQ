'use client';

import { motion } from 'framer-motion';
import { Check, Clock, AlertTriangle, MoreVertical, Plus, Minus, Target } from 'lucide-react';
import GoalProgressRing from './GoalProgressRing';
import GoalMilestones from './GoalMilestones';
import { type Goal } from '@/hooks/useUserGoals';

interface GoalCardProps {
    goal: Goal;
    onAddFunds: (goalId: string) => void;
    onWithdraw: (goalId: string) => void;
    onEdit: (goal: Goal) => void;
    onDelete: (goalId: string) => void;
}

const goalIcons: Record<string, string> = {
    emergency: '🚨',
    vacation: '🏖️',
    car: '🚗',
    home: '🏠',
    wedding: '💍',
    education: '📚',
    gadget: '📱',
    medical: '💊',
    other: '✨',
};

export default function GoalCard({
    goal,
    onAddFunds,
    onWithdraw,
    onEdit,
    onDelete
}: GoalCardProps) {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isComplete = progress >= 100;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    // Calculate days left
    const now = new Date();
    const daysLeft = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Status helpers
    const getStatusInfo = () => {
        if (isComplete) return { label: 'Completed! 🎉', color: 'text-green-600', icon: Check };
        if (daysLeft < 0) return { label: 'Overdue', color: 'text-red-600', icon: AlertTriangle };
        if (daysLeft === 0) return { label: 'Due today', color: 'text-amber-600', icon: Clock };
        if (daysLeft <= 7) return { label: `${daysLeft} days left`, color: 'text-amber-600', icon: Clock };
        if (daysLeft <= 30) return { label: `${daysLeft} days left`, color: 'text-blue-600', icon: Clock };
        return { label: `${daysLeft} days left`, color: 'text-gray-500', icon: Clock };
    };

    const status = getStatusInfo();

    // Monthly savings needed
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    const monthlySavingsNeeded = remaining / monthsLeft;

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${goal.color}15` }}
                    >
                        {goalIcons[goal.icon || 'other'] || <Target className="w-6 h-6" style={{ color: goal.color }} />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                        <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                            <status.icon className="w-3.5 h-3.5" />
                            {status.label}
                        </div>
                    </div>
                </div>
                <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                            onClick={() => onEdit(goal)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(goal.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Ring */}
            <div className="flex justify-center py-6">
                <GoalProgressRing progress={progress} size={140} strokeWidth={10} color={goal.color}>
                    <div className="text-center">
                        <p className="text-2xl font-bold" style={{ color: goal.color }}>
                            {Math.round(progress)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatValue(goal.currentAmount)}
                        </p>
                    </div>
                </GoalProgressRing>
            </div>

            {/* Amount Info */}
            <div className="px-4 pb-4">
                <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500 dark:text-gray-400">Target</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatValue(goal.targetAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatValue(remaining)}</span>
                </div>

                {/* Milestones */}
                <GoalMilestones progress={progress} color={goal.color} />

                {/* Monthly savings suggestion */}
                {!isComplete && daysLeft > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Save <span className="font-semibold" style={{ color: goal.color }}>{formatValue(monthlySavingsNeeded)}/month</span> to stay on track
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isComplete && (
                <div className="flex border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={() => onAddFunds(goal.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        style={{ color: goal.color }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Funds
                    </button>
                    <div className="w-px bg-gray-100 dark:bg-white/5" />
                    <button
                        onClick={() => onWithdraw(goal.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <Minus className="w-4 h-4" />
                        Withdraw
                    </button>
                </div>
            )}
        </motion.div>
    );
}
