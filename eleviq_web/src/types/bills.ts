// Bill Categories with icons and colors
export type BillCategory = 'rent' | 'utilities' | 'subscription' | 'emi' | 'insurance' | 'mobile' | 'internet' | 'education' | 'health' | 'other';

export type BillFrequency = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cash' | 'other';

export interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: string; // ISO date string for localStorage compatibility
    category: BillCategory;
    frequency: BillFrequency;

    // Provider details
    provider?: string;
    accountNumber?: string;

    // Payment settings
    autopay: boolean;
    paymentMethod?: PaymentMethod;

    // Notes & attachments
    notes?: string;

    // Reminder settings
    reminder: boolean;
    reminderDays: number[]; // [1, 3, 7] = remind 1, 3, 7 days before

    // Status tracking
    isPaid: boolean;
    paidDate?: string;
    paidAmount?: number;

    // Recurring tracking
    isVariableAmount: boolean; // Amount changes each cycle
    dayOfMonth?: number; // For monthly bills, which day (1-31)

    // Metadata
    createdAt: string;
    updatedAt: string;
}

export interface BillPaymentHistory {
    id: string;
    billId: string;
    amount: number;
    paidDate: string;
    dueDate: string;
    onTime: boolean;
}

export interface BillTemplate {
    id: string;
    name: string;
    category: BillCategory;
    icon: string;
    defaultFrequency: BillFrequency;
    suggestedProvider?: string;
    suggestedAmount?: number;
}

// Category definitions with icons and colors
export const billCategories: { id: BillCategory; name: string; icon: string; color: string }[] = [
    { id: 'rent', name: 'Rent', icon: 'Home', color: '#6366F1' },
    { id: 'utilities', name: 'Utilities', icon: 'Zap', color: '#F59E0B' },
    { id: 'subscription', name: 'Subscriptions', icon: 'Tv', color: '#EC4899' },
    { id: 'emi', name: 'EMI/Loan', icon: 'CreditCard', color: '#EF4444' },
    { id: 'insurance', name: 'Insurance', icon: 'Shield', color: '#10B981' },
    { id: 'mobile', name: 'Mobile', icon: 'Smartphone', color: '#8B5CF6' },
    { id: 'internet', name: 'Internet', icon: 'Wifi', color: '#06B6D4' },
    { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#F97316' },
    { id: 'health', name: 'Health', icon: 'Heart', color: '#EF4444' },
    { id: 'other', name: 'Other', icon: 'Receipt', color: '#64748B' },
];

// Pre-defined bill templates
export const billTemplates: BillTemplate[] = [
    { id: 'rent', name: 'House Rent', category: 'rent', icon: 'Home', defaultFrequency: 'monthly' },
    { id: 'electricity', name: 'Electricity Bill', category: 'utilities', icon: 'Zap', defaultFrequency: 'monthly' },
    { id: 'water', name: 'Water Bill', category: 'utilities', icon: 'Droplet', defaultFrequency: 'monthly' },
    { id: 'gas', name: 'Gas Bill', category: 'utilities', icon: 'Flame', defaultFrequency: 'monthly' },
    { id: 'netflix', name: 'Netflix', category: 'subscription', icon: 'Tv', defaultFrequency: 'monthly', suggestedAmount: 649 },
    { id: 'prime', name: 'Amazon Prime', category: 'subscription', icon: 'Tv', defaultFrequency: 'yearly', suggestedAmount: 1499 },
    { id: 'spotify', name: 'Spotify', category: 'subscription', icon: 'Music', defaultFrequency: 'monthly', suggestedAmount: 119 },
    { id: 'youtube', name: 'YouTube Premium', category: 'subscription', icon: 'Youtube', defaultFrequency: 'monthly', suggestedAmount: 129 },
    { id: 'hotstar', name: 'Disney+ Hotstar', category: 'subscription', icon: 'Tv', defaultFrequency: 'yearly', suggestedAmount: 899 },
    { id: 'mobile', name: 'Mobile Recharge', category: 'mobile', icon: 'Smartphone', defaultFrequency: 'monthly' },
    { id: 'internet', name: 'Broadband/WiFi', category: 'internet', icon: 'Wifi', defaultFrequency: 'monthly' },
    { id: 'home-loan', name: 'Home Loan EMI', category: 'emi', icon: 'Home', defaultFrequency: 'monthly' },
    { id: 'car-loan', name: 'Car Loan EMI', category: 'emi', icon: 'Car', defaultFrequency: 'monthly' },
    { id: 'personal-loan', name: 'Personal Loan EMI', category: 'emi', icon: 'CreditCard', defaultFrequency: 'monthly' },
    { id: 'credit-card', name: 'Credit Card Bill', category: 'emi', icon: 'CreditCard', defaultFrequency: 'monthly' },
    { id: 'car-insurance', name: 'Car Insurance', category: 'insurance', icon: 'Car', defaultFrequency: 'yearly' },
    { id: 'health-insurance', name: 'Health Insurance', category: 'insurance', icon: 'Heart', defaultFrequency: 'yearly' },
    { id: 'life-insurance', name: 'Life Insurance', category: 'insurance', icon: 'Shield', defaultFrequency: 'yearly' },
    { id: 'gym', name: 'Gym Membership', category: 'health', icon: 'Dumbbell', defaultFrequency: 'monthly' },
    { id: 'school-fees', name: 'School Fees', category: 'education', icon: 'GraduationCap', defaultFrequency: 'quarterly' },
];

export const frequencyOptions: { value: BillFrequency; label: string }[] = [
    { value: 'one-time', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half-yearly' },
    { value: 'yearly', label: 'Yearly' },
];

export const paymentMethodOptions: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'upi', label: 'UPI', icon: 'Smartphone' },
    { value: 'card', label: 'Card', icon: 'CreditCard' },
    { value: 'netbanking', label: 'Net Banking', icon: 'Building' },
    { value: 'cash', label: 'Cash', icon: 'Banknote' },
    { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

export const reminderDayOptions = [1, 3, 7, 14, 30];
