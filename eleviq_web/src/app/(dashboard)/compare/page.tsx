'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Calendar, ArrowLeftRight } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useExpenseStore } from '@/store/expense-store';
import { defaultCategories, getCategoryById } from '@/types/expense';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export default function ComparePage() {
    const { expenses, fetchExpenses } = useExpenseStore();
    const [month1, setMonth1] = useState(() => format(new Date(), 'yyyy-MM'));
    const [month2, setMonth2] = useState(() => format(subMonths(new Date(), 1), 'yyyy-MM'));

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const getMonthData = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(new Date(year, month - 1));
        const monthExpenses = expenses.filter((e) => e.date >= start && e.date <= end);
        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const byCategory: Record<string, number> = {};
        monthExpenses.forEach((e) => { byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + e.amount; });
        return { total, byCategory, count: monthExpenses.length };
    };

    const data1 = useMemo(() => getMonthData(month1), [expenses, month1]);
    const data2 = useMemo(() => getMonthData(month2), [expenses, month2]);

    const getChange = (v1: number, v2: number) => {
        if (v2 === 0) return v1 > 0 ? 100 : 0;
        return Math.round(((v1 - v2) / v2) * 100);
    };

    const totalChange = getChange(data1.total, data2.total);

    const allCategories = useMemo(() => {
        const cats = new Set([...Object.keys(data1.byCategory), ...Object.keys(data2.byCategory)]);
        return Array.from(cats);
    }, [data1, data2]);

    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        return format(new Date(year, month - 1), 'MMMM yyyy');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader icon={ArrowLeftRight} iconColor="text-sky-400" title="Compare" />
            <div className="p-4 lg:p-8">

                <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Compare</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="month" value={month1} onChange={(e) => setMonth1(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium" />
                            </div>
                        </div>
                        <div className="text-gray-400 font-medium">vs</div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Against</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="month" value={month2} onChange={(e) => setMonth2(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{formatMonthLabel(month1)}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{data1.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{data1.count} transactions</p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{formatMonthLabel(month2)}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{data2.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{data2.count} transactions</p>
                    </div>
                    <div className={`rounded-2xl p-6 ${totalChange > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : totalChange < 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700'}`}>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Change</p>
                        <div className="flex items-center gap-2">
                            {totalChange > 0 ? <ArrowUpRight className="w-6 h-6 text-red-500" /> : totalChange < 0 ? <ArrowDownRight className="w-6 h-6 text-green-500" /> : <Minus className="w-6 h-6 text-gray-400" />}
                            <span className={`text-3xl font-bold ${totalChange > 0 ? 'text-red-500' : totalChange < 0 ? 'text-green-500' : 'text-gray-500'}`}>{totalChange > 0 ? '+' : ''}{totalChange}%</span>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500">{totalChange > 0 ? 'Increase' : totalChange < 0 ? 'Decrease' : 'No change'}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <h3 className="font-semibold text-gray-900 dark:text-white">By Category</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {allCategories.map((catId) => {
                            const category = getCategoryById(catId);
                            const amount1 = data1.byCategory[catId] || 0;
                            const amount2 = data2.byCategory[catId] || 0;
                            const change = getChange(amount1, amount2);
                            const maxAmount = Math.max(amount1, amount2, 1);
                            return (
                                <div key={catId} className="p-4">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${category?.color || '#888'}15` }}>{category?.icon || '📦'}</div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white">{category?.name || catId}</h4>
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-medium ${change > 0 ? 'text-red-500' : change < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                            {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : change < 0 ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                            {change > 0 ? '+' : ''}{change}%
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 w-16">{format(new Date(month1 + '-01'), 'MMM')}</span>
                                            <div className="flex-1 h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${(amount1 / maxAmount) * 100}%`, backgroundColor: category?.color || '#3B82F6' }} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white w-24 text-right">₹{amount1.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 w-16">{format(new Date(month2 + '-01'), 'MMM')}</span>
                                            <div className="flex-1 h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full opacity-50" style={{ width: `${(amount2 / maxAmount) * 100}%`, backgroundColor: category?.color || '#3B82F6' }} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24 text-right">₹{amount2.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {allCategories.length === 0 && (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400">No expenses in selected months</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
