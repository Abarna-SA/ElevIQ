'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/contexts/theme-context';
import { useAuthStore } from '@/store/auth-store';
import Step1UserType from './Step1UserType';
import Step2Income from './Step2Income';
import Step3Goals from './Step3Goals';
import Step4Habits from './Step4Habits';
import Step5Preferences from './Step5Preferences';
import SetupAnimation from './SetupAnimation';
import CompletionScreen from './CompletionScreen';
import {
    type OnboardingData,
    type UserType,
    type IncomeRange,
    type GoalType,
    type ExpenseCategory,
    type SavingDifficulty,
    type TrackingFrequency,
    type NotificationPreference,
    type Currency,
    saveOnboardingData,
    createBudgetFromOnboarding,
    createGoalsFromOnboarding,
    getUserByFirebaseUid,
} from '@/app/(auth)/_hooks/useUserDocument';

type OnboardingPhase = 'survey' | 'setup' | 'complete';

const stepInfo = [
    { title: 'Your Profile', subtitle: 'Tell us about yourself', gradient: 'from-blue-500 to-indigo-600' },
    { title: 'Finances', subtitle: 'Set up your budget', gradient: 'from-green-500 to-emerald-600' },
    { title: 'Goals', subtitle: 'What you want to achieve', gradient: 'from-purple-500 to-violet-600' },
    { title: 'Habits', subtitle: 'Your spending patterns', gradient: 'from-orange-500 to-amber-600' },
    { title: 'Preferences', subtitle: 'Customize your experience', gradient: 'from-indigo-500 to-purple-600' },
];

