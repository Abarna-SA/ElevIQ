'use client';

import { create } from 'zustand';
import { Vehicle, CreateVehicleInput, FuelType } from '@/types/expense';
import {
    addVehicle as addVehicleApi,
    updateVehicle as updateVehicleApi,
    deleteVehicle as deleteVehicleApi,
    getVehicles,
    subscribeToVehicles,
} from '@/lib/firebase/vehicles';

interface VehicleState {
    vehicles: Vehicle[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchVehicles: () => Promise<void>;
    subscribeToUpdates: () => () => void;
    addVehicle: (input: CreateVehicleInput) => Promise<string>;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
    getVehicleById: (id: string) => Vehicle | undefined;
    updateOdometer: (vehicleId: string, odometer: number, mileage?: number) => Promise<void>;
    clearError: () => void;
}

// ⚠️ STRIPPED OF PERSIST MIDDLEWARE. Data exists ONLY in memory and Firestore.
export const useVehicleStore = create<VehicleState>()((set, get) => ({
    vehicles: [],
    isLoading: false,
    error: null,

    fetchVehicles: async () => {
        set({ isLoading: true, error: null });
        try {
            const vehicles = await getVehicles();
            set({ vehicles, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    subscribeToUpdates: () => {
        return subscribeToVehicles((vehicles) => {
            set({ vehicles });
        });
    },

    addVehicle: async (input: CreateVehicleInput) => {
        set({ isLoading: true, error: null });
        try {
            const id = await addVehicleApi(input);
            await get().fetchVehicles();
            set({ isLoading: false });
            return id;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateVehicle: async (id: string, updates: Partial<Vehicle>) => {
        set({ isLoading: true, error: null });
        try {
            await updateVehicleApi(id, updates);
            await get().fetchVehicles();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteVehicle: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await deleteVehicleApi(id);
            set((state) => ({
                vehicles: state.vehicles.filter((v) => v.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    getVehicleById: (id: string) => {
        return get().vehicles.find((v) => v.id === id);
    },

    updateOdometer: async (vehicleId: string, odometer: number, mileage?: number) => {
        set({ isLoading: true, error: null });
        try {
            await updateVehicleApi(vehicleId, {
                lastOdometer: odometer,
                ...(mileage !== undefined && { averageMileage: mileage }),
            });
            await get().fetchVehicles();
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

// Helper hooks
export const useVehicles = () => useVehicleStore((state) => state.vehicles);
export const useVehiclesByFuelType = (fuelType: FuelType) =>
    useVehicleStore((state) => state.vehicles.filter((v) => v.fuelType === fuelType));
