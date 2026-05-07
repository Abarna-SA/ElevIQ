'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface TrendDataPoint {
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
}

interface NetWorthTrendChartProps {
    data: TrendDataPoint[];
    timeRange: '3M' | '6M' | '1Y' | 'ALL';
    onTimeRangeChange: (range: '3M' | '6M' | '1Y' | 'ALL') => void;
}

export default function NetWorthTrendChart({
    data,
    timeRange,
    onTimeRangeChange
}: NetWorthTrendChartProps) {
    const stats = useMemo(() => {
        if (data.length < 2) return { change: 0, changePercent: 0, highest: 0, lowest: 0 };

        const first = data[0].netWorth;
        const last = data[data.length - 1].netWorth;
        const change = last - first;
        const changePercent = first > 0 ? ((last - first) / first) * 100 : 0;
        const highest = Math.max(...data.map(d => d.netWorth));
        const lowest = Math.min(...data.map(d => d.netWorth));

        return { change, changePercent, highest, lowest };
    }, [data]);

    const isPositive = stats.change >= 0;

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    // Generate sample data if empty
    const chartData = data.length > 0 ? data : generateSampleData();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Net Worth Over Time</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-sm font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                {isPositive ? '+' : ''}{stats.changePercent.toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-400">
                                ({isPositive ? '+' : ''}{formatValue(stats.change)})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {(['3M', '6M', '1Y', 'ALL'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => onTimeRangeChange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="px-4 py-6">
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                tickFormatter={formatValue}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                                labelStyle={{ color: '#9CA3AF', fontSize: 11 }}
                                formatter={(value) => [formatValue(value as number), 'Net Worth']}
                            />
                            <Area
                                type="monotone"
                                dataKey="netWorth"
                                stroke={isPositive ? "#10B981" : "#EF4444"}
                                strokeWidth={2}
                                fill="url(#netWorthGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-white/5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Highest</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatValue(stats.highest)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Lowest</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatValue(stats.lowest)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Growth</p>
                        <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{stats.changePercent.toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Period</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{timeRange === 'ALL' ? 'All Time' : timeRange}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Generate sample data for demo
function generateSampleData(): TrendDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data: TrendDataPoint[] = [];

    let netWorth = 500000;

    for (let i = 11; i >= 0; i--) {
        const monthIndex = (now.getMonth() - i + 12) % 12;
        netWorth += Math.random() * 50000 - 10000; // Random growth
        if (netWorth < 100000) netWorth = 100000;

        data.push({
            date: months[monthIndex],
            netWorth: Math.round(netWorth),
            assets: Math.round(netWorth * 1.4),
            liabilities: Math.round(netWorth * 0.4),
        });
    }

    return data;
}
