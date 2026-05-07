'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Bell,
    Calendar,
    Trash2,
    X,
    Check,
    Clock,
    AlertCircle,
    BellRing,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { defaultCategories, getCategoryById } from '@/types/expense';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { format, isBefore, isToday, isTomorrow, addDays, differenceInDays } from 'date-fns';

interface BillReminder {
    id: string;
    name: string;
    amount: number;
    categoryId: string;
    dueDate: Date;
    isPaid: boolean;
    notes?: string;
}

export default function RemindersPage() {
    const { user } = useAuthStore();
    const [reminders, setReminders] = useState<BillReminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'paid'>('all');
    const [newReminder, setNewReminder] = useState({
        name: '',
        amount: '',
        categoryId: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
    });

    useEffect(() => {
        const fetchReminders = async () => {
            if (!user?.uid || !db) return;
            try {
                const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    dueDate: doc.data().dueDate?.toDate() || new Date(),
                })) as BillReminder[];
                data.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
                setReminders(data);
            } catch (error) {
                console.error('Failed to fetch reminders:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReminders();
    }, [user]);

    const handleAdd = async () => {
        if (!user?.uid || !db || !newReminder.name || !newReminder.amount || !newReminder.categoryId) return;
        try {
            const docRef = await addDoc(collection(db, 'reminders'), {
                userId: user.uid,
                name: newReminder.name,
                amount: parseFloat(newReminder.amount),
                categoryId: newReminder.categoryId,
                dueDate: new Date(newReminder.dueDate),
                isPaid: false,
                notes: newReminder.notes,
                createdAt: new Date(),
            });
            const newItem: BillReminder = {
                id: docRef.id,
                name: newReminder.name,
                amount: parseFloat(newReminder.amount),
                categoryId: newReminder.categoryId,
                dueDate: new Date(newReminder.dueDate),
                isPaid: false,
                notes: newReminder.notes,
            };
            setReminders([...reminders, newItem].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
            setNewReminder({ name: '', amount: '', categoryId: '', dueDate: format(new Date(), 'yyyy-MM-dd'), notes: '' });
            setShowModal(false);
        } catch (error) {
            console.error('Failed to add reminder:', error);
        }
    };

    const handleTogglePaid = async (id: string, currentStatus: boolean) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'reminders', id), { isPaid: !currentStatus });
            setReminders(reminders.map((r) => r.id === id ? { ...r, isPaid: !currentStatus } : r));
        } catch (error) {
            console.error('Failed to update reminder:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db || !confirm('Delete this reminder?')) return;
        try {
            await deleteDoc(doc(db, 'reminders', id));
            setReminders(reminders.filter((r) => r.id !== id));
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    const getFilteredReminders = () => {
        const now = new Date();
        switch (filter) {
            case 'upcoming': return reminders.filter((r) => !r.isPaid && !isBefore(r.dueDate, now));
            case 'overdue': return reminders.filter((r) => !r.isPaid && isBefore(r.dueDate, now) && !isToday(r.dueDate));
            case 'paid': return reminders.filter((r) => r.isPaid);
            default: return reminders;
        }
    };

    const getDueStatus = (dueDate: Date, isPaid: boolean) => {
        if (isPaid) return { label: 'Paid', color: 'text-green-600 bg-green-50 dark:bg-green-900/30' };
        if (isToday(dueDate)) return { label: 'Due today', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' };
        if (isTomorrow(dueDate)) return { label: 'Due tomorrow', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' };
        if (isBefore(dueDate, new Date())) return { label: 'Overdue', color: 'text-red-600 bg-red-50 dark:bg-red-900/30' };
        const days = differenceInDays(dueDate, new Date());
        if (days <= 7) return { label: `${days} days left`, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' };
        return { label: format(dueDate, 'MMM d'), color: 'text-gray-600 bg-gray-100 dark:bg-white/5' };
    };

    const filteredReminders = getFilteredReminders();
    const upcomingCount = reminders.filter((r) => !r.isPaid && !isBefore(r.dueDate, new Date())).length;
    const overdueCount = reminders.filter((r) => !r.isPaid && isBefore(r.dueDate, new Date()) && !isToday(r.dueDate)).length;
    const totalDue = reminders.filter((r) => !r.isPaid).reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={BellRing}
                iconColor="text-amber-400"
                title="Bill Reminders"
                subtitle="Never miss a payment"
                actions={
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Reminder</span>
                    </button>
                }
            />
            <div className="p-4 lg:p-8">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reminders.length}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Bills</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingCount}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueCount}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalDue.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Due</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[{ value: 'all', label: 'All' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'overdue', label: 'Overdue' }, { value: 'paid', label: 'Paid' }].map((tab) => (
                        <button key={tab.value} onClick={() => setFilter(tab.value as any)} className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${filter === tab.value ? 'bg-blue-600 text-white' : 'bg-white dark:bg-[#171717] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : filteredReminders.length === 0 ? (
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-12 text-center">
                        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No reminders</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Add bill reminders to stay on top of payments</p>
                        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium">
                            <Plus className="w-5 h-5" />Add your first reminder
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReminders.map((item) => {
                            const category = getCategoryById(item.categoryId);
                            const status = getDueStatus(item.dueDate, item.isPaid);
                            return (
                                <div key={item.id} className={`bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-5 hover:shadow-md transition-all ${item.isPaid ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleTogglePaid(item.id, item.isPaid)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.isPaid ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-green-500'}`}>
                                            {item.isPaid && <Check className="w-4 h-4" />}
                                        </button>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${category?.color}15` }}>{category?.icon || '📋'}</div>
                                        <div className="flex-1">
                                            <h3 className={`font-semibold ${item.isPaid ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{item.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                                                {item.notes && <span className="text-sm text-gray-400 dark:text-gray-500">{item.notes}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${item.isPaid ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>₹{item.amount.toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Bill Reminder</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"><X className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bill Name</label>
                                    <input type="text" value={newReminder.name} onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" placeholder="Electricity, Rent, Internet..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input type="number" value={newReminder.amount} onChange={(e) => setNewReminder({ ...newReminder, amount: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" placeholder="0" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                    <select value={newReminder.categoryId} onChange={(e) => setNewReminder({ ...newReminder, categoryId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
                                        <option value="">Select category</option>
                                        {defaultCategories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                                    <input type="date" value={newReminder.dueDate} onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                                    <input type="text" value={newReminder.notes} onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" placeholder="Account number, reference..." />
                                </div>
                                <button onClick={handleAdd} disabled={!newReminder.name || !newReminder.amount || !newReminder.categoryId} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors">Add Reminder</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
