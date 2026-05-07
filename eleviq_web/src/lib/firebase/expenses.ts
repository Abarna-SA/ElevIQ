import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot,
    Timestamp,
    Firestore,
} from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { db, auth } from './config';
import {
    Expense,
    CreateExpenseInput,
    UpdateExpenseInput,
    expenseFromFirestore,
} from '@/types/expense';

const EXPENSES_COLLECTION = 'expenses';

// Helper to ensure db is available
const getFirestore = (): Firestore => {
    if (!db) throw new Error('Firestore not initialized');
    return db;
};

// Helper to ensure auth is available
const getAuth = (): Auth => {
    if (!auth) throw new Error('Auth not initialized');
    return auth;
};

// Get expenses collection reference
const getExpensesRef = () => collection(getFirestore(), EXPENSES_COLLECTION);

// Get current user ID
const getCurrentUserId = (): string | null => {
    try {
        return getAuth().currentUser?.uid ?? null;
    } catch {
        return null;
    }
};

// Add a new expense
export async function addExpense(input: CreateExpenseInput): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const now = new Date();
    const data = {
        ...input,
        userId,
        date: Timestamp.fromDate(input.date),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
    };

    // Remove undefined values
    Object.keys(data).forEach(key => {
        if ((data as any)[key] === undefined) {
            delete (data as any)[key];
        }
    });

    const docRef = await addDoc(getExpensesRef(), data);

    return docRef.id;
}

// Update an existing expense
export async function updateExpense(input: UpdateExpenseInput): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { id, ...updateData } = input;
    const docRef = doc(getFirestore(), EXPENSES_COLLECTION, id);

    const data = {
        ...updateData,
        ...(updateData.date && { date: Timestamp.fromDate(updateData.date) }),
        updatedAt: Timestamp.fromDate(new Date()),
    };

    // Remove undefined values
    Object.keys(data).forEach(key => {
        if ((data as any)[key] === undefined) {
            delete (data as any)[key];
        }
    });

    await updateDoc(docRef, data);
}

// Delete an expense
export async function deleteExpense(expenseId: string): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), EXPENSES_COLLECTION, expenseId);
    await deleteDoc(docRef);
}

// Get all expenses for current user
export async function getExpenses(): Promise<Expense[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const q = query(
        getExpensesRef(),
        where('userId', '==', userId),
        orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(expenseFromFirestore);
}

// Get expenses for a specific month
export async function getMonthlyExpenses(
    year: number,
    month: number
): Promise<Expense[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const q = query(
        getExpensesRef(),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        where('date', '<=', Timestamp.fromDate(endOfMonth)),
        orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(expenseFromFirestore);
}

// Get expenses by category
export async function getExpensesByCategory(
    categoryId: string
): Promise<Expense[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const q = query(
        getExpensesRef(),
        where('userId', '==', userId),
        where('categoryId', '==', categoryId),
        orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(expenseFromFirestore);
}

// Get total expenses for current month
export async function getCurrentMonthTotal(): Promise<number> {
    const now = new Date();
    const expenses = await getMonthlyExpenses(now.getFullYear(), now.getMonth() + 1);
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

// Get category-wise totals for current month
export async function getCategoryTotals(): Promise<Record<string, number>> {
    const now = new Date();
    const expenses = await getMonthlyExpenses(now.getFullYear(), now.getMonth() + 1);

    const totals: Record<string, number> = {};
    for (const expense of expenses) {
        totals[expense.categoryId] = (totals[expense.categoryId] || 0) + expense.amount;
    }

    return totals;
}

// Subscribe to expenses (real-time)
export function subscribeToExpenses(
    callback: (expenses: Expense[]) => void
): () => void {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    const q = query(
        getExpensesRef(),
        where('userId', '==', userId),
        orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(expenseFromFirestore);
        callback(expenses);
    });
}
