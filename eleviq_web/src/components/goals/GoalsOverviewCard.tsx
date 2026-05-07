'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { type Goal } from '@/hooks/useUserGoals';

interface GoalsOverviewCardProps {
    goals: Goal[];
    totalSaved: number;
    totalTarget: number;
}

export default function GoalsOverviewCard({ goals, totalSaved, totalTarget }: GoalsOverviewCardProps) {
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const stats = useMemo(() => {
        const now = new Date();
        const active = goals.filter(g => g.currentAmount < g.targetAmount);
        const completed = goals.filter(g => g.currentAmount >= g.targetAmount);
        const behindSchedule = goals.filter(g => {
            const daysLeft = Math.ceil((g.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const expectedProgress = Math.max(0, 100 - (daysLeft / 365) * 100);
            const actualProgress = (g.currentAmount / g.targetAmount) * 100;
            return daysLeft > 0 && actualProgress < expectedProgress - 10 && g.currentAmount < g.targetAmount;
        });

        // Calculate monthly savings needed
        const totalRemaining = goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.currentAmount), 0);
        const avgMonthsLeft = goals.length > 0
            ? goals.reduce((sum, g) => {
                const daysLeft = Math.ceil((g.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return sum + Math.max(1, Math.ceil(daysLeft / 30));
            }, 0) / goals.length
            : 1;
        const monthlyNeeded = totalRemaining / avgMonthsLeft;

        return {
            active: active.length,
            completed: completed.length,
            behind: behindSchedule.length,
            monthlyNeeded,
        };
    }, [goals]);

    // Data for donut chart
    const chartData = useMemo(() => [
        { name: 'Saved', value: totalSaved, color: '#3B82F6' },
        { name: 'Remaining', value: Math.max(0, totalTarget - totalSaved), color: '#E5E7EB' },
    ], [totalSaved, totalTarget]);

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl p-6 text-white relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative flex flex-col lg:flex-row gap-6">
                {/* Left side - Chart */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={55}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.2)'}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold">{Math.round(overallProgress)}%</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-white/70 mb-1">Total Saved</p>
                        <p className="text-3xl font-bold mb-2">{formatValue(totalSaved)}</p>
                        <p className="text-sm text-white/70">
                            of {formatValue(totalTarget)} target
                        </p>
                    </div>
                </div>

                {/* Right side - Stats */}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-white/70" />
                            <span className="text-sm text-white/70">Active</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.active}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-300" />
                            <span className="text-sm text-white/70">Completed</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-300" />
                            <span className="text-sm text-white/70">Behind</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.behind}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-white/70" />
                            <span className="text-sm text-white/70">Monthly</span>
                        </div>
                        <p className="text-lg font-bold">{formatValue(stats.monthlyNeeded)}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
