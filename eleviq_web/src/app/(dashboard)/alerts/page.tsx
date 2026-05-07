'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    AlertTriangle,
    X,
    Trash2,
    Target,
    ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useExpenseStore } from '@/store/expense-store';
import { useAuthStore } from '@/store/auth-store';
import { defaultCategories, getCategoryById } from '@/types/expense';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

interface Budget {
    id: string;
    categoryId: string;
    limit: number;
    alertThreshold: number;
    createdAt: Date;
}

export default function AlertsPage() {
    const { user } = useAuthStore();
    const { categoryTotals } = useExpenseStore();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBudget, setNewBudget] = useState({
        categoryId: '',
        limit: '',
        alertThreshold: 80,
    });

    useEffect(() => {
        const fetchBudgets = async () => {
            if (!user?.uid || !db) return;

            try {
                const q = query(
                    collection(db, 'budgets'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as Budget[];
                setBudgets(data);
            } catch (error) {
                console.error('Failed to fetch budgets:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBudgets();
    }, [user]);

    const handleAddBudget = async () => {
        if (!user?.uid || !db || !newBudget.categoryId || !newBudget.limit) return;

        try {
            const docRef = await addDoc(collection(db, 'budgets'), {
                userId: user.uid,
                categoryId: newBudget.categoryId,
                limit: parseFloat(newBudget.limit),
                alertThreshold: newBudget.alertThreshold,
                createdAt: new Date(),
            });

            setBudgets([...budgets, {
                id: docRef.id,
                categoryId: newBudget.categoryId,
                limit: parseFloat(newBudget.limit),
                alertThreshold: newBudget.alertThreshold,
                createdAt: new Date(),
            }]);

            setNewBudget({ categoryId: '', limit: '', alertThreshold: 80 });
            setShowAddModal(false);
        } catch (error) {
            console.error('Failed to add budget:', error);
        }
    };

    const handleDeleteBudget = async (id: string) => {
        if (!db || !confirm('Delete this budget?')) return;

        try {
            await deleteDoc(doc(db, 'budgets', id));
            setBudgets(budgets.filter((b) => b.id !== id));
        } catch (error) {
            console.error('Failed to delete budget:', error);
        }
    };

    const alerts = budgets.map((budget) => {
        const spent = categoryTotals[budget.categoryId] || 0;
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        const isOverBudget = percentage >= 100;
        const isNearLimit = percentage >= budget.alertThreshold && percentage < 100;
        const category = getCategoryById(budget.categoryId);

        return {
            ...budget,
            spent,
            percentage,
            isOverBudget,
            isNearLimit,
            category,
        };
    }).sort((a, b) => b.percentage - a.percentage);

    const activeAlerts = alerts.filter((a) => a.isOverBudget || a.isNearLimit);
    const usedCategoryIds = budgets.map((b) => b.categoryId);
    const availableCategories = defaultCategories.filter((c) => !usedCategoryIds.includes(c.id));

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={ShieldAlert}
                iconColor="text-orange-400"
                title="Budget & Alerts"
                subtitle="Set spending limits and get notified"
                actions={
                    <button
                        onClick={() => setShowAddModal(true)}
                        disabled={availableCategories.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Budget</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                {/* Active Alerts */}
                {activeAlerts.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {activeAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-center gap-4 p-4 rounded-xl ${alert.isOverBudget
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                                    }`}>
                                    <AlertTriangle className={`w-5 h-5 ${alert.isOverBudget ? 'text-red-600' : 'text-yellow-600'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium ${alert.isOverBudget ? 'text-red-900 dark:text-red-300' : 'text-yellow-900 dark:text-yellow-300'
                                        }`}>
                                        {alert.category?.icon} {alert.category?.name}: {alert.isOverBudget ? 'Over budget!' : 'Approaching limit'}
                                    </p>
                                    <p className={`text-sm ${alert.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                        ₹{alert.spent.toLocaleString()} of ₹{alert.limit.toLocaleString()} ({alert.percentage.toFixed(0)}%)
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Budget Cards */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-12 text-center">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No budgets yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Set spending limits for categories to track your budget
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Create your first budget
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.map((budget) => (
                            <div
                                key={budget.id}
                                className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={{ backgroundColor: `${budget.category?.color}15` }}
                                        >
                                            {budget.category?.icon || '📦'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{budget.category?.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Alert at {budget.alertThreshold}%</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBudget(budget.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ₹{budget.spent.toLocaleString()}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            of ₹{budget.limit.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${budget.isOverBudget
                                                ? 'bg-red-500'
                                                : budget.isNearLimit
                                                    ? 'bg-yellow-500'
                                                    : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className={`text-sm font-medium ${budget.isOverBudget
                                    ? 'text-red-600'
                                    : budget.isNearLimit
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}>
                                    {budget.isOverBudget
                                        ? `Over by ₹${(budget.spent - budget.limit).toLocaleString()}`
                                        : `₹${(budget.limit - budget.spent).toLocaleString()} remaining`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Budget Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Budget</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Category Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={newBudget.categoryId}
                                        onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a category</option>
                                        {availableCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Limit */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Monthly Limit
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={newBudget.limit}
                                            onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="5000"
                                        />
                                    </div>
                                </div>

                                {/* Alert Threshold */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Alert when spending reaches
                                    </label>
                                    <div className="flex gap-2">
                                        {[50, 70, 80, 90].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setNewBudget({ ...newBudget, alertThreshold: val })}
                                                className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${newBudget.alertThreshold === val
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {val}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleAddBudget}
                                    disabled={!newBudget.categoryId || !newBudget.limit}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Create Budget
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
