'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { type Goal } from '@/hooks/useUserGoals';

interface GoalInsightsPanelProps {
    goals: Goal[];
}

interface Insight {
    type: 'success' | 'warning' | 'tip' | 'info';
    title: string;
    description: string;
    goalName?: string;
}

export default function GoalInsightsPanel({ goals }: GoalInsightsPanelProps) {
    const insights = useMemo<Insight[]>(() => {
        if (goals.length === 0) return [];

        const now = new Date();
        const results: Insight[] = [];

        // Analyze each goal
        goals.forEach(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const totalDays = Math.ceil((goal.targetDate.getTime() - (goal.createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24));
            const daysElapsed = totalDays - daysLeft;
            const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

            // Completed goals
            if (progress >= 100) {
                results.push({
                    type: 'success',
                    title: 'Goal Achieved! 🎉',
                    description: `Congratulations! You've completed your "${goal.name}" goal.`,
                    goalName: goal.name,
                });
            }
            // Ahead of schedule
            else if (progress > expectedProgress + 15) {
                results.push({
                    type: 'success',
                    title: 'Ahead of Schedule',
                    description: `"${goal.name}" is progressing faster than expected. Keep it up!`,
                    goalName: goal.name,
                });
            }
            // Behind schedule
            else if (progress < expectedProgress - 15 && daysLeft > 0) {
                const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
                const remaining = goal.targetAmount - goal.currentAmount;
                const monthlyNeeded = remaining / monthsLeft;

                results.push({
                    type: 'warning',
                    title: 'Behind Schedule',
                    description: `"${goal.name}" needs ₹${Math.round(monthlyNeeded).toLocaleString('en-IN')}/month to catch up.`,
                    goalName: goal.name,
                });
            }
            // Overdue
            else if (daysLeft < 0 && progress < 100) {
                results.push({
                    type: 'warning',
                    title: 'Overdue Goal',
                    description: `"${goal.name}" has passed its target date. Consider extending or boosting contributions.`,
                    goalName: goal.name,
                });
            }
            // Close to completion
            else if (progress >= 80 && progress < 100) {
                results.push({
                    type: 'info',
                    title: 'Almost There!',
                    description: `Just ${100 - Math.round(progress)}% left to complete "${goal.name}".`,
                    goalName: goal.name,
                });
            }
        });

        // Overall tips
        const totalMonthlyNeeded = goals.reduce((sum, g) => {
            const daysLeft = Math.ceil((g.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            return sum + (remaining / monthsLeft);
        }, 0);

        if (totalMonthlyNeeded > 0 && goals.length > 0) {
            results.push({
                type: 'tip',
                title: 'Monthly Savings Target',
                description: `Save ₹${Math.round(totalMonthlyNeeded).toLocaleString('en-IN')}/month to hit all goals on time.`,
            });
        }

        // Limit to top 4 insights
        return results.slice(0, 4);
    }, [goals]);

    const getIcon = (type: Insight['type']) => {
        switch (type) {
            case 'success': return CheckCircle2;
            case 'warning': return AlertCircle;
            case 'tip': return Lightbulb;
            case 'info': return TrendingUp;
        }
    };

    const getColor = (type: Insight['type']) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
            case 'tip': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'info': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
        }
    };

    if (goals.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden"
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Goal Insights</h3>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                    AI
                </span>
            </div>

            <div className="p-4 space-y-3">
                {insights.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        Add some goals to get personalized insights!
                    </p>
                ) : (
                    insights.map((insight, index) => {
                        const Icon = getIcon(insight.type);
                        const colorClass = getColor(insight.type);
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {insight.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {insight.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {insights.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <button className="w-full flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                        View Full Analysis
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
