'use client';

import { motion } from 'framer-motion';
import { Target, Plus, Sparkles } from 'lucide-react';

interface GoalsEmptyStateProps {
    onCreateGoal: () => void;
}

const popularGoals = [
    { icon: '🚨', label: 'Emergency Fund', description: 'For unexpected expenses' },
    { icon: '🏖️', label: 'Vacation', description: 'Your dream trip awaits' },
    { icon: '🚗', label: 'New Car', description: 'Drive your dream car' },
    { icon: '🏠', label: 'Home Down Payment', description: 'Own your place' },
    { icon: '💍', label: 'Wedding Fund', description: 'Your special day' },
    { icon: '📚', label: 'Education', description: 'Invest in learning' },
];

export default function GoalsEmptyState({ onCreateGoal }: GoalsEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm p-8 lg:p-12"
        >
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="relative"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center">
                        <Target className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                    >
                        <Sparkles className="w-4 h-4 text-yellow-900" />
                    </motion.div>
                </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Start Your Savings Journey
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Set financial goals and watch your savings grow. Track emergency funds, vacations, or big purchases with ease.
                </p>
            </div>

            {/* Popular Goals */}
            <div className="mb-8">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center mb-4">
                    Popular Goals
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto">
                    {popularGoals.map((goal, index) => (
                        <motion.button
                            key={goal.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            onClick={onCreateGoal}
                            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                                {goal.icon}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {goal.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {goal.description}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateGoal}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/25 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Your First Goal
                </motion.button>
            </div>
        </motion.div>
    );
}
