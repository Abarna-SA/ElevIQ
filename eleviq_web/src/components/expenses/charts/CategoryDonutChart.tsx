'use client';

import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import { defaultCategories } from '@/types/expense';

interface CategoryData {
    categoryId: string;
    amount: number;
}

interface CategoryDonutChartProps {
    data: CategoryData[];
    height?: number;
    showCenter?: boolean;
}

export function CategoryDonutChart({ data, height = 320, showCenter = true }: CategoryDonutChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        return data.map((item) => {
            const category = defaultCategories.find((c) => c.id === item.categoryId);
            return {
                name: category?.name || item.categoryId,
                value: item.amount,
                color: category?.color || '#6B7280',
                icon: category?.icon || '💰',
            };
        }).filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div>No expense data yet</div>
                </div>
            </div>
        );
    }

    // Custom shape renderer for active slice with outer expansion
    const renderShape = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
        const isActive = activeIndex === index;

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={isActive ? outerRadius + 8 : outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    style={{ filter: isActive ? 'brightness(1.1)' : 'none', transition: 'all 0.2s ease' }}
                />
                {isActive && (
                    <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={outerRadius + 12}
                        outerRadius={outerRadius + 16}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                    />
                )}
            </g>
        );
    };

    return (
        <div className="h-full flex flex-col lg:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative flex-shrink-0" style={{ width: height, height: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                            shape={renderShape}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="cursor-pointer"
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Display - Shows active or total */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        {activeIndex !== null && chartData[activeIndex] ? (
                            <>
                                <div className="text-2xl mb-1">{chartData[activeIndex].icon}</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                                    {chartData[activeIndex].name}
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    ₹{chartData[activeIndex].value.toLocaleString('en-IN')}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {((chartData[activeIndex].value / total) * 100).toFixed(1)}%
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ₹{(total / 1000).toFixed(1)}k
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 min-w-0 max-h-[280px] overflow-y-auto">
                <div className="space-y-2">
                    {chartData.map((item, idx) => {
                        const percent = ((item.value / total) * 100).toFixed(1);
                        const isActive = activeIndex === idx;
                        return (
                            <div
                                key={idx}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                                        : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0 transition-transform"
                                    style={{
                                        backgroundColor: item.color,
                                        transform: isActive ? 'scale(1.2)' : 'scale(1)'
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="font-medium text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-900 dark:text-white font-semibold">
                                            ₹{item.value.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({percent}%)
                                        </span>
                                    </div>
                                </div>
                                {/* Bar indicator */}
                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${percent}%`,
                                            backgroundColor: item.color
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default CategoryDonutChart;
