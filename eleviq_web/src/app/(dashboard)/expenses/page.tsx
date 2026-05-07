'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Filter,
    Trash2,
    Edit2,
    Calendar,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ChevronDown,
    Receipt,
    X,
    Flame,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { format, isToday, isYesterday, subMonths, startOfMonth } from 'date-fns';
import { useEnhancedExpenseStore } from '@/store/enhanced-expense-store';
import { useExpenseStore } from '@/store/expense-store';
import { defaultCategories, getCategoryById, EnhancedExpense, Expense } from '@/types/expense';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { CategoryDonutChart } from '@/components/expenses/charts/CategoryDonutChart';
import { SpendingTrendChart } from '@/components/expenses/charts/SpendingTrendChart';
import { SpendingHeatmap } from '@/components/expenses/charts/SpendingHeatmap';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ExpensesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { expenses: enhancedExpenses, fetchStats, monthlyTotal, categoryTotals } = useEnhancedExpenseStore();
    const { expenses: legacyExpenses, fetchExpenses, deleteExpense } = useExpenseStore();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Combine enhanced and legacy expenses for display
    const allExpenses = useMemo(() => {
        const enhanced = enhancedExpenses.map((e) => ({
            id: e.id,
            amount: e.amount,
            description: e.description,
            category: e.category,
            categoryId: e.categoryId,
            date: new Date(e.date),
            vendor: e.vendor,
            items: e.items,
            isEnhanced: true,
        }));
        const legacy = legacyExpenses.map((e) => ({
            id: e.id,
            amount: e.amount,
            description: e.description,
            category: e.category,
            categoryId: e.categoryId,
            date: new Date(e.date),
            vendor: '',
            items: [],
            isEnhanced: false,
        }));
        const merged = [...legacy, ...enhanced];
        const uniqueMap = new Map();
        merged.forEach(item => {
            uniqueMap.set(item.id, item);
        });
        
        return Array.from(uniqueMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [enhancedExpenses, legacyExpenses]);

    useEffect(() => {
        fetchExpenses();
        fetchStats();
    }, [fetchExpenses, fetchStats]);

    // Handle '?add=true' query parameter
    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setShowAddModal(true);
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete('add');
            
            // If there's no other query params, just route to /expenses, otherwise keep them
            const queryString = newSearchParams.toString();
            router.replace(queryString ? `/expenses?${queryString}` : '/expenses', { scroll: false });
        }
    }, [searchParams, router]);

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        return allExpenses.filter((expense) => {
            const matchesCategory = !selectedCategory || expense.categoryId === selectedCategory;
            const matchesSearch = !searchQuery ||
                expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [allExpenses, selectedCategory, searchQuery]);

    // Calculate stats
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = startOfMonth(now);

        const thisMonthTotal = allExpenses
            .filter((e) => e.date >= thisMonthStart)
            .reduce((sum, e) => sum + e.amount, 0);

        const lastMonthTotal = allExpenses
            .filter((e) => e.date >= lastMonthStart && e.date < lastMonthEnd)
            .reduce((sum, e) => sum + e.amount, 0);

        const change = lastMonthTotal ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        const topCategory = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)[0];

        return {
            thisMonth: thisMonthTotal,
            lastMonth: lastMonthTotal,
            change,
            topCategory: topCategory ? { id: topCategory[0], amount: topCategory[1] } : null,
            totalTransactions: allExpenses.length,
            todaySpent: allExpenses.filter((e) => isToday(e.date)).reduce((sum, e) => sum + e.amount, 0),
        };
    }, [allExpenses, categoryTotals]);

    // Data for charts
    const chartData = useMemo(() => {
        const categoryData = Object.entries(categoryTotals).map(([categoryId, amount]) => ({
            categoryId,
            amount,
        }));

        const trendData = allExpenses.map((e) => ({ date: e.date, amount: e.amount }));
        const heatmapData = allExpenses.map((e) => ({ date: e.date, amount: e.amount }));

        return { categoryData, trendData, heatmapData };
    }, [allExpenses, categoryTotals]);

    // Group expenses by date
    const groupedExpenses = useMemo(() => {
        const groups: Record<string, typeof filteredExpenses> = {};
        filteredExpenses.forEach((expense) => {
            const dateKey = format(expense.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(expense);
        });
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
    }, [filteredExpenses]);

    const handleDelete = async (id: string, isEnhanced: boolean) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            if (isEnhanced) {
                useEnhancedExpenseStore.getState().deleteExpense(id);
            } else {
                await deleteExpense(id);
            }
        }
    };

    const getDateLabel = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'EEEE, MMMM d');
    };

    const getDayTotal = (expenses: typeof filteredExpenses) => {
        return expenses.reduce((sum, e) => sum + e.amount, 0);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Receipt}
                iconColor="text-emerald-400"
                title="Expenses"
                subtitle={`${allExpenses.length} transactions`}
                actions={
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Expense</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* This Month */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>This Month</span>
                        </div>
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{stats.thisMonth.toLocaleString('en-IN')}
                        </div>
                        <div className={`flex items-center gap-1 text-xs mt-1 ${stats.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {stats.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{Math.abs(stats.change).toFixed(1)}% vs last month</span>
                        </div>
                    </div>

                    {/* Today's Spending */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                            <Wallet className="w-4 h-4" />
                            <span>Today</span>
                        </div>
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{stats.todaySpent.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {allExpenses.filter((e) => isToday(e.date)).length} transactions
                        </div>
                    </div>

                    {/* Top Category */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                            <Flame className="w-4 h-4" />
                            <span>Top Category</span>
                        </div>
                        {stats.topCategory ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getCategoryById(stats.topCategory.id)?.icon}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {getCategoryById(stats.topCategory.id)?.name}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ₹{stats.topCategory.amount.toLocaleString('en-IN')}
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400">No data</div>
                        )}
                    </div>

                    {/* Transactions */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                            <Receipt className="w-4 h-4" />
                            <span>Total Records</span>
                        </div>
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalTransactions}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            expenses tracked
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="space-y-4 mb-6">
                    {/* Trend Chart - Full Width on Top */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Trend (Last 30 Days)</h3>
                        <SpendingTrendChart expenses={chartData.trendData} days={30} height={280} />
                    </div>

                    {/* 2 Column Row: Heatmap Left, Donut Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Heatmap - Left Side */}
                        <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Calendar</h3>
                            <SpendingHeatmap data={chartData.heatmapData} />
                        </div>

                        {/* Category Donut - Right Side */}
                        <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-gray-100 dark:border-white/5 overflow-visible">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
                            <CategoryDonutChart data={chartData.categoryData} height={280} />
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-900 dark:text-white transition-colors w-full lg:w-auto justify-center"
                            >
                                <Filter className="w-4 h-4" />
                                <span>{selectedCategory ? getCategoryById(selectedCategory)?.name : 'All Categories'}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showFilters && (
                                <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-[#171717] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 p-2">
                                    <button
                                        onClick={() => { setSelectedCategory(null); setShowFilters(false); }}
                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${!selectedCategory ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                                    >
                                        All Categories
                                    </button>
                                    {defaultCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setSelectedCategory(cat.id); setShowFilters(false); }}
                                            className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Clear filters */}
                        {(selectedCategory || searchQuery) && (
                            <button
                                onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Expenses List */}
                {groupedExpenses.length === 0 ? (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No expenses found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {selectedCategory || searchQuery
                                ? 'Try adjusting your filters'
                                : 'Start tracking your spending'}
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Your First Expense
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedExpenses.map(([date, dayExpenses]) => (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {getDateLabel(date)}
                                    </h3>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        ₹{getDayTotal(dayExpenses).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Expenses */}
                                <div className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                                    {dayExpenses.map((expense) => {
                                        const category = getCategoryById(expense.categoryId);
                                        return (
                                            <div
                                                key={expense.id}
                                                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            >
                                                {/* Category Icon */}
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                                    style={{ backgroundColor: `${category?.color}15` }}
                                                >
                                                    {category?.icon || '💰'}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {expense.description || expense.category}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <span>{category?.name}</span>
                                                        {expense.vendor && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{expense.vendor}</span>
                                                            </>
                                                        )}
                                                        {expense.items && expense.items.length > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{expense.items.length} items</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        ₹{expense.amount.toLocaleString('en-IN')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {format(expense.date, 'h:mm a')}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(expense.id, expense.isEnhanced)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Expense Modal */}
                <AddExpenseModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchStats();
                    }}
                />
            </div>
        </div>
    );
}
