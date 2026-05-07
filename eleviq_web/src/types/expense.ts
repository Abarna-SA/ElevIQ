import { Timestamp } from 'firebase/firestore';

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'other';
export type FuelType = 'petrol' | 'diesel' | 'cng';
export type ItemUnit = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'pack' | 'dozen';

export const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
    other: 'Other',
};

export const fuelTypeLabels: Record<FuelType, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    cng: 'CNG',
};

export const fuelTypeColors: Record<FuelType, string> = {
    petrol: '#EF4444',
    diesel: '#F59E0B',
    cng: '#22C55E',
};

// =====================================================
// VEHICLE MANAGEMENT
// =====================================================

export interface Vehicle {
    id: string;
    userId: string;
    name: string;                    // e.g., "Honda City", "Activa"
    registrationNumber?: string;     // e.g., "KA-01-AB-1234"
    vehicleType: 'car' | 'bike' | 'scooter' | 'auto' | 'other';
    fuelType: FuelType;
    lastOdometer?: number;
    averageMileage?: number;         // Calculated from fuel history
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateVehicleInput {
    name: string;
    registrationNumber?: string;
    vehicleType: 'car' | 'bike' | 'scooter' | 'auto' | 'other';
    fuelType: FuelType;
}

export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
    id: string;
}

// =====================================================
// EXPENSE ITEMS (Multi-item support)
// =====================================================

export interface ExpenseItem {
    id: string;
    name: string;
    quantity: number;
    unit?: ItemUnit;
    weight?: number;                 // For grocery items
    unitPrice: number;
    subtotal: number;
    // Optional fields for specific categories
    brand?: string;
    size?: string;
    warranty?: string;
    // AI extracted flag
    isAIExtracted?: boolean;
}

// =====================================================
// CATEGORY-SPECIFIC METADATA
// =====================================================

export interface FuelMetadata {
    fuelType: FuelType;
    liters: number;
    ratePerLiter: number;
    odometerReading?: number;
    vehicleId?: string;
    isFullTank?: boolean;
    stationName?: string;
    // Calculated
    distanceSinceLastFill?: number;
    calculatedMileage?: number;
}

export interface FoodMetadata {
    restaurantName?: string;
    tipAmount?: number;
    tipPercent?: number;
    serviceCharge?: number;
    gstAmount?: number;
    gstPercent?: number;
}

export interface HealthcareMetadata {
    prescriptionId?: string;
    doctorName?: string;
    pharmacyName?: string;
    hospitalName?: string;
}

export interface UtilityMetadata {
    providerName?: string;
    unitsConsumed?: number;
    ratePerUnit?: number;
    billingPeriodStart?: Date;
    billingPeriodEnd?: Date;
    meterNumber?: string;
}

export interface ShoppingMetadata {
    storeName?: string;
    brandName?: string;
    warrantyUntil?: Date;
    returnPeriodDays?: number;
}

export interface TransportMetadata {
    fromLocation?: string;
    toLocation?: string;
    distanceKm?: number;
    vehicleType?: string;
    rideId?: string;  // For Uber/Ola receipts
}

export type ExpenseMetadata =
    | { type: 'fuel'; data: FuelMetadata }
    | { type: 'food'; data: FoodMetadata }
    | { type: 'healthcare'; data: HealthcareMetadata }
    | { type: 'utility'; data: UtilityMetadata }
    | { type: 'shopping'; data: ShoppingMetadata }
    | { type: 'transport'; data: TransportMetadata }
    | { type: 'generic'; data: Record<string, unknown> };

// =====================================================
// ENHANCED EXPENSE (Main Interface)
// =====================================================

export interface EnhancedExpense {
    id: string;
    userId: string;
    categoryId: string;
    category: string;

    // Basic info
    vendor: string;                  // Store/station/restaurant name
    description: string;
    date: Date;
    paymentMethod: PaymentMethod;

    // Multi-item support
    items: ExpenseItem[];

    // Totals
    subtotal: number;                // Sum of all items
    discount?: number;
    taxAmount?: number;
    taxPercent?: number;
    amount: number;                  // Final amount paid

    // Category-specific metadata
    metadata?: ExpenseMetadata;

    // Attachments (receipts)
    attachments?: string[];          // URLs to uploaded images
    receiptImageUrl?: string;        // Primary receipt image

    // Additional info
    notes?: string;
    tags?: string[];
    location?: string;

