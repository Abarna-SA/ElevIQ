'use client';

import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, TrendingDown, Wallet2, Home, Car, Briefcase, Gem } from 'lucide-react';

interface Asset {
    id: string;
    name: string;
    category: string;
    value: number;
}

interface NetWorthEmptyStateProps {
    onAddAsset: () => void;
    onAddLiability: () => void;
}

export default function NetWorthEmptyState({ onAddAsset, onAddLiability }: NetWorthEmptyStateProps) {
    const quickStartIdeas = [
        { icon: Wallet2, name: 'Bank Savings Account', type: 'asset' },
        { icon: TrendingUp, name: 'Mutual Fund Investments', type: 'asset' },
        { icon: Home, name: 'Home Loan', type: 'liability' },
        { icon: Gem, name: 'Gold & Jewelry', type: 'asset' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
            >
                <Wallet className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2"
            >
                Start Tracking Your Wealth
            </motion.h2>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8"
            >
                Add your first asset or liability to see your complete financial picture with beautiful visualizations and insights.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
            >
                <button
                    onClick={onAddAsset}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Add Your First Asset
                </button>
                <button
                    onClick={onAddLiability}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add a Liability
                </button>
            </motion.div>

            {/* Quick Start Ideas */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-lg"
            >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-4">
                    💡 Quick Start Ideas
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {quickStartIdeas.map((idea, index) => (
                        <motion.button
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                            onClick={idea.type === 'asset' ? onAddAsset : onAddLiability}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${idea.type === 'asset'
                                    ? 'bg-green-100 dark:bg-green-900/20'
                                    : 'bg-red-100 dark:bg-red-900/20'
                                }`}>
                                <idea.icon className={`w-5 h-5 ${idea.type === 'asset'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {idea.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {idea.type}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
