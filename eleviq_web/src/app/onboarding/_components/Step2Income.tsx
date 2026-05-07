'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import type { IncomeRange, Currency } from '@/app/(auth)/_hooks/useUserDocument';

interface Step2IncomeProps {
    currency: Currency;
    incomeRange: IncomeRange | null;
    monthlyBudget: number | null;
    onCurrencyChange: (value: Currency) => void;
    onIncomeRangeChange: (value: IncomeRange) => void;
    onBudgetChange: (value: number) => void;
}

const currencies: { value: Currency; label: string; symbol: string; flag: string }[] = [
    { value: 'INR', label: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { value: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { value: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
    { value: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { value: 'AED', label: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
];

// Income ranges with min/max values for calculations
const incomeRanges: { value: IncomeRange; label: string; min: number; max: number }[] = [
    { value: 'below_10k', label: 'Below 10K', min: 0, max: 10000 },
    { value: '10k_25k', label: '10K - 25K', min: 10000, max: 25000 },
    { value: '25k_50k', label: '25K - 50K', min: 25000, max: 50000 },
    { value: '50k_1L', label: '50K - 1L', min: 50000, max: 100000 },
    { value: '1L_3L', label: '1L - 3L', min: 100000, max: 300000 },
    { value: 'above_3L', label: 'Above 3L', min: 300000, max: 500000 },
];

export default function Step2Income({
    currency,
    incomeRange,
    monthlyBudget,
    onCurrencyChange,
    onIncomeRangeChange,
    onBudgetChange,
}: Step2IncomeProps) {
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedCurrency = currencies.find(c => c.value === currency) || currencies[0];

    // Get selected income range details
    const selectedIncomeRange = useMemo(() =>
        incomeRanges.find(r => r.value === incomeRange),
        [incomeRange]
    );

    // Calculate recommended budget (75% of mid-point)
    const recommendedBudget = useMemo(() => {
        if (!selectedIncomeRange) return null;
        const midPoint = (selectedIncomeRange.min + selectedIncomeRange.max) / 2;
        return Math.round(midPoint * 0.75);
    }, [selectedIncomeRange]);

    // Max allowed budget (upper limit of income range)
    const maxBudget = selectedIncomeRange?.max || null;

    // Check if budget exceeds income
    const budgetExceedsIncome = useMemo(() => {
        if (!monthlyBudget || !maxBudget) return false;
        return monthlyBudget > maxBudget;
    }, [monthlyBudget, maxBudget]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowCurrencyDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-set recommended budget when income range changes
    useEffect(() => {
        if (incomeRange && recommendedBudget) {
            onBudgetChange(recommendedBudget);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incomeRange]);

    const handleBudgetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (raw) {
            const value = parseInt(raw, 10);
            // Cap at max budget if it exceeds
            if (maxBudget && value > maxBudget) {
                onBudgetChange(maxBudget);
            } else {
                onBudgetChange(value);
            }
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('en-IN');
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                    <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Set up your finances
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    This helps us create your budget
                </p>
            </motion.div>

            {/* Currency Selector */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Currency <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                        className="w-full flex items-center justify-between px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                        <span className="flex items-center gap-3">
                            <span className="text-xl">{selectedCurrency.flag}</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                                {selectedCurrency.value} - {selectedCurrency.label}
                            </span>
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showCurrencyDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                            >
                                {currencies.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => {
                                            onCurrencyChange(c.value);
                                            setShowCurrencyDropdown(false);
                                        }}
                                        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${c.value === currency ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-xl">{c.flag}</span>
                                            <span className="text-gray-900 dark:text-white font-medium">{c.value}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{c.label}</span>
                                        </span>
                                        {c.value === currency && (
                                            <Check className="w-5 h-5 text-blue-500" />
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Income Range */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Monthly Income Range <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {incomeRanges.map((range, index) => (
                        <motion.button
                            key={range.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onIncomeRangeChange(range.value)}
                            className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${incomeRange === range.value
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {selectedCurrency.symbol}{range.label}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Monthly Budget */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Monthly Budget <span className="text-red-500">*</span>
                    </label>
                    {maxBudget && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Max: {selectedCurrency.symbol}{formatNumber(maxBudget)}
                        </span>
                    )}
                </div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold text-lg">
                        {selectedCurrency.symbol}
                    </span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={recommendedBudget ? formatNumber(recommendedBudget) : '35,000'}
                        value={monthlyBudget ? formatNumber(monthlyBudget) : ''}
                        onChange={handleBudgetInput}
                        className={`w-full pl-10 pr-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 transition-all outline-none ${budgetExceedsIncome
                            ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500 focus:ring-green-500/10'
                            }`}
                    />
                </div>

                {/* Dynamic hint based on income range */}
                {selectedIncomeRange ? (
                    <div className="mt-2.5 flex items-start gap-2">
                        {budgetExceedsIncome ? (
                            <>
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-500">
                                    Budget cannot exceed your income range ({selectedCurrency.symbol}{formatNumber(maxBudget!)})
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="text-base">💡</span>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Recommended: {selectedCurrency.symbol}{formatNumber(recommendedBudget!)} (70-80% of income)
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <p className="mt-2.5 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <span className="text-base">💡</span>
                        <span>Select income range to see recommendations</span>
                    </p>
                )}
            </motion.div>
        </div>
    );
}
