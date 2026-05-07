'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Calendar,
    Wallet,
    Sparkles,
    RefreshCw,
    Lightbulb,
    Target,
    ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useExpenseStore } from '@/store/expense-store';
import { startOfMonth, endOfMonth, subMonths, getDay, getDaysInMonth, format, differenceInDays } from 'date-fns';

interface Insight {
    type: 'spending_change' | 'pattern' | 'warning' | 'positive';
    title: string;
    description: string;
    icon: string;
    color: string;
}

interface Recommendation {
    title: string;
    description: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
}

interface Forecast {
    projectedMonthEnd: number;
    trend: 'up' | 'down' | 'stable';
    comparedToLastMonth: number;
}

interface InsightsData {
    insights: Insight[];
    recommendations: Recommendation[];
    forecast: Forecast;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'alert': AlertCircle,
    'check': CheckCircle,
    'calendar': Calendar,
    'wallet': Wallet,
};

const colorMap: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

export default function InsightsPage() {
    const { expenses, fetchExpenses } = useExpenseStore();
    const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    // Calculate spending summary
    const summary = useMemo(() => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const previousMonthStart = startOfMonth(subMonths(now, 1));
        const previousMonthEnd = endOfMonth(subMonths(now, 1));

        const currentMonthExpenses = expenses.filter(
            (e) => e.date >= currentMonthStart && e.date <= currentMonthEnd
        );
        const previousMonthExpenses = expenses.filter(
            (e) => e.date >= previousMonthStart && e.date <= previousMonthEnd
        );

        // By category
        const currentByCategory: Record<string, number> = {};
        const previousByCategory: Record<string, number> = {};

        currentMonthExpenses.forEach((e) => {
            currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount;
        });
        previousMonthExpenses.forEach((e) => {
            previousByCategory[e.category] = (previousByCategory[e.category] || 0) + e.amount;
        });

        // By day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentByDayOfWeek: Record<string, number> = {};
        currentMonthExpenses.forEach((e) => {
            const dayName = dayNames[getDay(e.date)];
            currentByDayOfWeek[dayName] = (currentByDayOfWeek[dayName] || 0) + e.amount;
        });

        const daysElapsed = differenceInDays(now, currentMonthStart) + 1;
        const daysInMonth = getDaysInMonth(now);

        return {
            currentMonth: {
                total: currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
                byCategory: currentByCategory,
                byDayOfWeek: currentByDayOfWeek,
                count: currentMonthExpenses.length,
            },
            previousMonth: {
                total: previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
                byCategory: previousByCategory,
                count: previousMonthExpenses.length,
            },
            daysElapsed,
            daysInMonth,
        };
    }, [expenses]);

    const fetchInsights = async () => {
        if (summary.currentMonth.count === 0) {
            setError('Add some expenses first to generate insights');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate insights');
            }

            setInsightsData(result.data);
        } catch (err: any) {
            setError(err.message || 'Failed to generate insights');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate local forecast
    const localForecast = useMemo(() => {
        if (summary.daysElapsed === 0) return 0;
        return Math.round((summary.currentMonth.total / summary.daysElapsed) * summary.daysInMonth);
    }, [summary]);

    const percentChange = useMemo(() => {
        if (summary.previousMonth.total === 0) return 0;
        return Math.round(
            ((localForecast - summary.previousMonth.total) / summary.previousMonth.total) * 100
        );
    }, [localForecast, summary.previousMonth.total]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Lightbulb}
                iconColor="text-yellow-400"
                title="Smart Insights"
                subtitle="AI-powered spending analysis & recommendations"
                actions={
                    <button
                        onClick={fetchInsights}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {isLoading ? 'Analyzing...' : 'Generate Insights'}
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{summary.currentMonth.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{summary.currentMonth.count} transactions</p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Month</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{summary.previousMonth.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{summary.previousMonth.count} transactions</p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Projected</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{localForecast.toLocaleString()}
                        </p>
                        <p className={`text-xs ${percentChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {percentChange >= 0 ? '+' : ''}{percentChange}% vs last month
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Daily Average</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{summary.daysElapsed > 0
                                ? Math.round(summary.currentMonth.total / summary.daysElapsed).toLocaleString()
                                : 0}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Day {summary.daysElapsed} of {summary.daysInMonth}
                        </p>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                            Analyzing your spending patterns...
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This may take a few seconds</p>
                    </div>
                )}

                {/* Insights Content */}
                {insightsData && !isLoading && (
                    <div className="space-y-6">
                        {/* Insights Grid */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                Key Insights
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {insightsData.insights.map((insight, i) => {
                                    const IconComponent = iconMap[insight.icon] || Wallet;
                                    return (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-[#171717] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[insight.color]}`}
                                                >
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {insight.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {insight.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-500" />
                                Savings Recommendations
                            </h2>
                            <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                                {insightsData.recommendations.map((rec, i) => (
                                    <div key={i} className="p-5 flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${rec.priority === 'high'
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                : rec.priority === 'medium'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{rec.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{rec.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">
                                                ₹{rec.potentialSavings.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">potential savings/mo</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Forecast Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Month-End Forecast
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">
                                        ₹{insightsData.forecast.projectedMonthEnd.toLocaleString()}
                                    </p>
                                    <p className="text-sm opacity-80 mt-1">
                                        {insightsData.forecast.trend === 'up' ? '📈' : insightsData.forecast.trend === 'down' ? '📉' : '➡️'}
                                        {' '}
                                        {insightsData.forecast.comparedToLastMonth >= 0 ? '+' : ''}
                                        {insightsData.forecast.comparedToLastMonth}% compared to last month
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm opacity-80">Days remaining</p>
                                    <p className="text-2xl font-bold">{summary.daysInMonth - summary.daysElapsed}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!insightsData && !isLoading && !error && (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Unlock AI Insights
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Click "Generate Insights" to analyze your spending patterns and get personalized recommendations
                        </p>
                        <button
                            onClick={fetchInsights}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium"
                        >
                            <Sparkles className="w-5 h-5" />
                            Generate Insights
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
