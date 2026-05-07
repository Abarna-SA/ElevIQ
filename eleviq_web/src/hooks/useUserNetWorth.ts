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
} from 'firebase/firestore';
import {
    type Asset,
    type Liability,
    type AssetCategory,
    type LiabilityCategory
} from '@/types/networth';

// Re-export types for backward compatibility
export type { Asset, Liability, AssetCategory, LiabilityCategory };

export interface NetWorthHistory {
    date: Date;
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
}

/**
 * Hook for managing user's net worth data (assets and liabilities)
 * Data is stored in Firestore subcollections: /users/{userId}/assets and /users/{userId}/liabilities
 */
export function useUserNetWorth() {
    const { user } = useAuthStore();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get user ID from auth store
    const userId = user?.uid;

    // Subscribe to assets collection
    useEffect(() => {
        if (!userId || !db) {
            setAssets([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const assetsRef = collection(db, 'users', userId, 'assets');

        const unsubscribe = onSnapshot(
            assetsRef,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                })) as Asset[];
                setAssets(data);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching assets:', err);
                setError('Failed to load assets');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Subscribe to liabilities collection
    useEffect(() => {
        if (!userId || !db) {
            setLiabilities([]);
            return;
        }

        const liabilitiesRef = collection(db, 'users', userId, 'liabilities');

        const unsubscribe = onSnapshot(
            liabilitiesRef,
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                })) as Liability[];
                setLiabilities(data);
                setError(null);
            },
            (err) => {
                console.error('Error fetching liabilities:', err);
                setError('Failed to load liabilities');
            }
        );

        return () => unsubscribe();
    }, [userId]);

    // Computed values
    const totalAssets = useMemo(
        () => assets.reduce((sum, a) => sum + a.value, 0),
        [assets]
    );

    const totalLiabilities = useMemo(
        () => liabilities.reduce((sum, l) => sum + l.value, 0),
        [liabilities]
    );

    const netWorth = useMemo(
        () => totalAssets - totalLiabilities,
        [totalAssets, totalLiabilities]
    );

    // Assets by category
    const assetsByCategory = useMemo(() => {
        const grouped: Record<string, number> = {};
        assets.forEach((a) => {
            grouped[a.category] = (grouped[a.category] || 0) + a.value;
        });
        return grouped;
    }, [assets]);

    // Liabilities by category
    const liabilitiesByCategory = useMemo(() => {
        const grouped: Record<string, number> = {};
        liabilities.forEach((l) => {
            grouped[l.category] = (grouped[l.category] || 0) + l.value;
        });
        return grouped;
    }, [liabilities]);

    // Add asset
    const addAsset = useCallback(
        async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const assetsRef = collection(db, 'users', userId, 'assets');
                const now = Timestamp.now();

                // Filter out undefined values (Firestore doesn't accept undefined)
                const cleanAsset = Object.fromEntries(
                    Object.entries(asset).filter(([, v]) => v !== undefined)
                );

                const docRef = await addDoc(assetsRef, {
                    ...cleanAsset,
                    createdAt: now,
                    updatedAt: now,
                });

                return docRef.id;
            } catch (err) {
                console.error('Failed to add asset:', err);
                throw err;
            }
        },
        [userId]
    );

    // Update asset
    const updateAsset = useCallback(
        async (assetId: string, updates: Partial<Asset>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const assetRef = doc(db, 'users', userId, 'assets', assetId);
                await updateDoc(assetRef, {
                    ...updates,
                    updatedAt: Timestamp.now(),
                });
            } catch (err) {
                console.error('Failed to update asset:', err);
                throw err;
            }
        },
        [userId]
    );

    // Delete asset
    const deleteAsset = useCallback(
        async (assetId: string) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const assetRef = doc(db, 'users', userId, 'assets', assetId);
                await deleteDoc(assetRef);
            } catch (err) {
                console.error('Failed to delete asset:', err);
                throw err;
            }
        },
        [userId]
    );

    // Add liability
    const addLiability = useCallback(
        async (liability: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const liabilitiesRef = collection(db, 'users', userId, 'liabilities');
                const now = Timestamp.now();

                // Filter out undefined values (Firestore doesn't accept undefined)
                const cleanLiability = Object.fromEntries(
                    Object.entries(liability).filter(([, v]) => v !== undefined)
                );

                const docRef = await addDoc(liabilitiesRef, {
                    ...cleanLiability,
                    createdAt: now,
                    updatedAt: now,
                });

                return docRef.id;
            } catch (err) {
                console.error('Failed to add liability:', err);
                throw err;
            }
        },
        [userId]
    );

    // Update liability
    const updateLiability = useCallback(
        async (liabilityId: string, updates: Partial<Liability>) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const liabilityRef = doc(db, 'users', userId, 'liabilities', liabilityId);
                await updateDoc(liabilityRef, {
                    ...updates,
                    updatedAt: Timestamp.now(),
                });
            } catch (err) {
                console.error('Failed to update liability:', err);
                throw err;
            }
        },
        [userId]
    );

    // Delete liability
    const deleteLiability = useCallback(
        async (liabilityId: string) => {
            if (!userId || !db) throw new Error('User not authenticated');

            try {
                const liabilityRef = doc(db, 'users', userId, 'liabilities', liabilityId);
                await deleteDoc(liabilityRef);
            } catch (err) {
                console.error('Failed to delete liability:', err);
                throw err;
            }
        },
        [userId]
    );

    return {
        // Data
        assets,
        liabilities,
        isLoading,
        error,

        // Computed
        totalAssets,
        totalLiabilities,
        netWorth,
        assetsByCategory,
        liabilitiesByCategory,

        // Actions
        addAsset,
        updateAsset,
        deleteAsset,
        addLiability,
        updateLiability,
        deleteLiability,
    };
}
