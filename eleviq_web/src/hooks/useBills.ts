'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/lib/firebase/config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    onSnapshot,
    orderBy,
    query,
} from 'firebase/firestore';
import { Bill, BillPaymentHistory } from '@/types/bills';
import { addDays, isBefore, isToday, differenceInDays, isSameDay, parseISO, startOfDay } from 'date-fns';

/**
 * Hook for managing user's bills
 * Data is stored in Firestore subcollection: /users/{userId}/bills
 * Payment history is stored in: /users/{userId}/billPayments
 */
export function useBills() {
    const { user } = useAuthStore();
    const [bills, setBills] = useState<Bill[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<BillPaymentHistory[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get user ID from auth store
    const userId = user?.uid;

    // Subscribe to bills collection
    useEffect(() => {
        if (!userId || !db) {
            setBills([]);
            setIsLoaded(true);
            return;
        }

        const billsRef = collection(db, 'users', userId, 'bills');
        const billsQuery = query(billsRef, orderBy('dueDate', 'asc'));

        const unsubscribe = onSnapshot(
            billsQuery,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Bill[];
                setBills(data);
                setIsLoaded(true);
                setError(null);
            },
            (err) => {
                console.error('Error fetching bills:', err);
                setError('Failed to load bills');
                setIsLoaded(true);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Subscribe to payment history collection
    useEffect(() => {
        if (!userId || !db) {
            setPaymentHistory([]);
            return;
        }

        const historyRef = collection(db, 'users', userId, 'billPayments');
        const historyQuery = query(historyRef, orderBy('paidDate', 'desc'));

        const unsubscribe = onSnapshot(
            historyQuery,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as BillPaymentHistory[];
                setPaymentHistory(data);
            },
            (err) => {
                console.error('Error fetching payment history:', err);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Add a new bill
    const addBill = useCallback(
        async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'isPaid'>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const billsRef = collection(db, 'users', userId, 'bills');
                const now = new Date().toISOString();

                // Filter out undefined values (Firestore doesn't accept undefined)
                const billData = Object.fromEntries(
                    Object.entries({
                        ...bill,
                        isPaid: false,
                        createdAt: now,
                        updatedAt: now,
                    }).filter(([, v]) => v !== undefined)
                );

                const docRef = await addDoc(billsRef, billData);

                return { id: docRef.id, ...bill, isPaid: false, createdAt: now, updatedAt: now } as Bill;
            } catch (err) {
                console.error('Failed to add bill:', err);
                throw err;
            }
        },
        [userId]
    );

    // Update an existing bill
    const updateBill = useCallback(
        async (id: string, updates: Partial<Bill>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const billRef = doc(db, 'users', userId, 'bills', id);
                await updateDoc(billRef, {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                });
            } catch (err) {
                console.error('Failed to update bill:', err);
                throw err;
            }
        },
        [userId]
    );

    // Delete a bill
    const deleteBill = useCallback(
        async (id: string) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const billRef = doc(db, 'users', userId, 'bills', id);
                await deleteDoc(billRef);
            } catch (err) {
                console.error('Failed to delete bill:', err);
                throw err;
            }
        },
        [userId]
    );

    // Mark a bill as paid
    const markAsPaid = useCallback(
        async (id: string, paidAmount?: number, paidDate?: string) => {
            if (!userId || !db) throw new Error('User not authenticated');

            const bill = bills.find((b) => b.id === id);
            if (!bill) return;

            const now = paidDate || new Date().toISOString();

            try {
                // Add to payment history
                const historyRef = collection(db, 'users', userId, 'billPayments');
                await addDoc(historyRef, {
                    billId: id,
                    amount: paidAmount || bill.amount,
                    paidDate: now,
                    dueDate: bill.dueDate,
                    onTime: !isBefore(parseISO(bill.dueDate), startOfDay(new Date())),
                });

                // Update bill status
                const billRef = doc(db, 'users', userId, 'bills', id);
                await updateDoc(billRef, {
                    isPaid: true,
                    paidDate: now,
                    paidAmount: paidAmount || bill.amount,
                    updatedAt: now,
                });
            } catch (err) {
                console.error('Failed to mark bill as paid:', err);
                throw err;
            }
        },
        [userId, bills]
    );

    // Mark a bill as unpaid
    const markAsUnpaid = useCallback(
        async (id: string) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const billRef = doc(db, 'users', userId, 'bills', id);
                await updateDoc(billRef, {
                    isPaid: false,
                    paidDate: null,
                    paidAmount: null,
                    updatedAt: new Date().toISOString(),
                });
            } catch (err) {
                console.error('Failed to mark bill as unpaid:', err);
                throw err;
            }
        },
        [userId]
    );

    // Toggle paid status
    const togglePaid = useCallback(
        async (id: string) => {
            const bill = bills.find((b) => b.id === id);
            if (!bill) return;

            if (bill.isPaid) {
                await markAsUnpaid(id);
            } else {
                await markAsPaid(id);
            }
        },
        [bills, markAsPaid, markAsUnpaid]
    );

    // Get bills for a specific day
    const getBillsForDay = useCallback(
        (day: Date) => {
            return bills.filter((bill) => isSameDay(parseISO(bill.dueDate), day));
        },
        [bills]
    );

    // Get payment history for a bill
    const getBillPaymentHistory = useCallback(
        (billId: string) => {
            return paymentHistory
                .filter((p) => p.billId === billId)
                .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
        },
        [paymentHistory]
    );

    // Computed values
    const today = useMemo(() => startOfDay(new Date()), []);

    const upcomingBills = useMemo(() => {
        return bills
            .filter((b) => !b.isPaid && isBefore(parseISO(b.dueDate), addDays(today, 30)))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [bills, today]);

    const overdueBills = useMemo(() => {
        return bills.filter(
            (b) => !b.isPaid && isBefore(parseISO(b.dueDate), today) && !isToday(parseISO(b.dueDate))
        );
    }, [bills, today]);

    const paidBillsThisMonth = useMemo(() => {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return bills.filter((b) => b.isPaid && b.paidDate && new Date(b.paidDate) >= monthStart);
    }, [bills, today]);

    const totalDue = useMemo(() => {
        return upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    }, [upcomingBills]);

    const totalPaidThisMonth = useMemo(() => {
        return paidBillsThisMonth.reduce((sum, b) => sum + (b.paidAmount || b.amount), 0);
    }, [paidBillsThisMonth]);

    const billsDueSoon = useMemo(() => {
        return bills.filter((b) => {
            if (b.isPaid) return false;
            const daysUntil = differenceInDays(parseISO(b.dueDate), today);
            return daysUntil >= 0 && daysUntil <= 7;
        });
    }, [bills, today]);

    // Get due status for a bill
    const getDueStatus = useCallback(
        (bill: Bill): 'paid' | 'overdue' | 'today' | 'soon' | 'upcoming' => {
            if (bill.isPaid) return 'paid';
            const dueDate = parseISO(bill.dueDate);
            if (isToday(dueDate)) return 'today';
            const daysUntil = differenceInDays(dueDate, today);
            if (daysUntil < 0) return 'overdue';
            if (daysUntil <= 3) return 'soon';
            return 'upcoming';
        },
        [today]
    );

    return {
        bills,
        isLoaded,
        error,

        // Actions
        addBill,
        updateBill,
        deleteBill,
        markAsPaid,
        markAsUnpaid,
        togglePaid,

        // Queries
        getBillsForDay,
        getBillPaymentHistory,
        getDueStatus,

        // Computed
        upcomingBills,
        overdueBills,
        paidBillsThisMonth,
        billsDueSoon,
        totalDue,
        totalPaidThisMonth,
    };
}
