'use client';

import { useState, useMemo } from 'react';
import {
    Trophy,
    Flame,
    Target,
    Star,
    Award,
    Medal,
    Zap,
    Calendar,
    TrendingUp,
    CheckCircle,
    Lock,
    LucideIcon,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useExpenseStore } from '@/store/expense-store';
import { startOfWeek, endOfWeek, differenceInDays } from 'date-fns';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    progress: number;
    target: number;
    unlocked: boolean;
    points: number;
}

interface Challenge {
    id: string;
    name: string;
    description: string;
    target: number;
    current: number;
    reward: number;
    endsIn: string;
}

export default function AchievementsPage() {
    const { expenses } = useExpenseStore();

    const stats = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);

        const totalExpenses = expenses.length;
        const thisWeekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd).length;

        // Calculate streak (consecutive days with expenses logged)
        const sortedDates = [...new Set(expenses.map(e => e.date.toDateString()))].sort();
        let streak = 0;
        const today = new Date().toDateString();
        for (let i = sortedDates.length - 1; i >= 0; i--) {
            const date = new Date(sortedDates[i]);
            const diff = differenceInDays(new Date(today), date);
            if (diff === streak) {
                streak++;
            } else {
                break;
            }
        }

        const uniqueCategories = new Set(expenses.map(e => e.category)).size;

        return {
            totalExpenses,
            thisWeekExpenses,
            streak,
            uniqueCategories,
        };
    }, [expenses]);

    const achievements: Achievement[] = [
        {
            id: '1',
            name: 'First Step',
            description: 'Log your first expense',
            icon: Star,
            color: '#F59E0B',
            progress: Math.min(stats.totalExpenses, 1),
            target: 1,
            unlocked: stats.totalExpenses >= 1,
            points: 10,
        },
        {
            id: '2',
            name: 'Getting Started',
            description: 'Log 10 expenses',
            icon: Zap,
            color: '#6366F1',
            progress: Math.min(stats.totalExpenses, 10),
            target: 10,
            unlocked: stats.totalExpenses >= 10,
            points: 50,
        },
        {
            id: '3',
            name: 'Expense Master',
            description: 'Log 50 expenses',
            icon: Trophy,
            color: '#10B981',
            progress: Math.min(stats.totalExpenses, 50),
            target: 50,
            unlocked: stats.totalExpenses >= 50,
            points: 200,
        },
        {
            id: '4',
            name: 'Week Warrior',
            description: '7-day logging streak',
            icon: Flame,
            color: '#EF4444',
            progress: Math.min(stats.streak, 7),
            target: 7,
            unlocked: stats.streak >= 7,
            points: 100,
        },
        {
            id: '5',
            name: 'Streak Legend',
            description: '30-day logging streak',
            icon: Medal,
            color: '#EC4899',
            progress: Math.min(stats.streak, 30),
            target: 30,
            unlocked: stats.streak >= 30,
            points: 500,
        },
        {
            id: '6',
            name: 'Category Explorer',
            description: 'Use 5 different categories',
            icon: Target,
            color: '#8B5CF6',
            progress: Math.min(stats.uniqueCategories, 5),
            target: 5,
            unlocked: stats.uniqueCategories >= 5,
            points: 75,
        },
        {
            id: '7',
            name: 'Budget Pro',
            description: 'Set up spending limits',
            icon: Award,
            color: '#14B8A6',
            progress: 0,
            target: 1,
            unlocked: false,
            points: 50,
        },
        {
            id: '8',
            name: 'Receipt Scanner',
            description: 'Scan 5 receipts',
            icon: CheckCircle,
            color: '#0EA5E9',
            progress: 0,
            target: 5,
            unlocked: false,
            points: 100,
        },
    ];

    const challenges: Challenge[] = [
        {
            id: '1',
            name: 'Weekly Tracker',
            description: 'Log 7 expenses this week',
            target: 7,
            current: stats.thisWeekExpenses,
            reward: 50,
            endsIn: '3 days',
        },
        {
            id: '2',
            name: 'Category Champion',
            description: 'Log expenses in 4 categories today',
            target: 4,
            current: 1,
            reward: 30,
            endsIn: '12 hours',
        },
        {
            id: '3',
            name: 'Budget Keeper',
            description: 'Stay under daily limit for 5 days',
            target: 5,
            current: 2,
            reward: 100,
            endsIn: '5 days',
        },
    ];

    const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Trophy}
                iconColor="text-yellow-400"
                title="Achievements"
                subtitle="Track your progress and unlock rewards"
            />
            <div className="p-4 lg:p-8">

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-5 h-5" />
                            <span className="text-sm opacity-90">Total Points</span>
                        </div>
                        <p className="text-3xl font-bold">{totalPoints}</p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                            <Award className="w-4 h-4" />
                            <span className="text-sm">Unlocked</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{unlockedCount}/{achievements.length}</p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                            <Flame className="w-4 h-4" />
                            <span className="text-sm">Current Streak</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-500">{stats.streak} days</p>
                    </div>
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">This Week</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{stats.thisWeekExpenses}</p>
                    </div>
                </div>

                {/* Weekly Challenges */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Weekly Challenges
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {challenges.map(challenge => (
                            <div key={challenge.id} className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white">{challenge.name}</h3>
                                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                        {challenge.endsIn}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{challenge.description}</p>
                                <div className="mb-2">
                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                            style={{ width: `${(challenge.current / challenge.target) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{challenge.current}/{challenge.target}</span>
                                    <span className="text-yellow-600 font-medium">🏆 {challenge.reward} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Achievements Grid */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        All Achievements
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {achievements.map(achievement => {
                            const Icon = achievement.icon;
                            return (
                                <div
                                    key={achievement.id}
                                    className={`rounded-2xl p-4 border transition-all ${achievement.unlocked
                                        ? 'bg-white dark:bg-[#171717] shadow-sm border-gray-100 dark:border-white/5'
                                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${achievement.unlocked ? '' : 'grayscale'
                                                }`}
                                            style={{ backgroundColor: `${achievement.color}20` }}
                                        >
                                            {achievement.unlocked ? (
                                                <Icon className="w-6 h-6" color={achievement.color} />
                                            ) : (
                                                <Lock className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h3>
                                            <p className="text-xs text-yellow-600">{achievement.points} points</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{achievement.description}</p>
                                    <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all"
                                            style={{
                                                width: `${(achievement.progress / achievement.target) * 100}%`,
                                                backgroundColor: achievement.color,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">
                                        {achievement.progress}/{achievement.target}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
