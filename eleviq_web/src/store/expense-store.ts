import { create } from 'zustand';
import { Expense } from '@/types/expense';
import {
    getExpenses,
    addExpense as addExpenseApi,
    updateExpense as updateExpenseApi,
    deleteExpense as deleteExpenseApi,
    subscribeToExpenses,
    getCurrentMonthTotal,
    getCategoryTotals,
} from '@/lib/firebase/expenses';
import { CreateExpenseInput, UpdateExpenseInput } from '@/types/expense';

interface ExpenseState {
    expenses: Expense[];
    isLoading: boolean;
    error: string | null;
    monthlyTotal: number;
    categoryTotals: Record<string, number>;

    // Actions
    fetchExpenses: () => Promise<void>;
    addExpense: (input: CreateExpenseInput) => Promise<string>;
    updateExpense: (input: UpdateExpenseInput) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    subscribeToUpdates: () => () => void;
    fetchStats: () => Promise<void>;
    clearError: () => void;
}

// ⚠️ STRIPPED OF PERSIST MIDDLEWARE. Data exists ONLY in memory and Firebase.
export const useExpenseStore = create<ExpenseState>((set, get) => ({
    expenses: [],
    isLoading: false,
    error: null,
    monthlyTotal: 0,
    categoryTotals: {},

    fetchExpenses: async () => {
        set({ isLoading: true, error: null });
        try {
            const expenses = await getExpenses();
            set({ expenses, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addExpense: async (input: CreateExpenseInput) => {
        set({ isLoading: true, error: null });
        try {
            const id = await addExpenseApi(input);
            await get().fetchExpenses();
            await get().fetchStats();
            set({ isLoading: false });
            return id;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateExpense: async (input: UpdateExpenseInput) => {
        set({ isLoading: true, error: null });
        try {
            await updateExpenseApi(input);
            await get().fetchExpenses();
            await get().fetchStats();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteExpense: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await deleteExpenseApi(id);
            set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id),
                isLoading: false,
            }));
            await get().fetchStats();
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    subscribeToUpdates: () => {
        return subscribeToExpenses((expenses) => {
            set({ expenses });
        });
    },

    fetchStats: async () => {
        try {
            const [monthlyTotal, categoryTotals] = await Promise.all([
                getCurrentMonthTotal(),
                getCategoryTotals(),
            ]);
            set({ monthlyTotal, categoryTotals });
        } catch (error: any) {
            console.error('Failed to fetch stats:', error);
        }
    },

    clearError: () => set({ error: null }),
}));
