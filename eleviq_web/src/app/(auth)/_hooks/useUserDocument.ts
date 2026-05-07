'use client';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { format } from 'date-fns';

// User Document Type
export interface UserDocument {
    userId: string;                   // "Elev080226001" format
    firebaseUid: string;              // Firebase Auth UID
    email: string;
    displayName: string;
    photoURL?: string;
    providers: ('email' | 'google')[];
    primaryProvider: 'email' | 'google';
    hasPassword: boolean;
    userType?: 'student' | 'professional';
    onboardingCompleted: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastLoginAt: Timestamp;
}

// Provider Type
export type AuthProvider = 'email' | 'google';

/**
 * Generate custom user ID: Elev{DDMMYY}{SEQ}
 */
async function generateUserId(): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');

    const today = format(new Date(), 'ddMMyy');
    const prefix = `Elev${today}`;

    // Query to find the latest user ID for today
    const usersRef = collection(db, 'users');
    const q = query(
        usersRef,
        where('userId', '>=', prefix),
        where('userId', '<', prefix + 'zzz'),
        orderBy('userId', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let seq: string;
    if (snapshot.empty) {
        seq = '001';
    } else {
        const lastId = snapshot.docs[0].data().userId as string;
        const lastSeq = parseInt(lastId.slice(-3), 10);
        seq = String(lastSeq + 1).padStart(3, '0');
    }

    return `${prefix}${seq}`;
}

/**
 * Get user document by email
 */
export async function getUserByEmail(email: string): Promise<UserDocument | null> {
    if (!db) return null;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserDocument;
}

/**
 * Get user document by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    if (!db) return null;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('firebaseUid', '==', firebaseUid), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserDocument;
}

/**
 * Create new user document
 */
export async function createUserDocument(
    firebaseUid: string,
    email: string,
    displayName: string,
    provider: AuthProvider,
    photoURL?: string
): Promise<UserDocument> {
    if (!db) throw new Error('Firestore not initialized');

    const userId = await generateUserId();
    const now = Timestamp.now();

    const userData: UserDocument = {
        userId,
        firebaseUid,
        email: email.toLowerCase(),
        displayName,
        ...(photoURL ? { photoURL } : {}),
        providers: [provider],
        primaryProvider: provider,
        hasPassword: provider === 'email',
        onboardingCompleted: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
    };

    await setDoc(doc(db, 'users', userId), userData);
    console.log('✅ Created user document:', userId);

    return userData;
}

/**
 * Add provider to existing user
 */
export async function addProviderToUser(
    userId: string,
    provider: AuthProvider
): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User not found');
    }

    const currentProviders = userDoc.data().providers as AuthProvider[];

    if (!currentProviders.includes(provider)) {
        await updateDoc(userRef, {
            providers: [...currentProviders, provider],
            hasPassword: provider === 'email' ? true : userDoc.data().hasPassword,
            updatedAt: Timestamp.now(),
        });
        console.log('✅ Added provider to user:', provider);
    }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
    if (!db) return;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        lastLoginAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
}

/**
 * Update user document
 */
export async function updateUserDocument(
    userId: string,
    data: Partial<Pick<UserDocument, 'displayName' | 'photoURL' | 'userType' | 'onboardingCompleted'>>
): Promise<void> {
    if (!db) return;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Check if user needs to set password (Google user without password)
 */
export function needsPasswordSetup(user: UserDocument): boolean {
    return user.primaryProvider === 'google' && !user.hasPassword;
}

/**
 * Check provider conflict scenarios
 */
export interface ProviderConflict {
    type: 'email_exists' | 'google_exists' | 'none';
    user: UserDocument | null;
    message: string;
}

export async function checkProviderConflict(
    email: string,
    attemptedProvider: AuthProvider
): Promise<ProviderConflict> {
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
        return { type: 'none', user: null, message: '' };
    }

    // If user signed up with email and tries Google
    if (existingUser.primaryProvider === 'email' && attemptedProvider === 'google') {
        return {
            type: 'email_exists',
            user: existingUser,
            message: 'Already signed up! Redirecting to dashboard...',
        };
    }

    // If user signed up with Google and tries email
    if (existingUser.primaryProvider === 'google' && attemptedProvider === 'email') {
        if (existingUser.hasPassword) {
            return {
                type: 'google_exists',
                user: existingUser,
                message: 'Already signed up! Login with your email & password.',
            };
        }
        return {
            type: 'google_exists',
            user: existingUser,
            message: 'You signed up with Google. Set your password to also login with email.',
        };
    }

    // Same provider - just login
    return {
        type: 'none',
        user: existingUser,
        message: '',
    };
}

