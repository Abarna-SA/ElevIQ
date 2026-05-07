'use client';

import React, { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine, Bar, ComposedChart } from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay, isWeekend } from 'date-fns';

interface DailyExpense {
    date: Date;
    amount: number;
}

interface SpendingTrendChartProps {
    expenses: DailyExpense[];
    days?: number;
    height?: number;
}

export function SpendingTrendChart({ expenses, days = 30, height = 280 }: SpendingTrendChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const { chartData, stats } = useMemo(() => {
        const today = startOfDay(new Date());
        const startDate = subDays(today, days - 1);

        // Create all days in range
        const allDays = eachDayOfInterval({ start: startDate, end: today });

        // Group expenses by day
        const expenseMap = new Map<string, number>();
        expenses.forEach((e) => {
            const key = format(e.date, 'yyyy-MM-dd');
            expenseMap.set(key, (expenseMap.get(key) || 0) + e.amount);
        });

        const chartData = allDays.map((day, index) => {
            const key = format(day, 'yyyy-MM-dd');
            const amount = expenseMap.get(key) || 0;
            return {
                date: key,
                label: format(day, 'MMM d'),
                shortLabel: format(day, 'd'),
                dayName: format(day, 'EEE'),
                amount,
                isWeekend: isWeekend(day),
                index,
            };
        });

        const amounts = chartData.map(d => d.amount).filter(a => a > 0);
        const total = amounts.reduce((sum, a) => sum + a, 0);
        const avg = total / days;
        const max = Math.max(...amounts, 1);
        const min = amounts.length ? Math.min(...amounts) : 0;
        const daysWithSpending = amounts.length;

        return {
            chartData,
            stats: { total, avg, max, min, daysWithSpending }
        };
    }, [expenses, days]);

    return (
        <div className="h-full flex flex-col">
            {/* Stats Row */}
            <div className="flex items-center gap-6 mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Spending</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Total: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            ₹{stats.total.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Daily Avg: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            ₹{stats.avg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">Peak: </span>
                        <span className="font-semibold text-red-500">
                            ₹{stats.max.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1">
                <ResponsiveContainer width="100%" height={height}>
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        onMouseMove={(e: any) => {
                            if (e?.activeTooltipIndex !== undefined) {
                                setActiveIndex(e.activeTooltipIndex);
                            }
                        }}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <defs>
                            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            opacity={0.15}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            interval={'preserveStartEnd'}
                            tickMargin={8}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                            width={60}
                        />

                        {/* Average line */}
                        <ReferenceLine
                            y={stats.avg}
                            stroke="#10B981"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            label={{
                                value: 'Avg',
                                position: 'right',
                                fill: '#10B981',
                                fontSize: 10
                            }}
                        />

                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const vsAvg = data.amount - stats.avg;
                                    return (
                                        <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{data.dayName}, {label}</div>
                                            <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                                ₹{data.amount.toLocaleString('en-IN')}
                                            </div>
                                            {data.amount > 0 && (
                                                <div className={`text-xs mt-1 ${vsAvg > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {vsAvg > 0 ? '+' : ''}₹{vsAvg.toLocaleString('en-IN', { maximumFractionDigits: 0 })} vs avg
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#3B82F6"
                            strokeWidth={2.5}
                            fill="url(#spendingGradient)"
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: '#3B82F6',
                                stroke: '#fff',
                                strokeWidth: 2
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Bottom Stats */}
            <div className="flex justify-between items-center mt-3 px-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                    Last {days} days • {stats.daysWithSpending} days with spending
                </span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-500 dark:text-gray-400">Avg line</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SpendingTrendChart;
