'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Users,
    Trash2,
    X,
    Check,
    Copy,
    Share2,
    DollarSign,
    Split,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { useExpenseStore } from '@/store/expense-store';
import { getCategoryById } from '@/types/expense';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';

interface Participant {
    name: string;
    email: string;
    amount: number;
    isPaid: boolean;
}

interface SplitExpense {
    id: string;
    expenseId: string;
    description: string;
    totalAmount: number;
    participants: Participant[];
    createdAt: Date;
}

export default function SplitPage() {
    const { user } = useAuthStore();
    const { expenses, fetchExpenses } = useExpenseStore();
    const [splits, setSplits] = useState<SplitExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([
        { name: '', email: '', amount: 0, isPaid: false },
    ]);
    const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    useEffect(() => {
        const fetchSplits = async () => {
            if (!user?.uid || !db) return;

            try {
                const q = query(
                    collection(db, 'splits'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as SplitExpense[];
                setSplits(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
            } catch (error) {
                console.error('Failed to fetch splits:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSplits();
    }, [user]);

    const selectedExpense = expenses.find((e) => e.id === selectedExpenseId);

    const addParticipant = () => {
        setParticipants([...participants, { name: '', email: '', amount: 0, isPaid: false }]);
    };

    const updateParticipant = (index: number, field: keyof Participant, value: any) => {
        const updated = [...participants];
        updated[index] = { ...updated[index], [field]: value };
        setParticipants(updated);
    };

    const removeParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const calculateEqualSplit = () => {
        if (!selectedExpense) return;
        const count = participants.length + 1; // +1 for the user
        const amount = Math.round((selectedExpense.amount / count) * 100) / 100;
        setParticipants(participants.map((p) => ({ ...p, amount })));
    };

    useEffect(() => {
        if (splitType === 'equal' && selectedExpense) {
            calculateEqualSplit();
        }
    }, [splitType, selectedExpenseId, participants.length]);

    const handleCreate = async () => {
        if (!user?.uid || !db || !selectedExpense) return;

        const validParticipants = participants.filter((p) => p.name && p.amount > 0);
        if (validParticipants.length === 0) return;

        try {
            const docRef = await addDoc(collection(db, 'splits'), {
                userId: user.uid,
                expenseId: selectedExpenseId,
                description: selectedExpense.description,
                totalAmount: selectedExpense.amount,
                participants: validParticipants,
                createdAt: new Date(),
            });

            setSplits([{
                id: docRef.id,
                expenseId: selectedExpenseId,
                description: selectedExpense.description,
                totalAmount: selectedExpense.amount,
                participants: validParticipants,
                createdAt: new Date(),
            }, ...splits]);

            setShowModal(false);
            setSelectedExpenseId('');
            setParticipants([{ name: '', email: '', amount: 0, isPaid: false }]);
        } catch (error) {
            console.error('Failed to create split:', error);
        }
    };

    const handleTogglePaid = async (splitId: string, participantIndex: number) => {
        if (!db) return;

        const split = splits.find((s) => s.id === splitId);
        if (!split) return;

        const updatedParticipants = [...split.participants];
        updatedParticipants[participantIndex].isPaid = !updatedParticipants[participantIndex].isPaid;

        try {
            await updateDoc(doc(db, 'splits', splitId), {
                participants: updatedParticipants,
            });

            setSplits(splits.map((s) =>
                s.id === splitId ? { ...s, participants: updatedParticipants } : s
            ));
        } catch (error) {
            console.error('Failed to update split:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db || !confirm('Delete this split?')) return;

        try {
            await deleteDoc(doc(db, 'splits', id));
            setSplits(splits.filter((s) => s.id !== id));
        } catch (error) {
            console.error('Failed to delete split:', error);
        }
    };

    const copyShareText = (split: SplitExpense) => {
        const text = `💰 Split: ${split.description}
Total: ₹${split.totalAmount}

${split.participants.map((p) => `• ${p.name}: ₹${p.amount} ${p.isPaid ? '✅' : '⏳'}`).join('\n')}

Shared via ElevIQ`;

        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const getTotalOwed = () => {
        return splits.reduce((sum, split) => {
            const unpaid = split.participants.filter((p) => !p.isPaid).reduce((s, p) => s + p.amount, 0);
            return sum + unpaid;
        }, 0);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Split}
                iconColor="text-purple-400"
                title="Split Expenses"
                subtitle="Divide bills with friends & roommates"
                actions={
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Split Bill</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                {/* Summary */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-8 text-white">
                    <p className="text-sm opacity-80 mb-1">Total Owed to You</p>
                    <p className="text-3xl font-bold">₹{getTotalOwed().toLocaleString()}</p>
                    <p className="text-sm opacity-80 mt-2">
                        From {splits.reduce((sum, s) => sum + s.participants.filter(p => !p.isPaid).length, 0)} unpaid shares
                    </p>
                </div>

                {/* Splits List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : splits.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
                        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No splits yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Split a bill to track who owes what
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Split your first bill
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {splits.map((split) => {
                            const paidCount = split.participants.filter((p) => p.isPaid).length;
                            const totalParticipants = split.participants.length;

                            return (
                                <div
                                    key={split.id}
                                    className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
                                >
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {split.description}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {format(split.createdAt, 'MMM d, yyyy')} • ₹{split.totalAmount}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => copyShareText(split)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                                >
                                                    <Share2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(split.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="flex -space-x-2">
                                                    {split.participants.slice(0, 3).map((p, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900"
                                                        >
                                                            {p.name[0]?.toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {split.participants.length > 3 && (
                                                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border-2 border-white dark:border-gray-900">
                                                            +{split.participants.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {paidCount}/{totalParticipants} paid
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Participants */}
                                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {split.participants.map((p, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4">
                                                <button
                                                    onClick={() => handleTogglePaid(split.id, i)}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${p.isPaid
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                                                        }`}
                                                >
                                                    {p.isPaid && <Check className="w-4 h-4" />}
                                                </button>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${p.isPaid ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                        {p.name}
                                                    </p>
                                                    {p.email && (
                                                        <p className="text-sm text-gray-400">{p.email}</p>
                                                    )}
                                                </div>
                                                <p className={`text-lg font-semibold ${p.isPaid ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                    ₹{p.amount}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-lg my-8">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Split a Bill
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Select Expense */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Expense
                                    </label>
                                    <select
                                        value={selectedExpenseId}
                                        onChange={(e) => setSelectedExpenseId(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                    >
                                        <option value="">Choose an expense...</option>
                                        {expenses.slice(0, 20).map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.description} - ₹{e.amount} ({format(e.date, 'MMM d')})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedExpense && (
                                    <>
                                        {/* Split Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Split Type
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSplitType('equal')}
                                                    className={`py-2.5 rounded-xl font-medium transition-all ${splitType === 'equal'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    Equal Split
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick











                                                    ={() => setSplitType('custom')}
                                                    className={`py-2.5 rounded-xl font-medium transition-all ${splitType === 'custom'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    Custom Amounts
                                                </button>
                                            </div>
                                        </div>

                                        {/* Participants */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Participants
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={addParticipant}
                                                    className="text-sm text-blue-600 font-medium"
                                                >
                                                    + Add Person
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {participants.map((p, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Name"
                                                            value={p.name}
                                                            onChange={(e) => updateParticipant(i, 'name', e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
                                                        />
                                                        {splitType === 'custom' && (
                                                            <div className="relative w-24">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={p.amount || ''}
                                                                    onChange={(e) => updateParticipant(i, 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-full pl-6 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
                                                                />
                                                            </div>
                                                        )}
                                                        {splitType === 'equal' && (
                                                            <span className="w-20 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                                                                ₹{p.amount}
                                                            </span>
                                                        )}
                                                        {participants.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeParticipant(i)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Your share: ₹{selectedExpense.amount - participants.reduce((s, p) => s + p.amount, 0)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleCreate}
                                            disabled={!participants.some((p) => p.name && p.amount > 0)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                                        >
                                            Create Split
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
