import { Expense } from '@/types/expense';
import { differenceInDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, subMonths } from 'date-fns';

interface Insight {
    type: 'tip' | 'warning' | 'reminder' | 'positive' | 'negative';
    message: string;
    action?: string;
}

interface SpendingLimit {
    categoryId: string;
    categoryName: string;
    limit: number;
    spent: number;
}

interface UpcomingBill {
    name: string;
    amount: number;
    dueDate: Date;
}

export function generateInsights(
    expenses: Expense[],
    limits: SpendingLimit[] = [],
    upcomingBills: UpcomingBill[] = []
): Insight[] {
    const insights: Insight[] = [];
    const now = new Date();

    // Get this week's and last week's expenses
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = endOfWeek(now);
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));

    const thisWeekExpenses = expenses.filter(e => e.date >= thisWeekStart && e.date <= thisWeekEnd);
    const lastWeekExpenses = expenses.filter(e => e.date >= lastWeekStart && e.date <= lastWeekEnd);

    // Get this month's and last month's expenses
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = startOfMonth(now);

    const thisMonthExpenses = expenses.filter(e => e.date >= thisMonthStart);
    const lastMonthExpenses = expenses.filter(e => e.date >= lastMonthStart && e.date < lastMonthEnd);

    // 1. Category spending comparison (week over week)
    const thisWeekByCategory = groupByCategory(thisWeekExpenses);
    const lastWeekByCategory = groupByCategory(lastWeekExpenses);

    for (const [category, thisWeekTotal] of Object.entries(thisWeekByCategory)) {
        const lastWeekTotal = lastWeekByCategory[category] || 0;
        if (lastWeekTotal > 0) {
            const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
            if (change >= 25) {
                insights.push({
                    type: 'tip',
                    message: `You spent ${Math.round(change)}% more on ${category} this week vs last week`,
                });
            }
        }
    }

    // 2. Spending limit warnings
    for (const limit of limits) {
        const percentage = (limit.spent / limit.limit) * 100;
        if (percentage >= 100) {
            insights.push({
                type: 'warning',
                message: `${limit.categoryName} limit exceeded! ₹${limit.spent.toLocaleString()} of ₹${limit.limit.toLocaleString()}`,
            });
        } else if (percentage >= 80) {
            insights.push({
                type: 'warning',
                message: `Approaching ${limit.categoryName} limit: ${percentage.toFixed(0)}% used`,
            });
        }
    }

    // 3. Upcoming bill reminders
    const urgentBills = upcomingBills.filter(b => {
        const days = differenceInDays(b.dueDate, now);
        return days >= 0 && days <= 3;
    });

    for (const bill of urgentBills.slice(0, 2)) {
        const days = differenceInDays(bill.dueDate, now);
        insights.push({
            type: 'reminder',
            message: `${bill.name} bill (₹${bill.amount.toLocaleString()}) due ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}`,
        });
    }

    // 4. Positive spending reductions
    for (const [category, lastWeekTotal] of Object.entries(lastWeekByCategory)) {
        const thisWeekTotal = thisWeekByCategory[category] || 0;
        if (lastWeekTotal > 0 && thisWeekTotal < lastWeekTotal) {
            const reduction = ((lastWeekTotal - thisWeekTotal) / lastWeekTotal) * 100;
            if (reduction >= 20) {
                insights.push({
                    type: 'positive',
                    message: `Great! ${category} spending down ${Math.round(reduction)}% this week`,
                });
            }
        }
    }

    // 5. Overall spending trend
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (lastMonthTotal > 0) {
        const monthlyChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        if (monthlyChange >= 30) {
            insights.push({
                type: 'negative',
                message: `Monthly spending up ${Math.round(monthlyChange)}% compared to last month`,
            });
        } else if (monthlyChange <= -20) {
            insights.push({
                type: 'positive',
                message: `You've reduced spending by ${Math.round(Math.abs(monthlyChange))}% vs last month!`,
            });
        }
    }

    // Return top 4 insights, prioritizing warnings and reminders
    return insights
        .sort((a, b) => {
            const priority = { warning: 0, reminder: 1, negative: 2, tip: 3, positive: 4 };
            return priority[a.type] - priority[b.type];
        })
        .slice(0, 4);
}

function groupByCategory(expenses: Expense[]): Record<string, number> {
    return expenses.reduce((acc, expense) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);
}

export function calculateStreak(expenses: Expense[]): number {
    if (expenses.length === 0) return 0;

    const sortedDates = [...new Set(
        expenses.map(e => e.date.toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if user has expense today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
        return 0;
    }

    for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);

        if (currentDate.toDateString() === expectedDate.toDateString()) {
            streak++;
        } else if (i === 0 && currentDate.toDateString() === yesterday) {
            // Allow starting from yesterday
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
