import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/auth-store';
import { Vehicle } from '@/domain/models';

export function useVehiclesSubscription() {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', user.uid),
      where('deletedAt', '==', null)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as Vehicle[];
        
        setVehicles(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching vehicles:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return { vehicles, isLoading, error };
}
