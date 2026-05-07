'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building, CreditCard, Calendar, Wallet, Calculator } from 'lucide-react';
import { LIABILITY_CATEGORIES, type LiabilityCategory } from '@/types/networth';

interface AddLiabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (liability: {
        name: string;
        category: LiabilityCategory;
        value: number;
        originalAmount?: number;
        interestRate?: number;
        emiAmount?: number;
        tenureMonths?: number;
        startDate?: string;
        notes?: string;
    }) => void;
}

export default function AddLiabilityModal({ isOpen, onClose, onAdd }: AddLiabilityModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<LiabilityCategory>('loans');
    const [value, setValue] = useState('');
    const [originalAmount, setOriginalAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [tenureMonths, setTenureMonths] = useState('');
    const [startDate, setStartDate] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmiCalculator, setShowEmiCalculator] = useState(false);

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'loans': return Building;
            case 'credit_cards': return CreditCard;
            case 'emi': return Calendar;
            default: return Wallet;
        }
    };

    // EMI Calculator
    const calculatedEmi = useMemo(() => {
        const P = parseFloat(originalAmount) || parseFloat(value) || 0;
        const r = (parseFloat(interestRate) || 0) / 12 / 100;
        const n = parseInt(tenureMonths) || 0;

        if (P <= 0 || r <= 0 || n <= 0) return null;

        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;
        const totalInterest = totalPayable - P;

        return {
            emi: Math.round(emi),
            totalPayable: Math.round(totalPayable),
            totalInterest: Math.round(totalInterest),
        };
    }, [originalAmount, value, interestRate, tenureMonths]);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !value) return;

        setIsSubmitting(true);
        try {
            await onAdd({
                name: name.trim(),
                category,
                value: parseFloat(value),
                originalAmount: originalAmount ? parseFloat(originalAmount) : undefined,
                interestRate: interestRate ? parseFloat(interestRate) : undefined,
                emiAmount: calculatedEmi?.emi,
                tenureMonths: tenureMonths ? parseInt(tenureMonths) : undefined,
                startDate: startDate || undefined,
                notes: notes.trim() || undefined,
            });

            // Reset form
            setName('');
            setCategory('loans');
            setValue('');
            setOriginalAmount('');
            setInterestRate('');
            setTenureMonths('');
            setStartDate('');
            setNotes('');
            setShowEmiCalculator(false);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#1a1a1a]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Liability</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {LIABILITY_CATEGORIES.map((cat) => {
                                        const Icon = getIcon(cat.id);
                                        const isSelected = category === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategory(cat.id)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isSelected
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <Icon
                                                    className="w-5 h-5"
                                                    style={{ color: isSelected ? cat.color : '#9CA3AF' }}
                                                />
                                                <span className={`text-xs font-medium ${isSelected
                                                    ? 'text-red-700 dark:text-red-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {cat.name.split(' ')[0]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Liability Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Liability Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Home Loan - SBI"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                />
                            </div>

                            {/* Outstanding Balance */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Outstanding Balance (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="2500000"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                />
                            </div>

                            {/* EMI Calculator Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowEmiCalculator(!showEmiCalculator)}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                <Calculator className="w-4 h-4" />
                                {showEmiCalculator ? 'Hide' : 'Show'} EMI Calculator
                            </button>

                            {/* EMI Calculator Fields */}
                            {showEmiCalculator && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Original Loan Amount (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={originalAmount}
                                                onChange={(e) => setOriginalAmount(e.target.value)}
                                                placeholder="3000000"
                                                min="0"
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Interest Rate (% p.a.)
                                            </label>
                                            <input
                                                type="number"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(e.target.value)}
                                                placeholder="8.5"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tenure (Months)
                                            </label>
                                            <input
                                                type="number"
                                                value={tenureMonths}
                                                onChange={(e) => setTenureMonths(e.target.value)}
                                                placeholder="240"
                                                min="1"
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* EMI Result */}
                                    {calculatedEmi && (
                                        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Monthly EMI</p>
                                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(calculatedEmi.emi)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Interest</p>
                                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                                        {formatCurrency(calculatedEmi.totalInterest)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Payable</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(calculatedEmi.totalPayable)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional details..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!name || !value || isSubmitting}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Liability'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
