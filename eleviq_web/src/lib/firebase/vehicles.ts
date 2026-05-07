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
import { Vehicle, CreateVehicleInput, UpdateVehicleInput, FuelType } from '@/types/expense';

const VEHICLES_COLLECTION = 'vehicles';

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

// Get vehicles collection reference
const getVehiclesRef = () => collection(getFirestore(), VEHICLES_COLLECTION);

// Get current user ID
const getCurrentUserId = (): string | null => {
    try {
        return getAuth().currentUser?.uid ?? null;
    } catch {
        return null;
    }
};

// Convert Firestore doc to Vehicle
const vehicleFromFirestore = (docSnapshot: any): Vehicle => {
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        userId: data.userId,
        name: data.name,
        registrationNumber: data.registrationNumber,
        vehicleType: data.vehicleType,
        fuelType: data.fuelType,
        make: data.make,
        model: data.model,
        year: data.year,
        lastOdometer: data.lastOdometer,
        averageMileage: data.averageMileage,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Vehicle;
};

// Add a new vehicle
export async function addVehicle(input: CreateVehicleInput): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const now = new Date();
    const docRef = await addDoc(getVehiclesRef(), {
        ...input,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
    });

    return docRef.id;
}

// Update an existing vehicle
export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), VEHICLES_COLLECTION, id);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
    });
}

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(getFirestore(), VEHICLES_COLLECTION, id);
    await deleteDoc(docRef);
}

// Get all vehicles for current user
export async function getVehicles(): Promise<Vehicle[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const q = query(
        getVehiclesRef(),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(vehicleFromFirestore);
}

// Get vehicles by fuel type
export async function getVehiclesByFuelType(fuelType: FuelType): Promise<Vehicle[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const q = query(
        getVehiclesRef(),
        where('userId', '==', userId),
        where('fuelType', '==', fuelType),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(vehicleFromFirestore);
}

// Subscribe to vehicles (real-time)
export function subscribeToVehicles(
    callback: (vehicles: Vehicle[]) => void
): () => void {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    const q = query(
        getVehiclesRef(),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const vehicles = snapshot.docs.map(vehicleFromFirestore);
        callback(vehicles);
    });
}
