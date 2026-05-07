'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Flame, Trophy, Check } from 'lucide-react';

interface StreakWidgetProps {
    streak: number;
    weeklyPoints: number;
    weeklyChallenge: { current: number; target: number };
    totalPoints: number;
}

export default function StreakWidget({ streak, weeklyPoints, weeklyChallenge, totalPoints }: StreakWidgetProps) {
    const challengeProgress = Math.min((weeklyChallenge.current / weeklyChallenge.target) * 100, 100);
    const isChallengeDone = weeklyChallenge.current >= weeklyChallenge.target;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm flex flex-col"
        >
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Progress</h3>
                <Link
                    href="/achievements"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    All
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-6 pt-5 flex-1 flex flex-col">

                {/* Streak */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                        <Flame className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">day streak</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">This Week</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{weeklyPoints}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">points</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{totalPoints}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">points</p>
                    </div>
                </div>

                {/* Weekly Challenge */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Weekly Challenge</p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {weeklyChallenge.current}/{weeklyChallenge.target}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                        <motion.div
                            className={`h-full rounded-full ${isChallengeDone ? 'bg-emerald-500' : 'bg-gray-900 dark:bg-white'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${challengeProgress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Log {weeklyChallenge.target} expenses this week
                    </p>

                    {isChallengeDone && (
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                            <Check className="w-4 h-4" />
                            <span>Challenge completed! +100 pts</span>
                        </div>
                    )}
                </div>

                {/* Level Badge */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Level</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {totalPoints >= 5000 ? 'Diamond' :
                                totalPoints >= 2000 ? 'Platinum' :
                                    totalPoints >= 1000 ? 'Gold' :
                                        totalPoints >= 500 ? 'Silver' : 'Bronze'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
