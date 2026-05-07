'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useExpenseStore } from '@/store/expense-store';
import { useAuthStore } from '@/store/auth-store';
import { useUserNetWorth } from '@/hooks/useUserNetWorth';
import { useUserGoals } from '@/hooks/useUserGoals';
import { useBills } from '@/hooks/useBills';
import {
    NetWorthWidget,
    BillsWidget,
    GoalsWidget,
    InsightsWidget,
    SpendingWidget,
    TransactionsWidget,
    StreakWidget,
    QuickActionsWidget
} from '@/components/dashboard/widgets';
import { generateInsights, calculateStreak } from '@/lib/insights';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { expenses, monthlyTotal, categoryTotals, fetchExpenses, fetchStats } = useExpenseStore();

    // Use real data from Firestore hooks
    const { assets, liabilities } = useUserNetWorth();
    const { goals } = useUserGoals();
    const { upcomingBills } = useBills();

    useEffect(() => {
        fetchExpenses();
        fetchStats();
    }, [fetchExpenses, fetchStats]);

    // Transform data for widgets
    const widgetAssets = useMemo(() =>
        assets.map(a => ({
            type: a.category,
            name: a.name,
            amount: a.value,
        })), [assets]);

    const widgetLiabilities = useMemo(() =>
        liabilities.map(l => ({
            type: l.category,
            name: l.name,
            amount: l.value,
        })), [liabilities]);

    const widgetGoals = useMemo(() =>
        goals.map(g => ({
            id: g.id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
        })), [goals]);

    const widgetBills = useMemo(() =>
        upcomingBills.map(b => ({
            id: b.id,
            name: b.name,
            amount: b.amount,
            dueDate: new Date(b.dueDate),
            isPaid: b.isPaid,
            category: b.category,
        })), [upcomingBills]);

    // Calculate derived data
    const streak = useMemo(() => calculateStreak(expenses), [expenses]);
    const insights = useMemo(() => generateInsights(expenses, [], widgetBills), [expenses, widgetBills]);

    // Weekly stats for gamification
    const weeklyStats = useMemo(() => {
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        const weekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd);
        return {
            points: weekExpenses.length * 10, // 10 points per expense logged
            challenge: { current: weekExpenses.length, target: 7 },
        };
    }, [expenses]);

    // Total points from achievements
    const totalPoints = useMemo(() => {
        let points = 0;
        if (expenses.length >= 1) points += 10;
        if (expenses.length >= 10) points += 50;
        if (expenses.length >= 50) points += 200;
        if (streak >= 7) points += 100;
        return points + weeklyStats.points;
    }, [expenses, streak, weeklyStats.points]);

    // Time-aware greeting logic
    const greetingData = useMemo(() => {
        const hour = new Date().getHours();
        const firstName = user?.displayName?.split(' ')[0] || 'there';

        if (hour < 12) {
            return {
                greeting: `Good morning, ${firstName}!`,
                emoji: '☀️',
                gradient: 'from-amber-500 via-orange-500 to-rose-500 dark:from-amber-700 dark:via-orange-800 dark:to-rose-900',
                message: monthlyTotal === 0
                    ? 'Start tracking your expenses today and take control! 🚀'
                    : "It's a beautiful day to stay on top of your finances.",
            };
        } else if (hour < 17) {
            return {
                greeting: `Good afternoon, ${firstName}!`,
                emoji: '🌤️',
                gradient: 'from-blue-500 via-cyan-500 to-teal-400 dark:from-blue-700 dark:via-cyan-800 dark:to-teal-900',
                message: monthlyTotal === 0
                    ? 'Start tracking your expenses today and take control! 🚀'
                    : 'Keep the momentum going — you\'re doing great!',
            };
        } else {
            return {
                greeting: `Good evening, ${firstName}!`,
                emoji: '🌙',
                gradient: 'from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-800 dark:via-violet-900 dark:to-purple-950',
                message: monthlyTotal === 0
                    ? 'Start tracking your expenses today and take control! 🚀'
                    : "Time to wind down. Here's your financial snapshot for today.",
            };
        }
    }, [user?.displayName, monthlyTotal]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            {/* ========== MOBILE LAYOUT ========== */}
            <div className="lg:hidden">
                {/* Warm Greeting Card */}
                <div className={`bg-gradient-to-br ${greetingData.gradient} text-white px-5 py-6 rounded-b-3xl`}>
                    {/* Greeting */}
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span>{greetingData.emoji}</span>
                        {greetingData.greeting}
                    </h1>

                    {/* Motivational Sub-text */}
                    <p className="text-white/80 text-sm mt-1.5 leading-relaxed">
                        {greetingData.message}
                    </p>

                    {/* Glass Stats Bar */}
                    <div className="mt-4 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center justify-between">
                        {monthlyTotal > 0 && (
                            <span className="text-sm font-medium text-white/90">
                                ₹{monthlyTotal.toLocaleString('en-IN')} this month
                            </span>
                        )}
                        <span className={`text-xs text-white/60 flex items-center gap-1.5 ${monthlyTotal === 0 ? 'ml-auto' : ''}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(), 'EEE, MMM d')}
                        </span>
                    </div>
                </div>

                {/* Mobile Bento Grid */}
                <div className="px-4 py-6 pb-24 space-y-4">
                    {/* Quick Actions */}
                    <QuickActionsWidget />

                    {/* Net Worth - Full Width */}
                    <NetWorthWidget assets={widgetAssets} liabilities={widgetLiabilities} />

                    {/* Spending Widget */}
                    <SpendingWidget
                        monthlyTotal={monthlyTotal}
                        budget={60000}
                        categoryTotals={categoryTotals}
                        transactionCount={expenses.length}
                    />

                    {/* Bills Widget */}
                    <BillsWidget bills={widgetBills} />

                    {/* Goals Widget */}
                    <GoalsWidget goals={widgetGoals} />

                    {/* Smart Insights */}
                    <InsightsWidget insights={insights} />

                    {/* Recent Transactions */}
                    <TransactionsWidget expenses={expenses} />

                    {/* Streak Widget */}
                    <StreakWidget
                        streak={streak}
                        weeklyPoints={weeklyStats.points}
                        weeklyChallenge={weeklyStats.challenge}
                        totalPoints={totalPoints}
                    />
                </div>
            </div>

            {/* ========== DESKTOP LAYOUT ========== */}
            <div className="hidden lg:block p-6">
                {/* Enhanced Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                            </p>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.displayName?.split(' ')[0] || 'there'}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                {monthlyTotal === 0
                                    ? "Start tracking your expenses today! 🚀"
                                    : `You've spent ₹${monthlyTotal.toLocaleString('en-IN')} this month ✨`}
                            </p>
                        </div>
                    </div>
                </div>


                {/* Desktop Bento Grid - Tighter Layout */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Row 1: Quick Actions (5) + Net Worth (4) + Goals (3) */}
                    <div className="col-span-5">
                        <QuickActionsWidget />
                    </div>
                    <div className="col-span-4">
                        <NetWorthWidget assets={widgetAssets} liabilities={widgetLiabilities} />
                    </div>
                    <div className="col-span-3">
                        <GoalsWidget goals={widgetGoals} />
                    </div>

                    {/* Row 2: Spending (5) + Bills (4) + Insights (3) */}
                    <div className="col-span-5">
                        <SpendingWidget
                            monthlyTotal={monthlyTotal}
                            budget={60000}
                            categoryTotals={categoryTotals}
                            transactionCount={expenses.length}
                        />
                    </div>
                    <div className="col-span-4">
                        <BillsWidget bills={widgetBills} />
                    </div>
                    <div className="col-span-3">
                        <InsightsWidget insights={insights} />
                    </div>

                    {/* Row 3: Transactions (8) + Streak (4) */}
                    <div className="col-span-8">
                        <TransactionsWidget expenses={expenses} />
                    </div>
                    <div className="col-span-4">
                        <StreakWidget
                            streak={streak}
                            weeklyPoints={weeklyStats.points}
                            weeklyChallenge={weeklyStats.challenge}
                            totalPoints={totalPoints}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
