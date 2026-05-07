'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';

interface InsightsPanelProps {
    totalAssets: number;
    totalLiabilities: number;
    liquidAssets: number;
    monthlyIncome?: number;
    assetsByCategory: { category: string; value: number }[];
    liabilitiesByCategory: { category: string; value: number; interestRate?: number }[];
}

interface Insight {
    id: string;
    type: 'suggestion' | 'warning' | 'achievement';
    title: string;
    description: string;
    action?: string;
    priority: number;
}

export default function InsightsPanel({
    totalAssets,
    totalLiabilities,
    liquidAssets,
    monthlyIncome = 100000,
    assetsByCategory,
    liabilitiesByCategory,
}: InsightsPanelProps) {
    const insights = useMemo<Insight[]>(() => {
        const result: Insight[] = [];
        const netWorth = totalAssets - totalLiabilities;
        const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
        const emergencyMonths = monthlyIncome > 0 ? liquidAssets / monthlyIncome : 0;

        // Positive achievements
        if (netWorth > 1000000) {
            result.push({
                id: 'millionaire',
                type: 'achievement',
                title: '🎉 Millionaire Status!',
                description: `Your net worth has crossed ₹10L. You're in the top 5% of Indian households.`,
                priority: 1,
            });
        }

        if (debtRatio < 20 && totalLiabilities > 0) {
            result.push({
                id: 'low-debt',
                type: 'achievement',
                title: 'Low Debt Champion',
                description: `Your debt-to-asset ratio is just ${debtRatio.toFixed(0)}%. Keep it up!`,
                priority: 2,
            });
        }

        // Warnings
        if (debtRatio > 60) {
            result.push({
                id: 'high-debt',
                type: 'warning',
                title: 'High Debt Alert',
                description: `Your debt-to-asset ratio is ${debtRatio.toFixed(0)}%. Consider reducing liabilities.`,
                action: 'Create a debt payoff plan',
                priority: 0,
            });
        }

        if (emergencyMonths < 3) {
            result.push({
                id: 'low-emergency',
                type: 'warning',
                title: 'Build Emergency Fund',
                description: `You have ${emergencyMonths.toFixed(1)} months of expenses in liquid assets. Aim for 6+ months.`,
                action: 'Automate monthly savings',
                priority: 1,
            });
        }

        // Check for high-interest debt
        const highInterestDebt = liabilitiesByCategory.filter(l => (l.interestRate || 0) > 12);
        if (highInterestDebt.length > 0) {
            result.push({
                id: 'high-interest',
                type: 'warning',
                title: 'High-Interest Debt Detected',
                description: `You have loans with interest rates above 12%. Prioritize paying these off.`,
                action: 'Use snowball or avalanche method',
                priority: 0,
            });
        }

        // Suggestions
        const investmentAssets = assetsByCategory.find(a => a.category === 'investments');
        const investmentPercent = totalAssets > 0 && investmentAssets
            ? (investmentAssets.value / totalAssets) * 100
            : 0;

        if (investmentPercent < 30 && totalAssets > 100000) {
            result.push({
                id: 'invest-more',
                type: 'suggestion',
                title: 'Increase Investments',
                description: `Only ${investmentPercent.toFixed(0)}% of your assets are invested. Consider SIPs or index funds.`,
                action: 'Explore investment options',
                priority: 2,
            });
        }

        // Check for cash concentration
        const cashAssets = assetsByCategory.find(a => a.category === 'cash');
        const cashPercent = totalAssets > 0 && cashAssets
            ? (cashAssets.value / totalAssets) * 100
            : 0;

        if (cashPercent > 50 && totalAssets > 500000) {
            result.push({
                id: 'too-much-cash',
                type: 'suggestion',
                title: 'Optimize Cash Holdings',
                description: `${cashPercent.toFixed(0)}% in cash is losing to inflation. Consider diversifying.`,
                action: 'Move to high-yield FDs or debt funds',
                priority: 2,
            });
        }

        // Gold recommendation
        const goldAssets = assetsByCategory.find(a => a.category === 'gold');
        const goldPercent = totalAssets > 0 && goldAssets
            ? (goldAssets.value / totalAssets) * 100
            : 0;

        if (goldPercent === 0 && totalAssets > 500000) {
            result.push({
                id: 'add-gold',
                type: 'suggestion',
                title: 'Consider Gold Allocation',
                description: `Adding 5-10% gold (SGBs, Gold ETFs) can reduce portfolio volatility.`,
                action: 'Explore Sovereign Gold Bonds',
                priority: 3,
            });
        }

        return result.sort((a, b) => a.priority - b.priority);
    }, [totalAssets, totalLiabilities, liquidAssets, monthlyIncome, assetsByCategory, liabilitiesByCategory]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'achievement': return Sparkles;
            case 'warning': return AlertTriangle;
            default: return Lightbulb;
        }
    };

    const getStyles = (type: string) => {
        switch (type) {
            case 'achievement':
                return {
                    bg: 'bg-purple-50 dark:bg-purple-900/20',
                    border: 'border-purple-200 dark:border-purple-800',
                    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    actionBg: 'bg-purple-600 hover:bg-purple-700',
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
                    iconColor: 'text-amber-600 dark:text-amber-400',
                    actionBg: 'bg-amber-600 hover:bg-amber-700',
                };
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    actionBg: 'bg-blue-600 hover:bg-blue-700',
                };
        }
    };

    if (insights.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Smart Insights</h3>
                </div>
                <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Add more assets and liabilities to get personalized insights.
                    </p>
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
            <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Smart Insights</h3>
                <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
                </span>
            </div>

            <div className="space-y-4">
                {insights.slice(0, 4).map((insight, index) => {
                    const Icon = getIcon(insight.type);
                    const styles = getStyles(insight.type);

                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl border ${styles.bg} ${styles.border}`}
                        >
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
                                    <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {insight.title}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {insight.description}
                                    </p>
                                    {insight.action && (
                                        <button className={`mt-3 text-xs font-medium text-white px-3 py-1.5 rounded-lg flex items-center gap-1 ${styles.actionBg} transition-colors`}>
                                            {insight.action}
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
