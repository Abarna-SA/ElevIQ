'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Trash2,
    X,
    AlertTriangle,
    Target,
    TrendingUp,
    ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { useExpenseStore } from '@/store/expense-store';
import { defaultCategories, getCategoryById } from '@/types/expense';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { startOfMonth, startOfWeek, startOfDay, endOfMonth, endOfWeek, endOfDay } from 'date-fns';

interface SpendingLimit {
    id: string;
    categoryId: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly';
    alertThreshold: number;
}

export default function LimitsPage() {
    const { user } = useAuthStore();
    const { expenses, fetchExpenses } = useExpenseStore();
    const [limits, setLimits] = useState<SpendingLimit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newLimit, setNewLimit] = useState({
        categoryId: 'total',
        amount: '',
        period: 'monthly' as const,
        alertThreshold: 80,
    });

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    useEffect(() => {
        const fetchLimits = async () => {
            if (!user?.uid || !db) return;

            try {
                const q = query(
                    collection(db, 'limits'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as SpendingLimit[];
                setLimits(data);
            } catch (error) {
                console.error('Failed to fetch limits:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLimits();
    }, [user]);

    // Calculate spending for a limit
    const getSpendingForLimit = (limit: SpendingLimit) => {
        const now = new Date();
        let start: Date, end: Date;

        if (limit.period === 'daily') {
            start = startOfDay(now);
            end = endOfDay(now);
        } else if (limit.period === 'weekly') {
            start = startOfWeek(now);
            end = endOfWeek(now);
        } else {
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        const filtered = expenses.filter((e) => {
            const inRange = e.date >= start && e.date <= end;
            const matchesCategory = limit.categoryId === 'total' || e.categoryId === limit.categoryId;
            return inRange && matchesCategory;
        });

        return filtered.reduce((sum, e) => sum + e.amount, 0);
    };

    const handleAdd = async () => {
        if (!user?.uid || !db || !newLimit.amount) return;

        try {
            const docRef = await addDoc(collection(db, 'limits'), {
                userId: user.uid,
                categoryId: newLimit.categoryId,
                amount: parseFloat(newLimit.amount),
                period: newLimit.period,
                alertThreshold: newLimit.alertThreshold,
                createdAt: new Date(),
            });

            setLimits([...limits, {
                id: docRef.id,
                categoryId: newLimit.categoryId,
                amount: parseFloat(newLimit.amount),
                period: newLimit.period,
                alertThreshold: newLimit.alertThreshold,
            }]);

            setNewLimit({
                categoryId: 'total',
                amount: '',
                period: 'monthly',
                alertThreshold: 80,
            });
            setShowModal(false);
        } catch (error) {
            console.error('Failed to add limit:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db || !confirm('Delete this limit?')) return;

        try {
            await deleteDoc(doc(db, 'limits', id));
            setLimits(limits.filter((l) => l.id !== id));
        } catch (error) {
            console.error('Failed to delete limit:', error);
        }
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'daily': return 'Today';
            case 'weekly': return 'This Week';
            case 'monthly': return 'This Month';
            default: return period;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={ShieldAlert}
                iconColor="text-red-400"
                title="Spending Limits"
                subtitle="Set budgets and track your spending"
                actions={
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Limit</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                {/* Limits Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : limits.length === 0 ? (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-12 text-center">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No limits set
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create spending limits to stay on budget
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Create your first limit
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {limits.map((limit) => {
                            const spent = getSpendingForLimit(limit);
                            const percentage = Math.min((spent / limit.amount) * 100, 100);
                            const isWarning = percentage >= limit.alertThreshold;
                            const isExceeded = percentage >= 100;
                            const category = limit.categoryId === 'total' ? null : getCategoryById(limit.categoryId);

                            return (
                                <div
                                    key={limit.id}
                                    className={`bg-white dark:bg-[#171717] rounded-2xl shadow-sm border p-6 ${isExceeded
                                        ? 'border-red-300 dark:border-red-800'
                                        : isWarning
                                            ? 'border-yellow-300 dark:border-yellow-800'
                                            : 'border-gray-100 dark:border-white/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                                style={{
                                                    backgroundColor: category ? `${category.color}15` : '#3B82F615',
                                                }}
                                            >
                                                {category ? category.icon : '💰'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {category ? category.name : 'Total Budget'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {getPeriodLabel(limit.period)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(limit.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500 dark:text-gray-400">Spent</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {Math.round(percentage)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${isExceeded
                                                    ? 'bg-red-500'
                                                    : isWarning
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className={`text-2xl font-bold ${isExceeded ? 'text-red-500' : isWarning ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                                                }`}>
                                                ₹{spent.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                of ₹{limit.amount.toLocaleString()}
                                            </p>
                                        </div>
                                        {isExceeded && (
                                            <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                                                <AlertTriangle className="w-4 h-4" />
                                                Exceeded
                                            </div>
                                        )}
                                        {isWarning && !isExceeded && (
                                            <div className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                                                <AlertTriangle className="w-4 h-4" />
                                                Near limit
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Set Spending Limit
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={newLimit.categoryId}
                                        onChange={(e) => setNewLimit({ ...newLimit, categoryId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                    >
                                        <option value="total">💰 Total Budget</option>
                                        {defaultCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Limit Amount
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={newLimit.amount}
                                            onChange={(e) => setNewLimit({ ...newLimit, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                            placeholder="10000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Period
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['daily', 'weekly', 'monthly'].map((period) => (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() => setNewLimit({ ...newLimit, period: period as any })}
                                                className={`py-2.5 rounded-xl font-medium transition-all capitalize ${newLimit.period === period
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Alert Threshold: {newLimit.alertThreshold}%
                                    </label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="95"
                                        step="5"
                                        value={newLimit.alertThreshold}
                                        onChange={(e) => setNewLimit({ ...newLimit, alertThreshold: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Get warned when spending reaches this percentage
                                    </p>
                                </div>

                                <button
                                    onClick={handleAdd}
                                    disabled={!newLimit.amount}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Create Limit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
