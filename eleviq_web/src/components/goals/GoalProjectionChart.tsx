'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type Goal } from '@/hooks/useUserGoals';

interface GoalProjectionChartProps {
    goals: Goal[];
}

export default function GoalProjectionChart({ goals }: GoalProjectionChartProps) {
    const chartData = useMemo(() => {
        if (goals.length === 0) return [];

        const now = new Date();
        const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);

        // Find the furthest target date
        const furthestDate = goals.reduce((max, g) =>
            g.targetDate > max ? g.targetDate : max
            , now);

        // Generate monthly projections
        const months: { month: string; actual: number; projected: number; target: number }[] = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Calculate monthly savings rate needed
        const monthsUntilTarget = Math.ceil((furthestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const remaining = totalTarget - totalCurrent;
        const monthlyRate = remaining / Math.max(1, monthsUntilTarget);

        // Generate 6 months of data
        for (let i = 0; i < Math.min(6, monthsUntilTarget + 1); i++) {
            const date = new Date(now);
            date.setMonth(date.getMonth() + i);

            const projected = Math.min(totalCurrent + (monthlyRate * i), totalTarget);
            const actual = i === 0 ? totalCurrent : null;

            months.push({
                month: monthNames[date.getMonth()],
                actual: actual ?? 0,
                projected: Math.round(projected),
                target: totalTarget,
            });
        }

        return months;
    }, [goals]);

    const formatValue = (value: number) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value}`;
    };

    if (goals.length === 0) return null;

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">Savings Projection</h3>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-blue-500 rounded" />
                        <span className="text-gray-500 dark:text-gray-400">Projected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-green-500 rounded" style={{ borderStyle: 'dashed' }} />
                        <span className="text-gray-500 dark:text-gray-400">Target</span>
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={formatValue}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(23, 23, 23, 0.95)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                            }}
                            formatter={(value: number | undefined) => [formatValue(value ?? 0), '']}
                            labelStyle={{ color: '#9CA3AF' }}
                        />
                        <ReferenceLine
                            y={totalTarget}
                            stroke="#22C55E"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="projected"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Based on current savings rate, you&apos;ll reach your combined target of{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">{formatValue(totalTarget)}</span>
                </p>
            </div>
        </motion.div>
    );
}