    // AI extraction info
    isAIExtracted?: boolean;
    aiConfidence?: number;           // 0-100 confidence score

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// =====================================================
// CREATE/UPDATE INPUTS
// =====================================================

export interface CreateEnhancedExpenseInput {
    categoryId: string;
    category: string;
    vendor: string;
    description: string;
    date: Date;
    paymentMethod: PaymentMethod;
    items: Omit<ExpenseItem, 'id'>[];
    subtotal: number;
    discount?: number;
    taxAmount?: number;
    taxPercent?: number;
    amount: number;
    metadata?: ExpenseMetadata;
    attachments?: string[];
    receiptImageUrl?: string;
    notes?: string;
    tags?: string[];
    location?: string;
    isAIExtracted?: boolean;
    aiConfidence?: number;
}

export interface UpdateEnhancedExpenseInput extends Partial<CreateEnhancedExpenseInput> {
    id: string;
}

// =====================================================
// LEGACY EXPENSE (Keep for backward compatibility)
// =====================================================

export interface Expense {
    id: string;
    userId: string;
    amount: number;
    category: string;
    categoryId: string;
    description: string;
    date: Date;
    paymentMethod: PaymentMethod;
    notes?: string;
    location?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateExpenseInput {
    amount: number;
    category: string;
    categoryId: string;
    description: string;
    date: Date;
    paymentMethod: PaymentMethod;
    notes?: string;
    location?: string;
    tags?: string[];
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
    id: string;
}

// =====================================================
// CATEGORIES
// =====================================================

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    isDefault: boolean;
    // New: category-specific form type
    formType?: 'grocery' | 'fuel' | 'food' | 'healthcare' | 'utility' | 'shopping' | 'transport' | 'generic';
}

export const defaultCategories: Category[] = [
    { id: 'grocery', name: 'Grocery', icon: '🛒', color: '#22C55E', isDefault: true, formType: 'grocery' },
    { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', isDefault: true, formType: 'food' },
    { id: 'fuel', name: 'Fuel', icon: '⛽', color: '#F59E0B', isDefault: true, formType: 'fuel' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4', isDefault: true, formType: 'transport' },
    { id: 'education', name: 'Education', icon: '📚', color: '#45B7D1', isDefault: true, formType: 'generic' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#F9CA24', isDefault: true, formType: 'generic' },
    { id: 'healthcare', name: 'Healthcare', icon: '💊', color: '#F38181', isDefault: true, formType: 'healthcare' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#AA96DA', isDefault: true, formType: 'shopping' },
    { id: 'utilities', name: 'Utilities', icon: '💡', color: '#95E1D3', isDefault: true, formType: 'utility' },
    { id: 'rent', name: 'Rent/Housing', icon: '🏠', color: '#FDCB6E', isDefault: true, formType: 'generic' },
    { id: 'others', name: 'Others', icon: '📦', color: '#A8E6CF', isDefault: true, formType: 'generic' },
];

// Helper to find category by ID
export const getCategoryById = (id: string): Category | undefined => {
    return defaultCategories.find((c) => c.id === id);
};

// =====================================================
// FIRESTORE CONVERTERS
// =====================================================

export const expenseFromFirestore = (doc: any): Expense => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        category: data.category,
        categoryId: data.categoryId,
        description: data.description,
        date: data.date.toDate(),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        location: data.location,
        tags: data.tags,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    };
};

export const enhancedExpenseFromFirestore = (doc: any): EnhancedExpense => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        categoryId: data.categoryId,
        category: data.category,
        vendor: data.vendor,
        description: data.description,
        date: data.date.toDate(),
        paymentMethod: data.paymentMethod,
        items: data.items || [],
        subtotal: data.subtotal,
        discount: data.discount,
        taxAmount: data.taxAmount,
        taxPercent: data.taxPercent,
        amount: data.amount,
        metadata: data.metadata,
        attachments: data.attachments,
        receiptImageUrl: data.receiptImageUrl,
        notes: data.notes,
        tags: data.tags,
        location: data.location,
        isAIExtracted: data.isAIExtracted,
        aiConfidence: data.aiConfidence,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    };
};

export const vehicleFromFirestore = (doc: any): Vehicle => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        registrationNumber: data.registrationNumber,
        vehicleType: data.vehicleType,
        fuelType: data.fuelType,
        lastOdometer: data.lastOdometer,
        averageMileage: data.averageMileage,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
    };
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const calculateItemSubtotal = (item: Partial<ExpenseItem>): number => {
    const qty = item.quantity || 1;
    const price = item.unitPrice || 0;
    return qty * price;
};

export const calculateExpenseTotal = (
    items: ExpenseItem[],
    discount?: number,
    taxPercent?: number
): { subtotal: number; taxAmount: number; total: number } => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = discount || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = taxPercent ? (afterDiscount * taxPercent) / 100 : 0;
    const total = afterDiscount + taxAmount;

    return { subtotal, taxAmount, total };
};

export const generateItemId = (): string => {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
