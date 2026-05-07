'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, Plus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface NetWorthWidgetProps {
    assets: { type: string; name: string; amount: number }[];
    liabilities: { type: string; name: string; amount: number }[];
}

// Mock sparkline data - in production this would come from historical data
const sparklineData = [
    { value: 980000 }, { value: 995000 }, { value: 1010000 }, { value: 1005000 },
    { value: 1025000 }, { value: 1040000 }, { value: 1055000 }, { value: 1005000 },
];

export default function NetWorthWidget({ assets, liabilities }: NetWorthWidgetProps) {
    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
    const netWorth = totalAssets - totalLiabilities;
    const assetPercentage = (totalAssets / (totalAssets + totalLiabilities || 1)) * 100;

    // Empty state
    if (assets.length === 0 && liabilities.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Net Worth</h3>
                </div>

                {/* Empty State Content */}
                <div className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                        <Wallet className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        Track your wealth
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-[200px]">
                        Add your assets & liabilities to see your net worth
                    </p>
                    <Link
                        href="/networth"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Get Started
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm"
        >
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Net Worth</h3>
                <Link
                    href="/networth"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    Details
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-6 pt-5">

                {/* Main Value */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <p className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                            ₹{netWorth.toLocaleString('en-IN')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                {netWorth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                +2.3%
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-sm">this month</span>
                        </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="w-24 h-14">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparklineData}>
                                <defs>
                                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#10B981"
                                    strokeWidth={1.5}
                                    fill="url(#netWorthGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Assets & Liabilities Breakdown */}
                <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                        <motion.div
                            className="h-full bg-gray-900 dark:bg-white"
                            initial={{ width: 0 }}
                            animate={{ width: `${assetPercentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-900 dark:bg-white rounded-full" />
                                <span className="text-gray-600 dark:text-gray-400">Assets</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{totalAssets.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            <span className="text-gray-600 dark:text-gray-400">Liabilities</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{totalLiabilities.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Asset Categories */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                        {assets.slice(0, 4).map((asset) => (
                            <div key={asset.name} className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{asset.type}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    ₹{(asset.amount / 1000).toFixed(0)}K
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