// ========== ONBOARDING DATA TYPES ==========

export type UserType =
    | 'student'
    | 'employee'
    | 'self_employed'
    | 'entrepreneur'
    | 'business_owner'
    | 'freelancer'
    | 'retired'
    | 'homemaker';

export type IncomeRange =
    | 'below_10k'
    | '10k_25k'
    | '25k_50k'
    | '50k_1L'
    | '1L_3L'
    | 'above_3L';

export type GoalType =
    // Universal Goals
    | 'save_money'
    | 'track_spending'
    | 'pay_debt'
    | 'emergency_fund'
    | 'invest'
    | 'budget_better'
    | 'buy_home'
    | 'education'
    // Student Goals
    | 'save_studies'
    | 'internship_savings'
    | 'reduce_subscriptions'
    // Working Professional Goals
    | 'plan_vacation'
    // Self-Employed / Freelancer Goals
    | 'separate_business'
    | 'tax_savings'
    | 'retirement_planning'
    | 'manage_cashflow'
    // Entrepreneur Goals
    | 'runway_extension'
    | 'track_burn_rate'
    | 'exit_fund'
    // Business Owner Goals
    | 'increase_profits'
    | 'expand_business'
    | 'tax_optimization'
    | 'family_security'
    // Retired Goals
    | 'healthcare_fund'
    | 'preserve_wealth'
    | 'legacy_planning'
    | 'travel_hobbies'
    // Homemaker Goals
    | 'kids_education'
    | 'reduce_groceries'
    | 'festival_savings';

export type ExpenseCategory =
    | 'food'
    | 'transport'
    | 'shopping'
    | 'bills'
    | 'entertainment'
    | 'rent'
    | 'education'
    | 'health'
    | 'other';

export type SavingDifficulty = 'easy' | 'moderate' | 'hard' | 'very_hard';
export type TrackingFrequency = 'daily' | 'weekly' | 'monthly' | 'rarely';
export type NotificationPreference = 'all' | 'important' | 'minimal' | 'none';
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export interface OnboardingData {
    // Step 1: User Type
    userType: UserType;

    // Step 2: Income & Budget
    currency: Currency;
    incomeRange: IncomeRange;
    monthlyBudget: number;

    // Step 3: Financial Goals
    goals: GoalType[];
    primaryGoal: GoalType;

    // Step 4: Spending Habits
    biggestExpenseCategory: ExpenseCategory;
    savingDifficulty: SavingDifficulty;
    trackingFrequency: TrackingFrequency;

    // Step 5: Preferences
    notificationPreference: NotificationPreference;
    aiInsightsEnabled: boolean;
    weeklyReportsEnabled: boolean;

    // Metadata
    completedAt?: Timestamp;
}

/**
 * Save onboarding data and mark as complete
 */
export async function saveOnboardingData(
    userId: string,
    data: OnboardingData
): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const userRef = doc(db, 'users', userId);
    const now = Timestamp.now();

    await updateDoc(userRef, {
        onboarding: {
            ...data,
            completedAt: now,
        },
        onboardingCompleted: true,
        updatedAt: now,
    });

    console.log('✅ Saved onboarding data for user:', userId);
}

/**
 * Save onboarding progress (partial data)
 */
export async function saveOnboardingProgress(
    userId: string,
    step: number,
    partialData: Partial<OnboardingData>
): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
        onboardingStep: step,
        onboardingProgress: partialData,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Get user's onboarding progress
 */
export async function getOnboardingProgress(
    userId: string
): Promise<{ step: number; data: Partial<OnboardingData> } | null> {
    if (!db) return null;

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    if (!userData.onboardingStep) return null;

    return {
        step: userData.onboardingStep,
        data: userData.onboardingProgress || {},
    };
}

/**
 * Create budget document from onboarding
 */
export async function createBudgetFromOnboarding(
    userId: string,
    firebaseUid: string,
    monthlyBudget: number,
    currency: Currency
): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');

    const budgetId = `budget_${userId}_${Date.now()}`;
    const now = Timestamp.now();

    await setDoc(doc(db, 'budgets', budgetId), {
        id: budgetId,
        userId,
        firebaseUid,
        amount: monthlyBudget,
        currency,
        period: 'monthly',
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });

    console.log('✅ Created budget:', budgetId);
    return budgetId;
}

