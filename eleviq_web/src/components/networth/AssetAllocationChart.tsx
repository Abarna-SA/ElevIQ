'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ASSET_CATEGORIES, type AssetCategory } from '@/types/networth';

interface AssetData {
    category: AssetCategory;
    value: number;
}

interface AssetAllocationChartProps {
    assets: { category: string; value: number }[];
    totalAssets: number;
}

export default function AssetAllocationChart({ assets, totalAssets }: AssetAllocationChartProps) {
    const chartData = useMemo(() => {
        const categoryTotals: Record<string, number> = {};

        assets.forEach(asset => {
            categoryTotals[asset.category] = (categoryTotals[asset.category] || 0) + asset.value;
        });

        return Object.entries(categoryTotals)
            .map(([category, value]) => {
                const catInfo = ASSET_CATEGORIES.find(c => c.id === category);
                return {
                    name: catInfo?.name || category,
                    value,
                    color: catInfo?.color || '#64748B',
                    percentage: totalAssets > 0 ? (value / totalAssets) * 100 : 0,
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [assets, totalAssets]);

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    if (chartData.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 shadow-sm"
            >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Asset Allocation</h3>
                <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-gray-500">
                    Add assets to see allocation
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 shadow-sm"
        >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Asset Allocation</h3>

            <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-[200px] h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value) => formatValue(value as number)}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatValue(totalAssets)}
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                    {chartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatValue(item.value)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.percentage.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
