'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingUp, Droplet, Shield, AlertCircle } from 'lucide-react';

interface FinancialHealthScoreProps {
    totalAssets: number;
    totalLiabilities: number;
    liquidAssets: number;
    monthlyExpenses?: number;
    highInterestDebt: number;
}

export default function FinancialHealthScore({
    totalAssets,
    totalLiabilities,
    liquidAssets,
    monthlyExpenses = 50000,
    highInterestDebt,
}: FinancialHealthScoreProps) {
    const metrics = useMemo(() => {
        const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
        const liquidityMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
        const hasHighInterestDebt = highInterestDebt > 0;

        // Calculate health score (0-100)
        let score = 50;

        // Debt-to-Asset Ratio scoring (max 30 points)
        if (debtToAssetRatio < 20) score += 30;
        else if (debtToAssetRatio < 40) score += 20;
        else if (debtToAssetRatio < 60) score += 10;
        else if (debtToAssetRatio >= 80) score -= 10;

        // Liquidity scoring (max 20 points)
        if (liquidityMonths >= 6) score += 20;
        else if (liquidityMonths >= 3) score += 10;
        else if (liquidityMonths < 1) score -= 10;

        // High interest debt penalty
        if (hasHighInterestDebt) score -= 10;

        // Net worth positive bonus
        if (totalAssets > totalLiabilities) score += 10;

        // Clamp score
        score = Math.max(0, Math.min(100, score));

        let label = 'Poor';
        let color = '#EF4444';
        if (score >= 80) { label = 'Excellent'; color = '#10B981'; }
        else if (score >= 60) { label = 'Good'; color = '#22C55E'; }
        else if (score >= 40) { label = 'Fair'; color = '#F59E0B'; }
        else if (score >= 20) { label = 'Needs Work'; color = '#F97316'; }

        return {
            score,
            label,
            color,
            debtToAssetRatio,
            liquidityMonths,
            hasHighInterestDebt,
            indicators: [
                {
                    name: 'Debt-to-Asset Ratio',
                    value: `${debtToAssetRatio.toFixed(0)}%`,
                    status: debtToAssetRatio < 40 ? 'good' : debtToAssetRatio < 60 ? 'warning' : 'danger',
                    description: debtToAssetRatio < 40 ? 'Under 40% - Healthy' : 'Consider reducing debt',
                },
                {
                    name: 'Emergency Fund',
                    value: `${liquidityMonths.toFixed(1)} months`,
                    status: liquidityMonths >= 6 ? 'good' : liquidityMonths >= 3 ? 'warning' : 'danger',
                    description: liquidityMonths >= 6 ? 'Covers 6+ months' : 'Aim for 6 months',
                },
                {
                    name: 'High-Interest Debt',
                    value: hasHighInterestDebt ? `₹${highInterestDebt.toLocaleString('en-IN')}` : 'None',
                    status: hasHighInterestDebt ? 'danger' : 'good',
                    description: hasHighInterestDebt ? 'Pay off ASAP' : 'No high-interest debt',
                },
            ],
        };
    }, [totalAssets, totalLiabilities, liquidAssets, monthlyExpenses, highInterestDebt]);

    const circumference = 2 * Math.PI * 70;
    const strokeDashoffset = circumference - (metrics.score / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Financial Health Score</h3>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Gauge */}
                <div className="relative">
                    <svg width="160" height="160" className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-gray-100 dark:text-gray-800"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={metrics.color}
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                strokeDasharray: circumference,
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.p
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-bold"
                            style={{ color: metrics.color }}
                        >
                            {metrics.score}
                        </motion.p>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metrics.label}</p>
                    </div>
                </div>

                {/* Indicators */}
                <div className="flex-1 space-y-4">
                    {metrics.indicators.map((indicator, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${indicator.status === 'good'
                                    ? 'bg-green-100 dark:bg-green-900/20'
                                    : indicator.status === 'warning'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                                        : 'bg-red-100 dark:bg-red-900/20'
                                }`}>
                                {indicator.status === 'good' ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : indicator.status === 'warning' ? (
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {indicator.name}
                                    </p>
                                    <p className={`text-sm font-semibold ${indicator.status === 'good'
                                            ? 'text-green-600 dark:text-green-400'
                                            : indicator.status === 'warning'
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {indicator.value}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {indicator.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
