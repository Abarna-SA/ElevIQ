'use client';

import { useState, useEffect } from 'react';
import {
    Mail,
    Save,
    Check,
    CircleUserRound,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserProfile {
    displayName: string;
    email: string;
    monthlyIncome: number;
    savingsGoal: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        displayName: '',
        email: '',
        monthlyIncome: 0,
        savingsGoal: 20,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.uid) return;

            try {
                const response = await fetch('/api/v1/profile', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const data = await response.json();
                    setProfile({
                        displayName: data.displayName || user.displayName || '',
                        email: data.email || user.email || '',
                        monthlyIncome: data.monthlyIncome || 0,
                        savingsGoal: data.savingsGoal || 20,
                        currency: data.currency || 'INR',
                        createdAt: data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt || new Date().toISOString(),
                    });
                } else {
                    console.error('Failed to load profile from API API returned:', response.status);
                    setProfile(prev => ({
                        ...prev,
                        displayName: user.displayName || '',
                        email: user.email || '',
                    }));
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
                toast.error('Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user?.uid) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/v1/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });

            if (response.ok) {
                setSaved(true);
                toast.success('Profile updated successfully!');
                setTimeout(() => setSaved(false), 2000);
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast.error('An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCurrency = currencies.find(c => c.code === profile.currency);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
                <PageHeader icon={CircleUserRound} iconColor="text-blue-500" title="Profile Settings" />
                <div className="p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Skeleton Left Card */}
                        <div className="lg:col-span-4">
                            <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 animate-pulse flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 mb-4"></div>
                                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            </div>
                        </div>
                        {/* Skeleton Right Content */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 animate-pulse space-y-6">
                                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                    <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 animate-pulse space-y-6">
                                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                    <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            {/* Header matches global dashboard style */}
            <PageHeader icon={CircleUserRound} iconColor="text-blue-500" title="Profile Settings" />
            
            <div className="p-4 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Profile Summary - Left Sidebar (Desktop) */}
                        <div className="lg:col-span-4">
                            <div className="bg-white dark:bg-[#111111] rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20"></div>
                                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex flex-col items-center justify-center border-4 border-white dark:border-[#111111] shadow-lg">
                                        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                            {profile.displayName?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {profile.displayName || 'User'}
                                </h2>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 justify-center">
                                    <Mail className="w-3.5 h-3.5" />
                                    {profile.email}
                                </p>
                                
                                <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-6"></div>
                                
                                <div className="w-full text-left space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Target Savings</p>
                                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {selectedCurrency?.symbol}{((profile.monthlyIncome * profile.savingsGoal) / 100).toLocaleString()}
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">/mo</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Settings Area */}
                        <div className="lg:col-span-8 flex flex-col gap-8">
                            
                            {/* Personal Information Card */}
                            <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-white/5">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    Personal Information
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Full Name"
                                        type="text"
                                        placeholder="Your name"
                                        value={profile.displayName}
                                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                    />
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="bg-gray-50 text-gray-500 dark:bg-[#1a1a1a] dark:text-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Financial Settings Card */}
                            <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-white/5">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    Financial Goals
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="relative">
                                        <Input
                                            label="Monthly Income"
                                            type="number"
                                            placeholder="0"
                                            value={profile.monthlyIncome || ''}
                                            onChange={(e) => setProfile({ ...profile, monthlyIncome: parseFloat(e.target.value) || 0 })}
                                            className="pl-8"
                                            icon={<span className="font-semibold text-gray-400">{selectedCurrency?.symbol}</span>}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Input
                                            label="Savings Goal (%)"
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={profile.savingsGoal}
                                            onChange={(e) => setProfile({ ...profile, savingsGoal: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="absolute right-4 top-[38px] text-gray-400 font-bold pointer-events-none">%</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Preferred Currency
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {currencies.map((currency) => (
                                            <button
                                                key={currency.code}
                                                type="button"
                                                onClick={() => setProfile({ ...profile, currency: currency.code })}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                                    profile.currency === currency.code
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#252525]'
                                                }`}
                                            >
                                                <span className="text-base font-bold">{currency.symbol}</span>
                                                {currency.code}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Area */}
                            <div className="flex justify-end pt-4 pb-12">
                                <Button
                                    size="lg"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    className={`w-full sm:w-auto min-w-[200px] gap-2 ${saved ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' : ''}`}
                                >
                                    {saved ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Changes Saved
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Settings
                                        </>
                                    )}
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
