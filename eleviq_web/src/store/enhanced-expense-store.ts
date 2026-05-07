'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    EnhancedExpense,
    CreateEnhancedExpenseInput,
    UpdateEnhancedExpenseInput,
    generateItemId,
} from '@/types/expense';
import {
    addEnhancedExpense as addExpenseApi,
    updateEnhancedExpense as updateExpenseApi,
    deleteEnhancedExpense as deleteExpenseApi,
    getEnhancedExpenses,
    subscribeToEnhancedExpenses,
} from '@/lib/firebase/enhanced-expenses';

interface EnhancedExpenseState {
    expenses: EnhancedExpense[];
    isLoading: boolean;
    error: string | null;

    // Stats
    monthlyTotal: number;
    categoryTotals: Record<string, number>;

    // Actions
    fetchExpenses: () => Promise<void>;
    subscribeToUpdates: () => () => void;
    addExpense: (input: CreateEnhancedExpenseInput) => Promise<string>;
    updateExpense: (input: UpdateEnhancedExpenseInput) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    getExpenseById: (id: string) => EnhancedExpense | undefined;

    // Batch operations
    addMultipleExpenses: (inputs: CreateEnhancedExpenseInput[]) => Promise<string[]>;

    // Stats
    fetchStats: () => void;
    getExpensesByCategory: (categoryId: string) => EnhancedExpense[];
    getExpensesByDateRange: (start: Date, end: Date) => EnhancedExpense[];
    getExpensesByVendor: (vendor: string) => EnhancedExpense[];

    clearError: () => void;
}

const generateId = () => `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useEnhancedExpenseStore = create<EnhancedExpenseState>((set, get) => ({
    expenses: [],
    isLoading: false,
    error: null,
    monthlyTotal: 0,
    categoryTotals: {},

    fetchExpenses: async () => {
        set({ isLoading: true, error: null });
        try {
            const expenses = await getEnhancedExpenses();
            set({ expenses, isLoading: false });
            get().fetchStats();
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    subscribeToUpdates: () => {
        return subscribeToEnhancedExpenses((expenses) => {
            set({ expenses });
            get().fetchStats();
        });
    },

    addExpense: async (input: CreateEnhancedExpenseInput) => {
        set({ isLoading: true, error: null });
        try {
            // Process items with IDs
            const itemsWithIds = input.items.map((item) => ({
                ...item,
                id: generateItemId(),
            }));

            const expenseData = {
                categoryId: input.categoryId,
                category: input.category,
                vendor: input.vendor,
                description: input.description,
                date: input.date,
                paymentMethod: input.paymentMethod,
                items: itemsWithIds,
                subtotal: input.subtotal,
                discount: input.discount,
                taxAmount: input.taxAmount,
                taxPercent: input.taxPercent,
                amount: input.amount,
                metadata: input.metadata,
                attachments: input.attachments,
                receiptImageUrl: input.receiptImageUrl,
                notes: input.notes,
                tags: input.tags,
                location: input.location,
                isAIExtracted: input.isAIExtracted,
                aiConfidence: input.aiConfidence,
            };

            const id = await addExpenseApi(expenseData);
            await get().fetchExpenses();
            return id;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateExpense: async (input: UpdateEnhancedExpenseInput) => {
        set({ isLoading: true, error: null });
        try {
            let processedItems = input.items as any;
            if (input.items) {
                processedItems = input.items.map((item: any) => ({
                    ...item,
                    id: item.id || generateItemId(),
                }));
            }

            await updateExpenseApi({
                ...input,
                items: processedItems,
            });

            await get().fetchExpenses();
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
            get().fetchStats();
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    getExpenseById: (id: string) => {
        return get().expenses.find((e) => e.id === id);
    },

    addMultipleExpenses: async (inputs: CreateEnhancedExpenseInput[]) => {
        set({ isLoading: true, error: null });
        const ids: string[] = [];
        try {
            for (const input of inputs) {
                const itemsWithIds = input.items.map((item) => ({
                    ...item,
                    id: generateItemId(),
                }));

                const expenseData = {
                    categoryId: input.categoryId,
                    category: input.category,
                    vendor: input.vendor,
                    description: input.description,
                    date: input.date,
                    paymentMethod: input.paymentMethod,
                    items: itemsWithIds,
                    subtotal: input.subtotal,
                    discount: input.discount,
                    taxAmount: input.taxAmount,
                    taxPercent: input.taxPercent,
                    amount: input.amount,
                    metadata: input.metadata,
                    attachments: input.attachments,
                    receiptImageUrl: input.receiptImageUrl,
                    notes: input.notes,
                    tags: input.tags,
                    location: input.location,
                    isAIExtracted: input.isAIExtracted,
                    aiConfidence: input.aiConfidence,
                };
                const id = await addExpenseApi(expenseData);
                ids.push(id);
            }
            await get().fetchExpenses();
            return ids;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    fetchStats: () => {
        const expenses = get().expenses;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Monthly total
        const monthlyTotal = expenses
            .filter((e) => new Date(e.date) >= startOfMonth)
            .reduce((sum, e) => sum + e.amount, 0);

        // Category totals
        const categoryTotals: Record<string, number> = {};
        expenses.forEach((e) => {
            categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
        });

        set({ monthlyTotal, categoryTotals });
    },

    getExpensesByCategory: (categoryId: string) => {
        return get().expenses.filter((e) => e.categoryId === categoryId);
    },

    getExpensesByDateRange: (start: Date, end: Date) => {
        return get().expenses.filter((e) => {
            const date = new Date(e.date);
            return date >= start && date <= end;
        });
    },

    getExpensesByVendor: (vendor: string) => {
        return get().expenses.filter((e) =>
            e.vendor.toLowerCase().includes(vendor.toLowerCase())
        );
    },

    clearError: () => set({ error: null }),
}));

// Helper hooks
export const useEnhancedExpenses = () => useEnhancedExpenseStore((state) => state.expenses);
export const useMonthlyTotal = () => useEnhancedExpenseStore((state) => state.monthlyTotal);
export const useCategoryTotals = () => useEnhancedExpenseStore((state) => state.categoryTotals);