/**
 * Create goal documents from onboarding
 */
export async function createGoalsFromOnboarding(
    userId: string,
    firebaseUid: string,
    goals: GoalType[],
    monthlyBudget: number
): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    const now = Timestamp.now();
    const goalDefaults: Record<GoalType, { name: string; target: number; icon: string }> = {
        // Universal Goals
        save_money: { name: 'Savings Goal', target: monthlyBudget * 3, icon: '💵' },
        track_spending: { name: 'Track Spending', target: 0, icon: '📊' },
        pay_debt: { name: 'Debt Payoff', target: monthlyBudget * 6, icon: '💳' },
        emergency_fund: { name: 'Emergency Fund', target: monthlyBudget * 6, icon: '🛡️' },
        invest: { name: 'Investment Fund', target: monthlyBudget * 12, icon: '📈' },
        budget_better: { name: 'Budget Master', target: 0, icon: '📋' },
        buy_home: { name: 'Home Fund', target: monthlyBudget * 60, icon: '🏠' },
        education: { name: 'Education Fund', target: monthlyBudget * 24, icon: '🎓' },
        // Student Goals
        save_studies: { name: 'Study Savings', target: monthlyBudget * 6, icon: '📚' },
        internship_savings: { name: 'Internship Fund', target: monthlyBudget * 3, icon: '💼' },
        reduce_subscriptions: { name: 'Cut Subscriptions', target: 0, icon: '📱' },
        // Working Professional Goals
        plan_vacation: { name: 'Vacation Fund', target: monthlyBudget * 4, icon: '🏖️' },
        // Self-Employed / Freelancer Goals
        separate_business: { name: 'Business Separation', target: 0, icon: '🏦' },
        tax_savings: { name: 'Tax Fund', target: monthlyBudget * 3, icon: '💰' },
        retirement_planning: { name: 'Retirement Fund', target: monthlyBudget * 120, icon: '🏖️' },
        manage_cashflow: { name: 'Cash Flow Management', target: 0, icon: '💳' },
        // Entrepreneur Goals
        runway_extension: { name: 'Runway Extension', target: monthlyBudget * 12, icon: '🏦' },
        track_burn_rate: { name: 'Burn Rate Control', target: 0, icon: '🔥' },
        exit_fund: { name: 'Exit Fund', target: monthlyBudget * 24, icon: '🎯' },
        // Business Owner Goals
        increase_profits: { name: 'Profit Growth', target: monthlyBudget * 6, icon: '📈' },
        expand_business: { name: 'Expansion Fund', target: monthlyBudget * 24, icon: '🚀' },
        tax_optimization: { name: 'Tax Optimization', target: monthlyBudget * 2, icon: '💰' },
        family_security: { name: 'Family Security', target: monthlyBudget * 12, icon: '👨‍👩‍👧‍👦' },
        // Retired Goals
        healthcare_fund: { name: 'Healthcare Fund', target: monthlyBudget * 12, icon: '🏥' },
        preserve_wealth: { name: 'Wealth Preservation', target: monthlyBudget * 24, icon: '🏦' },
        legacy_planning: { name: 'Legacy Fund', target: monthlyBudget * 36, icon: '👨‍👩‍👧‍👦' },
        travel_hobbies: { name: 'Travel & Hobbies', target: monthlyBudget * 6, icon: '✈️' },
        // Homemaker Goals
        kids_education: { name: "Kids' Education", target: monthlyBudget * 36, icon: '👧' },
        reduce_groceries: { name: 'Grocery Savings', target: 0, icon: '🛒' },
        festival_savings: { name: 'Festival Fund', target: monthlyBudget * 2, icon: '🎄' },
    };

    for (const goalType of goals) {
        if (goalType === 'track_spending' || goalType === 'budget_better') continue;

        const defaults = goalDefaults[goalType];
        const goalId = `goal_${userId}_${goalType}`;

        await setDoc(doc(db, 'goals', goalId), {
            id: goalId,
            userId,
            firebaseUid,
            name: defaults.name,
            icon: defaults.icon,
            targetAmount: defaults.target,
            currentAmount: 0,
            goalType,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }

    console.log('✅ Created goals for user:', userId);
}
