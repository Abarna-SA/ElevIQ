'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Target } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useUserGoals, type Goal } from '@/hooks/useUserGoals';
import {
    GoalsOverviewCard,
    GoalCard,
    GoalInsightsPanel,
    GoalProjectionChart,
    AddGoalModal,
    AddFundsModal,
    GoalsEmptyState,
} from '@/components/goals';

export default function GoalsPage() {
    const {
        goals,
        isLoading,
        error,
        totalSaved,
        totalTarget,
        addGoal,
        addFunds,
        withdrawFunds,
        deleteGoal,
        updateGoal,
    } = useUserGoals();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [fundsModal, setFundsModal] = useState<{
        isOpen: boolean;
        goal: Goal | null;
        mode: 'add' | 'withdraw';
    }>({
        isOpen: false,
        goal: null,
        mode: 'add',
    });

    // Handlers
    const handleAddGoal = async (goal: {
        name: string;
        targetAmount: number;
        currentAmount: number;
        targetDate: Date;
        color: string;
        icon?: string;
    }) => {
        await addGoal(goal);
    };

    const handleOpenAddFunds = (goalId: string) => {
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
            setFundsModal({ isOpen: true, goal, mode: 'add' });
        }
    };

    const handleOpenWithdraw = (goalId: string) => {
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
            setFundsModal({ isOpen: true, goal, mode: 'withdraw' });
        }
    };

    const handleFundsConfirm = async (goalId: string, amount: number) => {
        if (fundsModal.mode === 'add') {
            await addFunds(goalId, amount);
        } else {
            await withdrawFunds(goalId, amount);
        }
    };

    const handleEdit = (goal: Goal) => {
        // For now, just log - could implement edit modal
        console.log('Edit goal:', goal);
    };

    const handleDelete = async (goalId: string) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            await deleteGoal(goalId);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Loading your goals...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Target}
                iconColor="text-pink-400"
                title="Goals"
                actions={
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Goal</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                {goals.length === 0 ? (
                    // Empty State
                    <GoalsEmptyState onCreateGoal={() => setShowAddModal(true)} />
                ) : (
                    <div className="space-y-8">
                        {/* Overview Card */}
                        <GoalsOverviewCard
                            goals={goals}
                            totalSaved={totalSaved}
                            totalTarget={totalTarget}
                        />

                        {/* Charts & Insights Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Projection Chart */}
                            <div className="lg:col-span-2">
                                <GoalProjectionChart goals={goals} />
                            </div>

                            {/* Insights Panel */}
                            <div>
                                <GoalInsightsPanel goals={goals} />
                            </div>
                        </div>

                        {/* Goals Grid */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Your Goals
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goals.map((goal, index) => (
                                    <motion.div
                                        key={goal.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <GoalCard
                                            goal={goal}
                                            onAddFunds={handleOpenAddFunds}
                                            onWithdraw={handleOpenWithdraw}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Goal Modal */}
                <AddGoalModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddGoal}
                />

                {/* Add/Withdraw Funds Modal */}
                <AddFundsModal
                    isOpen={fundsModal.isOpen}
                    goal={fundsModal.goal}
                    mode={fundsModal.mode}
                    onClose={() => setFundsModal({ isOpen: false, goal: null, mode: 'add' })}
                    onConfirm={handleFundsConfirm}
                />
            </div>
        </div>
    );
}
