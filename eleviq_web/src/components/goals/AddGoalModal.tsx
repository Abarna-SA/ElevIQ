'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sparkles } from 'lucide-react';
import { goalColors } from '@/hooks/useUserGoals';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (goal: {
        name: string;
        targetAmount: number;
        currentAmount: number;
        targetDate: Date;
        color: string;
        icon?: string;
    }) => Promise<void>;
}

const goalCategories = [
    { id: 'emergency', icon: '🚨', label: 'Emergency' },
    { id: 'vacation', icon: '🏖️', label: 'Vacation' },
    { id: 'car', icon: '🚗', label: 'Car' },
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'wedding', icon: '💍', label: 'Wedding' },
    { id: 'education', icon: '📚', label: 'Education' },
    { id: 'gadget', icon: '📱', label: 'Gadget' },
    { id: 'medical', icon: '💊', label: 'Medical' },
    { id: 'other', icon: '✨', label: 'Other' },
];

export default function AddGoalModal({ isOpen, onClose, onAdd }: AddGoalModalProps) {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState<string>('');
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [color, setColor] = useState(goalColors[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setStep(1);
        setCategory('');
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setTargetDate('');
        setColor(goalColors[0]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!name || !targetAmount || !targetDate) return;

        setIsSubmitting(true);
        try {
            await onAdd({
                name: name.trim(),
                targetAmount: parseFloat(targetAmount),
                currentAmount: parseFloat(currentAmount) || 0,
                targetDate: new Date(targetDate),
                color,
                icon: category || undefined,
            });
            handleClose();
        } catch (error) {
            console.error('Failed to add goal:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate smart suggestion
    const getMonthlySuggestion = () => {
        if (!targetAmount || !targetDate) return null;
        const target = parseFloat(targetAmount);
        const current = parseFloat(currentAmount) || 0;
        const remaining = target - current;
        const monthsLeft = Math.max(1, Math.ceil(
            (new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
        ));
        const monthly = remaining / monthsLeft;
        const daily = monthly / 30;
        const weekly = monthly / 4;

        return { monthly, daily, weekly };
    };

    const suggestion = getMonthlySuggestion();

    const formatValue = (value: number) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${Math.round(value).toLocaleString('en-IN')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#171717] rounded-2xl shadow-xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Create New Goal
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-5">
                            {/* Step 1: Category Selection */}
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Choose Category
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {goalCategories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setCategory(cat.id);
                                                    setName(cat.label !== 'Other' ? cat.label : '');
                                                    setStep(2);
                                                }}
                                                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${category === cat.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <span className="text-2xl mb-1">{cat.icon}</span>
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    {cat.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Details */}
                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    {/* Goal Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Goal Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Emergency Fund, Dream Vacation"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Target Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Target Amount
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={targetAmount}
                                                onChange={(e) => setTargetAmount(e.target.value)}
                                                placeholder="100000"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Starting Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Starting Amount (Optional)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                value={currentAmount}
                                                onChange={(e) => setCurrentAmount(e.target.value)}
                                                placeholder="0"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Target Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Target Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={targetDate}
                                                onChange={(e) => setTargetDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Smart Suggestion */}
                                    {suggestion && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Smart Suggestion</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Save <span className="font-bold text-blue-600">{formatValue(suggestion.monthly)}/month</span> to reach your goal
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                That&apos;s {formatValue(suggestion.daily)}/day or {formatValue(suggestion.weekly)}/week
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Color Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Color
                                        </label>
                                        <div className="flex gap-2">
                                            {goalColors.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => setColor(c)}
                                                    className={`w-8 h-8 rounded-full transition-all ${color === c
                                                        ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#171717]'
                                                        : 'hover:scale-110'
                                                        }`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-white/5">
                            {step === 2 && (
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={step === 1 ? handleClose : handleSubmit}
                                disabled={step === 2 && (!name || !targetAmount || !targetDate || isSubmitting)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${step === 1
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500'
                                    }`}
                            >
                                {isSubmitting ? 'Creating...' : step === 1 ? 'Cancel' : 'Create Goal'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
