'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { OnboardingData } from '@/app/(auth)/_hooks/useUserDocument';

interface CompletionScreenProps {
    data: OnboardingData;
    userName: string;
    onContinue: () => void;
}

const userTypeLabels: Record<string, string> = {
    student: '🎓 Student',
    employee: '👔 Employee',
    self_employed: '🔧 Self Employed',
    entrepreneur: '🚀 Entrepreneur',
    business_owner: '🏢 Business Owner',
    freelancer: '💻 Freelancer',
    retired: '🏖️ Retired',
    homemaker: '🏠 Homemaker',
};

const goalLabels: Record<string, string> = {
    save_money: 'Saving',
    track_spending: 'Tracking',
    pay_debt: 'Debt Payoff',
    emergency_fund: 'Emergency Fund',
    invest: 'Investing',
    budget_better: 'Budgeting',
    buy_home: 'Home Purchase',
    education: 'Education',
};

export default function CompletionScreen({ data, userName, onContinue }: CompletionScreenProps) {
    const primaryGoals = data.goals.slice(0, 2).map(g => goalLabels[g]).join(' & ');

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center"
            >
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="relative w-24 h-24 mx-auto mb-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-pulse" />
                    <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-emerald-500" />
                    </div>
                    {/* Confetti effect */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, rotate: 0 }}
                            animate={{
                                scale: [0, 1, 0],
                                rotate: 360,
                                x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 10)],
                                y: [0, -50 - i * 10, 20]
                            }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][i % 4]
                            }}
                        />
                    ))}
                </motion.div>

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                >
                    You're all set! ✨
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400 mb-8"
                >
                    ElevIQ is now personalized for you, {userName.split(' ')[0]}
                </motion.p>

                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8 text-left space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Profile</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {userTypeLabels[data.userType]}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Budget</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ₹{data.monthlyBudget.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Focus</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            🎯 {primaryGoals}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">AI Insights</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {data.aiInsightsEnabled ? '🤖 Enabled' : '❌ Disabled'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Weekly Reports</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {data.weeklyReportsEnabled ? '📊 On' : '❌ Off'}
                        </span>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                    <span>🚀 Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                </motion.button>
            </motion.div>
        </div>
    );
}
