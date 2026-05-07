'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Users,
    Mail,
    Trash2,
    X,
    Check,
    UserPlus,
    LogOut,
    Crown,
    Heart,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { useExpenseStore } from '@/store/expense-store';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface FamilyMember {
    uid: string;
    email: string;
    name: string;
    role: 'owner' | 'member';
    joinedAt: Date;
}

interface Family {
    id: string;
    name: string;
    ownerId: string;
    members: FamilyMember[];
    sharedBudget: number;
    createdAt: Date;
}

export default function FamilyPage() {
    const { user } = useAuthStore();
    const { expenses } = useExpenseStore();
    const [family, setFamily] = useState<Family | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [familyName, setFamilyName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [sharedBudget, setSharedBudget] = useState('');

    useEffect(() => {
        const fetchFamily = async () => {
            if (!user?.uid || !db) return;

            try {
                // Check if user owns a family
                let q = query(
                    collection(db, 'families'),
                    where('ownerId', '==', user.uid)
                );
                let snapshot = await getDocs(q);

                if (snapshot.empty) {
                    // Check if user is a member
                    q = query(
                        collection(db, 'families'),
                        where('memberIds', 'array-contains', user.uid)
                    );
                    snapshot = await getDocs(q);
                }

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setFamily({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate() || new Date(),
                    } as Family);
                }
            } catch (error) {
                console.error('Failed to fetch family:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFamily();
    }, [user]);

    const handleCreate = async () => {
        if (!user?.uid || !db || !familyName) return;

        try {
            const newFamily = {
                name: familyName,
                ownerId: user.uid,
                members: [{
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || 'Owner',
                    role: 'owner',
                    joinedAt: new Date(),
                }],
                memberIds: [user.uid],
                sharedBudget: parseFloat(sharedBudget) || 0,
                createdAt: new Date(),
            };

            const docRef = await addDoc(collection(db, 'families'), newFamily);
            setFamily({
                id: docRef.id,
                ...newFamily,
            } as Family);
            setShowCreate(false);
            setFamilyName('');
        } catch (error) {
            console.error('Failed to create family:', error);
        }
    };

    const handleInvite = async () => {
        if (!family || !db || !inviteEmail) return;

        // In a real app, this would send an email invitation
        // For now, we'll just add a placeholder member
        try {
            const newMember = {
                uid: '', // Will be filled when they accept
                email: inviteEmail,
                name: inviteEmail.split('@')[0],
                role: 'member' as const,
                joinedAt: new Date(),
            };

            await updateDoc(doc(db, 'families', family.id), {
                members: arrayUnion(newMember),
            });

            setFamily({
                ...family,
                members: [...family.members, newMember],
            });
            setInviteEmail('');
            setShowInvite(false);
        } catch (error) {
            console.error('Failed to invite member:', error);
        }
    };

    // Calculate family spending
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
    };

    const familySpending = expenses
        .filter((e) => e.date >= currentMonth.start && e.date <= currentMonth.end)
        .reduce((sum, e) => sum + e.amount, 0);

    const budgetPercentage = family?.sharedBudget
        ? Math.min((familySpending / family.sharedBudget) * 100, 100)
        : 0;

    const isOwner = family?.ownerId === user?.uid;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Heart}
                iconColor="text-pink-400"
                title="Family Budget"
                subtitle="Manage shared household expenses"
            />
            <div className="p-4 lg:p-8">

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : family ? (
                    <div className="space-y-6">
                        {/* Family Card */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{family.name}</h2>
                                        <p className="text-sm opacity-80">{family.members.length} members</p>
                                    </div>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => setShowInvite(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-colors"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Invite
                                    </button>
                                )}
                            </div>

                            {/* Budget Progress */}
                            {family.sharedBudget > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/20">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="opacity-80">Monthly Budget</span>
                                        <span className="font-medium">
                                            ₹{familySpending.toLocaleString()} / ₹{family.sharedBudget.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${budgetPercentage >= 90 ? 'bg-red-400' : budgetPercentage >= 70 ? 'bg-yellow-400' : 'bg-white'
                                                }`}
                                            style={{ width: `${budgetPercentage}%` }}
                                        />
                                    </div>
                                    <p className="text-sm opacity-80 mt-2">
                                        ₹{(family.sharedBudget - familySpending).toLocaleString()} remaining
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Members */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Members</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {family.members.map((member, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-medium">
                                            {member.name[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {member.name}
                                                </p>
                                                {member.role === 'owner' && (
                                                    <Crown className="w-4 h-4 text-yellow-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {member.email}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.role === 'owner'
                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {member.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    ₹{familySpending.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Daily Average</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    ₹{Math.round(familySpending / new Date().getDate()).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Create Family */
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No family group yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            Create a family group to share and track household expenses together
                        </p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Create Family Group
                        </button>
                    </div>
                )}

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Create Family Group
                                </h2>
                                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Family Name
                                    </label>
                                    <input
                                        type="text"
                                        value={familyName}
                                        onChange={(e) => setFamilyName(e.target.value)}
                                        placeholder="The Smiths"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Monthly Budget (Optional)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={sharedBudget}
                                            onChange={(e) => setSharedBudget(e.target.value)}
                                            placeholder="50000"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreate}
                                    disabled={!familyName}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                                >
                                    Create Family
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invite Modal */}
                {showInvite && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Invite Member
                                </h2>
                                <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="member@example.com"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                                    />
                                </div>

                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteEmail}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
                                >
                                    Send Invitation
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
