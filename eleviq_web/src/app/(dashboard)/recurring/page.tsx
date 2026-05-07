'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Repeat,
    Calendar,
    Trash2,
    Edit2,
    X,
    Check,
    RefreshCcw,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { defaultCategories, getCategoryById } from '@/types/expense';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { format, addMonths, addWeeks, addDays } from 'date-fns';

interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    categoryId: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDue: Date;
    isActive: boolean;
}

export default function RecurringPage() {
    const { user } = useAuthStore();
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newRecurring, setNewRecurring] = useState({
        description: '',
        amount: '',
        categoryId: '',
        frequency: 'monthly' as const,
        startDate: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        const fetchRecurring = async () => {
            if (!user?.uid || !db) return;

            try {
                const q = query(
                    collection(db, 'recurring'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    nextDue: doc.data().nextDue?.toDate() || new Date(),
                })) as RecurringExpense[];
                setRecurring(data);
            } catch (error) {
                console.error('Failed to fetch recurring:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecurring();
    }, [user]);

    const handleAdd = async () => {
        if (!user?.uid || !db || !newRecurring.description || !newRecurring.amount || !newRecurring.categoryId) return;

        try {
            const docRef = await addDoc(collection(db, 'recurring'), {
                userId: user.uid,
                description: newRecurring.description,
                amount: parseFloat(newRecurring.amount),
                categoryId: newRecurring.categoryId,
                frequency: newRecurring.frequency,
                nextDue: new Date(newRecurring.startDate),
                isActive: true,
                createdAt: new Date(),
            });

            setRecurring([...recurring, {
                id: docRef.id,
                description: newRecurring.description,
                amount: parseFloat(newRecurring.amount),
                categoryId: newRecurring.categoryId,
                frequency: newRecurring.frequency,
                nextDue: new Date(newRecurring.startDate),
                isActive: true,
            }]);

            setNewRecurring({
                description: '',
                amount: '',
                categoryId: '',
                frequency: 'monthly',
                startDate: format(new Date(), 'yyyy-MM-dd'),
            });
            setShowModal(false);
        } catch (error) {
            console.error('Failed to add recurring:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db || !confirm('Delete this recurring expense?')) return;

        try {
            await deleteDoc(doc(db, 'recurring', id));
            setRecurring(recurring.filter((r) => r.id !== id));
        } catch (error) {
            console.error('Failed to delete recurring:', error);
        }
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'Daily';
            case 'weekly': return 'Weekly';
            case 'monthly': return 'Monthly';
            case 'yearly': return 'Yearly';
            default: return freq;
        }
    };

    const getNextDueLabel = (date: Date) => {
        const now = new Date();
        const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Due today';
        if (diff === 1) return 'Due tomorrow';
        if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
        if (diff <= 7) return `Due in ${diff} days`;
        return format(date, 'MMM d, yyyy');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={RefreshCcw}
                iconColor="text-teal-400"
                title="Recurring Expenses"
                subtitle="Auto-add monthly bills and subscriptions"
                actions={
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Recurring</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                {/* List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : recurring.length === 0 ? (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-12 text-center">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Repeat className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No recurring expenses</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Add monthly bills like rent, subscriptions, and utilities
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add your first recurring expense
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recurring.map((item) => {
                            const category = getCategoryById(item.categoryId);
                            const isOverdue = item.nextDue < new Date();
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={{ backgroundColor: `${category?.color}15` }}
                                        >
                                            {category?.icon || '📦'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.description}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{getFrequencyLabel(item.frequency)}</span>
                                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                                <span className={`text-sm ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {getNextDueLabel(item.nextDue)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">₹{item.amount.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Recurring Expense</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={newRecurring.description}
                                        onChange={(e) => setNewRecurring({ ...newRecurring, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                        placeholder="Netflix, Rent, Phone bill..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={newRecurring.amount}
                                            onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                    <select
                                        value={newRecurring.categoryId}
                                        onChange={(e) => setNewRecurring({ ...newRecurring, categoryId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                    >
                                        <option value="">Select category</option>
                                        {defaultCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                                            <button
                                                key={freq}
                                                type="button"
                                                onClick={() => setNewRecurring({ ...newRecurring, frequency: freq as any })}
                                                className={`py-2 rounded-lg border-2 text-sm font-medium transition-all capitalize ${newRecurring.frequency === freq
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={newRecurring.startDate}
                                        onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                    />
                                </div>

                                <button
                                    onClick={handleAdd}
                                    disabled={!newRecurring.description || !newRecurring.amount || !newRecurring.categoryId}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Add Recurring Expense
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
