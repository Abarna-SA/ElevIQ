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
    EnhancedExpense,
    CreateEnhancedExpenseInput,
    UpdateEnhancedExpenseInput,
    enhancedExpenseFromFirestore,
} from '@/types/expense';

const EXPENSES_COLLECTION = 'expenses'; // We use the main expenses collection

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

// Add a new enhanced expense
export async function addEnhancedExpense(input: Omit<EnhancedExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const now = new Date();
    const data = {
        ...input,
        userId,
        date: Timestamp.fromDate(new Date(input.date)),
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

// Update an existing enhanced expense
export async function updateEnhancedExpense(input: UpdateEnhancedExpenseInput): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { id, ...updateData } = input;
    const docRef = doc(getFirestore(), EXPENSES_COLLECTION, id);

    const data = {
        ...updateData,
        ...(updateData.date && { date: Timestamp.fromDate(new Date(updateData.date)) }),
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

// Delete an enhanced expense
export async function deleteEnhancedExpense(expenseId: string): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), EXPENSES_COLLECTION, expenseId);
    await deleteDoc(docRef);
}

// Get all enhanced expenses for current user
export async function getEnhancedExpenses(): Promise<EnhancedExpense[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const q = query(
        getExpensesRef(),
        where('userId', '==', userId),
        orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(enhancedExpenseFromFirestore);
}

// Subscribe to enhanced expenses (real-time)
export function subscribeToEnhancedExpenses(
    callback: (expenses: EnhancedExpense[]) => void
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
        const expenses = snapshot.docs.map(enhancedExpenseFromFirestore);
        callback(expenses);
    });
}
