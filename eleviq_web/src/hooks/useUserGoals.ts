'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/lib/firebase/config';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    onSnapshot,
    orderBy,
    query,
} from 'firebase/firestore';

// Types
export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    color: string;
    icon?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const goalColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
];

/**
 * Hook for managing user's savings goals
 * Data is stored in Firestore subcollection: /users/{userId}/goals
 */
export function useUserGoals() {
    const { user } = useAuthStore();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get user ID from auth store
    const userId = user?.uid;

    // Subscribe to goals collection
    useEffect(() => {
        if (!userId || !db) {
            setGoals([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const goalsRef = collection(db, 'users', userId, 'goals');
        const goalsQuery = query(goalsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            goalsQuery,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    targetDate: doc.data().targetDate?.toDate() || new Date(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                })) as Goal[];
                setGoals(data);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching goals:', err);
                setError('Failed to load goals');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Computed values
    const activeGoals = useMemo(
        () => goals.filter((g) => g.currentAmount < g.targetAmount),
        [goals]
    );

    const completedGoals = useMemo(
        () => goals.filter((g) => g.currentAmount >= g.targetAmount),
        [goals]
    );

    const totalSaved = useMemo(
        () => goals.reduce((sum, g) => sum + g.currentAmount, 0),
        [goals]
    );

    const totalTarget = useMemo(
        () => goals.reduce((sum, g) => sum + g.targetAmount, 0),
        [goals]
    );

    const overallProgress = useMemo(
        () => (totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0),
        [totalSaved, totalTarget]
    );

    // Add goal
    const addGoal = useCallback(
        async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const goalsRef = collection(db, 'users', userId, 'goals');
                const now = Timestamp.now();

                // Build goal data, filtering undefined values
                const goalData: Record<string, unknown> = {
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    currentAmount: goal.currentAmount || 0,
                    targetDate: Timestamp.fromDate(goal.targetDate),
                    color: goal.color || goalColors[Math.floor(Math.random() * goalColors.length)],
                    createdAt: now,
                    updatedAt: now,
                };

                // Only add icon if defined
                if (goal.icon) {
                    goalData.icon = goal.icon;
                }

                const docRef = await addDoc(goalsRef, goalData);

                return docRef.id;
            } catch (err) {
                console.error('Failed to add goal:', err);
                throw err;
            }
        },
        [userId]
    );

    // Update goal
    const updateGoal = useCallback(
        async (goalId: string, updates: Partial<Goal>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const goalRef = doc(db, 'users', userId, 'goals', goalId);
                const updateData: Record<string, unknown> = {
                    ...updates,
                    updatedAt: Timestamp.now(),
                };

                // Convert Date to Timestamp if present
                if (updates.targetDate) {
                    updateData.targetDate = Timestamp.fromDate(updates.targetDate);
                }

                await updateDoc(goalRef, updateData);
            } catch (err) {
                console.error('Failed to update goal:', err);
                throw err;
            }
        },
        [userId]
    );

    // Delete goal
    const deleteGoal = useCallback(
        async (goalId: string) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const goalRef = doc(db, 'users', userId, 'goals', goalId);
                await deleteDoc(goalRef);
            } catch (err) {
                console.error('Failed to delete goal:', err);
                throw err;
            }
        },
        [userId]
    );

    // Add funds to goal
    const addFunds = useCallback(
        async (goalId: string, amount: number) => {
            if (!userId || !db) throw new Error('User not authenticated');

            const goal = goals.find((g) => g.id === goalId);
            if (!goal) throw new Error('Goal not found');

            const newAmount = goal.currentAmount + amount;
            await updateGoal(goalId, { currentAmount: newAmount });
        },
        [userId, goals, updateGoal]
    );

    // Withdraw funds from goal
    const withdrawFunds = useCallback(
        async (goalId: string, amount: number) => {
            if (!userId || !db) throw new Error('User not authenticated');

            const goal = goals.find((g) => g.id === goalId);
            if (!goal) throw new Error('Goal not found');

            const newAmount = Math.max(0, goal.currentAmount - amount);
            await updateGoal(goalId, { currentAmount: newAmount });
        },
        [userId, goals, updateGoal]
    );

    // Get progress for a goal
    const getProgress = useCallback((goal: Goal) => {
        return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    }, []);

    // Get days left for a goal
    const getDaysLeft = useCallback((goal: Goal) => {
        const now = new Date();
        const diff = Math.ceil(
            (goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff < 0) return 'Overdue';
        if (diff === 0) return 'Due today';
        if (diff === 1) return '1 day left';
        return `${diff} days left`;
    }, []);

    return {
        // Data
        goals,
        isLoading,
        error,

        // Computed
        activeGoals,
        completedGoals,
        totalSaved,
        totalTarget,
        overallProgress,

        // Actions
        addGoal,
        updateGoal,
        deleteGoal,
        addFunds,
        withdrawFunds,

        // Utilities
        getProgress,
        getDaysLeft,
        goalColors,
    };
}
