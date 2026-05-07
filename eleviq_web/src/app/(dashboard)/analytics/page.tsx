'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, TrendingDown, ArrowUpRight, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useExpenseStore } from '@/store/expense-store';
import { defaultCategories, getCategoryById } from '@/types/expense';

export default function AnalyticsPage() {
    const { expenses, monthlyTotal, categoryTotals, fetchExpenses, fetchStats } = useExpenseStore();

    useEffect(() => {
        fetchExpenses();
        fetchStats();
    }, [fetchExpenses, fetchStats]);

    // Calculate category data for chart
    const categoryData = useMemo(() => {
        return Object.entries(categoryTotals)
            .map(([categoryId, amount]) => {
                const category = getCategoryById(categoryId);
                return {
                    id: categoryId,
                    name: category?.name || 'Other',
                    icon: category?.icon || '📦',
                    color: category?.color || '#6B7280',
                    amount,
                    percentage: monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0,
                };
            })
            .sort((a, b) => b.amount - a.amount);
    }, [categoryTotals, monthlyTotal]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader icon={BarChart3} iconColor="text-violet-400" title="Analytics" />
            <div className="p-4 lg:p-8">

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                                <TrendingDown className="w-7 h-7 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Spending</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    ₹{monthlyTotal.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">{categoryData[0]?.icon || '📊'}</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {categoryData[0]?.name || 'No data'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-2xl">
                                📈
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{expenses.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Category Distribution</h2>

                        {categoryData.length > 0 ? (
                            <div className="flex flex-col items-center">
                                {/* SVG Donut Chart */}
                                <div className="relative w-64 h-64 mb-8">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        {categoryData.map((category, index) => {
                                            const radius = 40;
                                            const circumference = 2 * Math.PI * radius;
                                            const strokeDasharray = (category.percentage / 100) * circumference;
                                            const offset = categoryData
                                                .slice(0, index)
                                                .reduce((acc, c) => acc + (c.percentage / 100) * circumference, 0);

                                            return (
                                                <circle
                                                    key={category.id}
                                                    cx="50"
                                                    cy="50"
                                                    r={radius}
                                                    fill="none"
                                                    stroke={category.color}
                                                    strokeWidth="16"
                                                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                                                    strokeDashoffset={-offset}
                                                    className="transition-all duration-700"
                                                />
                                            );
                                        })}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ₹{monthlyTotal.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    {categoryData.slice(0, 6).map((category) => (
                                        <div key={category.id} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {category.icon} {category.name}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">
                                                {category.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📊</span>
                                </div>
                                <h3 className="text-gray-900 dark:text-white font-medium mb-2">No data yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                    Add expenses to see your spending breakdown
                                </p>
                                <Link
                                    href="/expenses/add"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Expense
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* All Categories */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Categories</h2>
                        </div>

                        <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-[500px] overflow-y-auto">
                            {defaultCategories.map((category) => {
                                const amount = categoryTotals[category.id] || 0;
                                const percentage = monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0;

                                return (
                                    <div key={category.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                                style={{ backgroundColor: `${category.color}15` }}
                                            >
                                                {category.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        ₹{amount.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.max(percentage, amount > 0 ? 2 : 0)}%`,
                                                            backgroundColor: category.color,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
