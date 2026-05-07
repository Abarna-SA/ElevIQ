'use client';

import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeatmapData {
    date: Date;
    amount: number;
}

interface SpendingHeatmapProps {
    data: HeatmapData[];
}

const getHeatColor = (amount: number, max: number): string => {
    if (amount === 0) return 'bg-gray-100 dark:bg-gray-800';
    const ratio = amount / max;
    if (ratio < 0.2) return 'bg-green-200 dark:bg-green-900/50';
    if (ratio < 0.4) return 'bg-yellow-200 dark:bg-yellow-900/50';
    if (ratio < 0.6) return 'bg-orange-200 dark:bg-orange-900/50';
    if (ratio < 0.8) return 'bg-red-300 dark:bg-red-800/60';
    return 'bg-red-500 dark:bg-red-600';
};

export function SpendingHeatmap({ data }: SpendingHeatmapProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const { days, expenseMap, maxAmount } = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        const expenseMap = new Map<string, number>();
        let maxAmount = 0;

        data.forEach((e) => {
            if (isSameMonth(e.date, currentMonth)) {
                const key = format(e.date, 'yyyy-MM-dd');
                const newAmount = (expenseMap.get(key) || 0) + e.amount;
                expenseMap.set(key, newAmount);
                maxAmount = Math.max(maxAmount, newAmount);
            }
        });

        return { days, expenseMap, maxAmount: maxAmount || 1 };
    }, [data, currentMonth]);

    // Calculate starting offset for the first week
    const firstDayOffset = getDay(days[0]); // 0 = Sunday

    const monthTotal = Array.from(expenseMap.values()).reduce((sum, v) => sum + v, 0);
    const daysWithSpending = Array.from(expenseMap.values()).filter(v => v > 0).length;

    return (
        <div className="space-y-3">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="font-medium text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx} className="py-1">{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOffset }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {/* Days */}
                {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const amount = expenseMap.get(key) || 0;
                    const heatColor = getHeatColor(amount, maxAmount);

                    return (
                        <div
                            key={key}
                            className={`aspect-square rounded-md ${heatColor} flex items-center justify-center text-xs cursor-pointer transition-transform hover:scale-110 group relative`}
                        >
                            <span className={amount > 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-600'}>
                                {format(day, 'd')}
                            </span>

                            {/* Tooltip */}
                            {amount > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    ₹{amount.toLocaleString('en-IN')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-2 text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">Less</span>
                    <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/50" />
                        <div className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900/50" />
                        <div className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-900/50" />
                        <div className="w-3 h-3 rounded bg-red-500 dark:bg-red-600" />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">More</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                    {daysWithSpending} days spent
                </span>
            </div>

            {/* Month Stats */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">This month</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        ₹{monthTotal.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SpendingHeatmap;
