import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/auth-store';
import { Expense } from '@/domain/models';

export function useExpensesSubscription() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      where('deletedAt', '==', null),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Expense[];
        
        setExpenses(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return { expenses, isLoading, error };
}
