// Net Worth Types - Comprehensive TypeScript interfaces

export type AssetCategory = 'cash' | 'investments' | 'property' | 'vehicles' | 'gold' | 'other';
export type LiabilityCategory = 'loans' | 'credit_cards' | 'emi' | 'other';

export interface Asset {
    id: string;
    name: string;
    category: AssetCategory;
    value: number;
    purchaseValue?: number;
    purchaseDate?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Liability {
    id: string;
    name: string;
    category: LiabilityCategory;
    value: number;
    originalAmount?: number;
    interestRate?: number;
    emiAmount?: number;
    tenureMonths?: number;
    startDate?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface NetWorthSnapshot {
    id: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    snapshotDate: Date;
    createdAt: Date;
}

export interface AssetCategoryInfo {
    id: AssetCategory;
    name: string;
    icon: string;
    color: string;
}

export interface LiabilityCategoryInfo {
    id: LiabilityCategory;
    name: string;
    icon: string;
    color: string;
}

export const ASSET_CATEGORIES: AssetCategoryInfo[] = [
    { id: 'cash', name: 'Cash & Savings', icon: 'Wallet', color: '#10B981' },
    { id: 'investments', name: 'Investments', icon: 'TrendingUp', color: '#6366F1' },
    { id: 'property', name: 'Property', icon: 'Home', color: '#F59E0B' },
    { id: 'vehicles', name: 'Vehicles', icon: 'Car', color: '#8B5CF6' },
    { id: 'gold', name: 'Gold & Jewelry', icon: 'Gem', color: '#EAB308' },
    { id: 'other', name: 'Other Assets', icon: 'Briefcase', color: '#64748B' },
];

export const LIABILITY_CATEGORIES: LiabilityCategoryInfo[] = [
    { id: 'loans', name: 'Loans', icon: 'Building', color: '#EF4444' },
    { id: 'credit_cards', name: 'Credit Cards', icon: 'CreditCard', color: '#F97316' },
    { id: 'emi', name: 'EMIs', icon: 'Calendar', color: '#EC4899' },
    { id: 'other', name: 'Other Debts', icon: 'Wallet', color: '#64748B' },
];

export interface NetWorthStats {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    debtToAssetRatio: number;
    liquidAssets: number;
    monthlyGrowth: number;
    monthlyGrowthPercent: number;
    healthScore: number;
}

export interface AssetsByCategory {
    [key: string]: {
        total: number;
        percentage: number;
        items: Asset[];
    };
}

export interface LiabilitiesByCategory {
    [key: string]: {
        total: number;
        percentage: number;
        items: Liability[];
    };
}