export default function OnboardingFlow() {
    const router = useRouter();
    const { actualTheme } = useTheme();
    const { user } = useAuthStore();
    const [phase, setPhase] = useState<OnboardingPhase>('survey');
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [userType, setUserType] = useState<UserType | null>(null);
    const [currency, setCurrency] = useState<Currency>('INR');
    const [incomeRange, setIncomeRange] = useState<IncomeRange | null>(null);
    const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
    const [goals, setGoals] = useState<GoalType[]>([]);
    const [biggestExpense, setBiggestExpense] = useState<ExpenseCategory | null>(null);
    const [savingDifficulty, setSavingDifficulty] = useState<SavingDifficulty | null>(null);
    const [trackingFrequency, setTrackingFrequency] = useState<TrackingFrequency | null>(null);
    const [notificationPreference, setNotificationPreference] = useState<NotificationPreference>('important');
    const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
    const [weeklyReportsEnabled, setWeeklyReportsEnabled] = useState(true);

    const totalSteps = 5;

    // Validation for each step
    const canProceed = useCallback(() => {
        switch (currentStep) {
            case 1:
                return userType !== null;
            case 2:
                return incomeRange !== null && monthlyBudget !== null && monthlyBudget > 0;
            case 3:
                return goals.length >= 1;
            case 4:
                return biggestExpense !== null && savingDifficulty !== null && trackingFrequency !== null;
            case 5:
                return true;
            default:
                return false;
        }
    }, [currentStep, userType, incomeRange, monthlyBudget, goals, biggestExpense, savingDifficulty, trackingFrequency]);

    const handleNext = async () => {
        if (!canProceed()) return;
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        } else {
            setPhase('setup');
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSetupComplete = useCallback(async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const userDoc = await getUserByFirebaseUid(user.uid);
            if (!userDoc) {
                console.error('User document not found');
                return;
            }

            const onboardingData: OnboardingData = {
                userType: userType!,
                currency,
                incomeRange: incomeRange!,
                monthlyBudget: monthlyBudget!,
                goals,
                primaryGoal: goals[0],
                biggestExpenseCategory: biggestExpense!,
                savingDifficulty: savingDifficulty!,
                trackingFrequency: trackingFrequency!,
                notificationPreference,
                aiInsightsEnabled,
                weeklyReportsEnabled,
            };

            await Promise.all([
                saveOnboardingData(userDoc.userId, onboardingData),
                createBudgetFromOnboarding(userDoc.userId, userDoc.firebaseUid, monthlyBudget!, currency),
                createGoalsFromOnboarding(userDoc.userId, userDoc.firebaseUid, goals, monthlyBudget!),
            ]);

            setPhase('complete');
        } catch (error) {
            console.error('Error saving onboarding data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, userType, currency, incomeRange, monthlyBudget, goals, biggestExpense, savingDifficulty, trackingFrequency, notificationPreference, aiInsightsEnabled, weeklyReportsEnabled]);

    const handleContinueToDashboard = () => {
        router.push('/dashboard');
    };

    const getOnboardingData = (): OnboardingData => ({
        userType: userType!,
        currency,
        incomeRange: incomeRange!,
        monthlyBudget: monthlyBudget!,
        goals,
        primaryGoal: goals[0],
        biggestExpenseCategory: biggestExpense!,
        savingDifficulty: savingDifficulty!,
        trackingFrequency: trackingFrequency!,
        notificationPreference,
        aiInsightsEnabled,
        weeklyReportsEnabled,
    });

    // Render setup or completion phase
    if (phase === 'setup') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <SetupAnimation
                    data={getOnboardingData()}
                    userName={user?.displayName || 'there'}
                    onComplete={handleSetupComplete}
                />
            </div>
        );
    }

    if (phase === 'complete') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <CompletionScreen
                    data={getOnboardingData()}
                    userName={user?.displayName || 'there'}
                    onContinue={handleContinueToDashboard}
                />
            </div>
        );
    }

    const currentStepInfo = stepInfo[currentStep - 1];

    return (
        <div className="min-h-screen h-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Left Side - Decorative Panel (Desktop Only) */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-30 dark:opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99,102,241,0.3) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                {/* Gradient Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br ${currentStepInfo.gradient} rounded-full blur-3xl`}
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-30"
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src={actualTheme === 'dark' ? '/ElevIQ_White.png' : '/ElevIQ_Gold.png'}
                            alt="ElevIQ"
                            className="h-10 w-auto"
                        />
                    </div>

                    {/* Center Content - Step Info */}
                    <div className="flex-1 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={`inline-flex px-4 py-2 rounded-full bg-gradient-to-r ${currentStepInfo.gradient} text-white text-sm font-medium mb-6 shadow-lg`}>
                                    Step {currentStep} of {totalSteps}
                                </div>
                                <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                    {currentStepInfo.title}
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md">
                                    {currentStepInfo.subtitle}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-3">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <motion.div
                                    animate={{
                                        scale: i + 1 === currentStep ? 1 : 0.9,
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i + 1 < currentStep
                                        ? 'bg-green-500 text-white'
                                        : i + 1 === currentStep
                                            ? `bg-gradient-to-br ${currentStepInfo.gradient} text-white shadow-lg`
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {i + 1 < currentStep ? '✓' : i + 1}
                                </motion.div>
                                {i < totalSteps - 1 && (
                                    <div className={`w-8 h-0.5 transition-colors duration-300 ${i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden px-4 pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <img
                            src={actualTheme === 'dark' ? '/ElevIQ_White.png' : '/ElevIQ_Gold.png'}
                            alt="ElevIQ"
                            className="h-7 w-auto"
                        />
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {currentStep}/{totalSteps}
                        </span>
                    </div>
                    {/* Mobile Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full bg-gradient-to-r ${currentStepInfo.gradient} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Form Content - Scrollable on mobile, centered on desktop */}
                <div className="flex-1 overflow-y-auto lg:overflow-hidden lg:flex lg:items-center">
                    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 1 && (
                                    <Step1UserType
                                        value={userType}
                                        onChange={(newType) => {
                                            setUserType(newType);
                                            // Clear goals when user type changes (different roles have different goals)
                                            setGoals([]);
                                        }}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <Step2Income
                                        currency={currency}
                                        incomeRange={incomeRange}
                                        monthlyBudget={monthlyBudget}
                                        onCurrencyChange={setCurrency}
                                        onIncomeRangeChange={setIncomeRange}
                                        onBudgetChange={setMonthlyBudget}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <Step3Goals selectedGoals={goals} userType={userType} onChange={setGoals} />
                                )}
                                {currentStep === 4 && (
                                    <Step4Habits
                                        biggestExpense={biggestExpense}
                                        savingDifficulty={savingDifficulty}
                                        trackingFrequency={trackingFrequency}
                                        onBiggestExpenseChange={setBiggestExpense}
                                        onSavingDifficultyChange={setSavingDifficulty}
                                        onTrackingFrequencyChange={setTrackingFrequency}
                                    />
                                )}
                                {currentStep === 5 && (
                                    <Step5Preferences
                                        notificationPreference={notificationPreference}
                                        aiInsightsEnabled={aiInsightsEnabled}
                                        weeklyReportsEnabled={weeklyReportsEnabled}
                                        onNotificationChange={setNotificationPreference}
                                        onAiInsightsChange={setAiInsightsEnabled}
                                        onWeeklyReportsChange={setWeeklyReportsEnabled}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 lg:py-5">
                        <div className="flex gap-3">
                            {currentStep > 1 && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleBack}
                                    className="px-6 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={canProceed() ? { scale: 1.02 } : {}}
                                whileTap={canProceed() ? { scale: 0.98 } : {}}
                                onClick={handleNext}
                                disabled={!canProceed() || isLoading}
                                className={`flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${canProceed()
                                    ? `bg-gradient-to-r ${currentStepInfo.gradient} text-white shadow-lg hover:shadow-xl`
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    }`}
                            >
                                {currentStep === totalSteps ? (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Complete Setup</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Continue</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
