'use client';

import { useState, useEffect } from 'react';
import {
    RefreshCw,
    ArrowRightLeft,
    TrendingUp,
    Check,
    BadgeDollarSign,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface Currency {
    code: string;
    symbol: string;
    name: string;
    flag: string;
}

const currencies: Currency[] = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
];

const exchangeRates: Record<string, number> = {
    'INR': 1,
    'USD': 83.12,
    'EUR': 89.76,
    'GBP': 104.23,
    'JPY': 0.56,
    'AUD': 54.67,
    'CAD': 62.14,
    'CHF': 93.45,
    'SGD': 61.89,
    'AED': 22.64,
};

export default function CurrencyPage() {
    const { user } = useAuthStore();
    const [baseCurrency, setBaseCurrency] = useState<Currency>(currencies[0]);
    const [targetCurrency, setTargetCurrency] = useState<Currency>(currencies[1]);
    const [amount, setAmount] = useState('1000');
    const [isLoading, setIsLoading] = useState(false);
    const [savedCurrency, setSavedCurrency] = useState('INR');
    const [lastUpdated] = useState(new Date());

    useEffect(() => {
        const fetchUserCurrency = async () => {
            if (!user?.uid || !db) return;

            try {
                const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
                if (profileDoc.exists()) {
                    const currency = profileDoc.data().currency || 'INR';
                    setSavedCurrency(currency);
                    const found = currencies.find((c) => c.code === currency);
                    if (found) setBaseCurrency(found);
                }
            } catch (error) {
                console.error('Failed to fetch currency:', error);
            }
        };

        fetchUserCurrency();
    }, [user]);

    const handleSwap = () => {
        const temp = baseCurrency;
        setBaseCurrency(targetCurrency);
        setTargetCurrency(temp);
    };

    const convertAmount = (from: string, to: string, value: number): number => {
        const inINR = value * exchangeRates[from];
        return inINR / exchangeRates[to];
    };

    const convertedAmount = convertAmount(baseCurrency.code, targetCurrency.code, parseFloat(amount) || 0);
    const rate = convertAmount(baseCurrency.code, targetCurrency.code, 1);

    const handleSetDefault = async (currency: Currency) => {
        if (!user?.uid || !db) return;
        setIsLoading(true);

        try {
            await updateDoc(doc(db, 'profiles', user.uid), {
                currency: currency.code,
            });
            setSavedCurrency(currency.code);
            setBaseCurrency(currency);
        } catch (error) {
            console.error('Failed to save currency:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={BadgeDollarSign}
                iconColor="text-green-400"
                title="Currency"
            />
            <div className="p-4 lg:p-8">
                <div className="max-w-2xl space-y-6">
                    {/* Converter Card */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
                        <div className="space-y-4">
                            {/* From Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                                <div className="flex gap-3">
                                    <select
                                        value={baseCurrency.code}
                                        onChange={(e) => {
                                            const c = currencies.find((cur) => cur.code === e.target.value);
                                            if (c) setBaseCurrency(c);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium"
                                    >
                                        {currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code} - {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                            {baseCurrency.symbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Swap Button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={handleSwap}
                                    className="p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 rounded-full transition-colors"
                                >
                                    <ArrowRightLeft className="w-5 h-5" />
                                </button>
                            </div>

                            {/* To Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                                <div className="flex gap-3">
                                    <select
                                        value={targetCurrency.code}
                                        onChange={(e) => {
                                            const c = currencies.find((cur) => cur.code === e.target.value);
                                            if (c) setTargetCurrency(c);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium"
                                    >
                                        {currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code} - {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                        <p className="text-blue-600 font-bold text-right">
                                            {targetCurrency.symbol} {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Exchange Rate */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Exchange Rate</span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    1 {baseCurrency.code} = {rate.toFixed(4)} {targetCurrency.code}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Default Currency */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Default Currency</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            All your expenses will be displayed in this currency
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {currencies.slice(0, 6).map((c) => (
                                <button
                                    key={c.code}
                                    onClick={() => handleSetDefault(c)}
                                    disabled={isLoading}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${savedCurrency === c.code
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <span className="text-2xl">{c.flag}</span>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900 dark:text-white">{c.code}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.symbol}</p>
                                    </div>
                                    {savedCurrency === c.code && (
                                        <Check className="w-5 h-5 text-blue-500 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Popular Rates */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Popular Rates (vs INR)</h3>
                        <div className="space-y-3">
                            {currencies.filter((c) => c.code !== 'INR').slice(0, 5).map((c) => {
                                const rateValue = exchangeRates[c.code];
                                return (
                                    <div key={c.code} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{c.flag}</span>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{c.code}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{c.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">₹{rateValue.toFixed(2)}</p>
                                            <div className="flex items-center gap-1 text-xs text-green-500">
                                                <TrendingUp className="w-3 h-3" />
                                                <span>+0.12%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
