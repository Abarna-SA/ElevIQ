'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';
import { type Goal } from '@/hooks/useUserGoals';

interface AddFundsModalProps {
    isOpen: boolean;
    goal: Goal | null;
    mode: 'add' | 'withdraw';
    onClose: () => void;
    onConfirm: (goalId: string, amount: number) => Promise<void>;
}

const quickAmounts = [1000, 5000, 10000, 25000, 50000];

export default function AddFundsModal({ isOpen, goal, mode, onClose, onConfirm }: AddFundsModalProps) {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        setAmount('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!goal || !amount) return;

        const numAmount = parseFloat(amount);
        if (mode === 'withdraw' && numAmount > goal.currentAmount) {
            return; // Can't withdraw more than available
        }

        setIsSubmitting(true);
        try {
            await onConfirm(goal.id, numAmount);
            handleClose();
        } catch (error) {
            console.error('Failed to update funds:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const maxWithdraw = goal ? goal.currentAmount : 0;
    const remaining = goal ? goal.targetAmount - goal.currentAmount : 0;

    const formatValue = (value: number) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && goal && (
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
                        className="relative w-full max-w-md bg-white dark:bg-[#171717] rounded-2xl shadow-xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode === 'add'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                                        }`}
                                >
                                    {mode === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {mode === 'add' ? 'Add Funds' : 'Withdraw Funds'}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{goal.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-5">
                            {/* Current Balance */}
                            <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatValue(goal.currentAmount)}
                                    </p>
                                </div>
                                {mode === 'add' && (
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                                        <p className="text-lg font-bold" style={{ color: goal.color }}>
                                            {formatValue(remaining)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full pl-10 pr-4 py-4 text-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {mode === 'withdraw' && parseFloat(amount) > maxWithdraw && (
                                    <p className="text-sm text-red-500 mt-2">
                                        Cannot withdraw more than {formatValue(maxWithdraw)}
                                    </p>
                                )}
                            </div>

                            {/* Quick Amounts */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Quick Select
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {quickAmounts.map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setAmount(amt.toString())}
                                            disabled={mode === 'withdraw' && amt > maxWithdraw}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${amount === amt.toString()
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                }`}
                                        >
                                            {formatValue(amt)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fill Remaining */}
                            {mode === 'add' && remaining > 0 && (
                                <button
                                    onClick={() => setAmount(remaining.toString())}
                                    className="w-full p-3 text-sm font-medium text-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    Add full remaining amount ({formatValue(remaining)})
                                </button>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-white/5">
                            <button
                                onClick={handleClose}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!amount || parseFloat(amount) <= 0 || (mode === 'withdraw' && parseFloat(amount) > maxWithdraw) || isSubmitting}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${mode === 'add'
                                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white'
                                    : 'bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white'
                                    }`}
                            >
                                {isSubmitting ? 'Processing...' : mode === 'add' ? 'Add Funds' : 'Withdraw'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
