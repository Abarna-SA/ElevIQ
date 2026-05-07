'use client';

import { motion } from 'framer-motion';
import { Target, Check } from 'lucide-react';
import { useMemo } from 'react';
import type { GoalType, UserType } from '@/app/(auth)/_hooks/useUserDocument';

interface Step3GoalsProps {
    selectedGoals: GoalType[];
    userType: UserType | null;
    onChange: (goals: GoalType[]) => void;
}

// All available goals with their display info
const allGoals: Record<GoalType, { label: string; description: string; icon: string }> = {
    // Universal Goals
    save_money: { label: 'Save more money', description: 'Build a healthy savings habit', icon: '💵' },
    track_spending: { label: 'Track my spending', description: 'Know where every rupee goes', icon: '📊' },
    pay_debt: { label: 'Pay off debt', description: 'Become debt-free faster', icon: '💳' },
    emergency_fund: { label: 'Build emergency fund', description: '6+ months of expenses saved', icon: '🛡️' },
    invest: { label: 'Start investing', description: 'Grow wealth for the future', icon: '📈' },
    budget_better: { label: 'Budget better', description: 'Stick to spending limits', icon: '📋' },
    buy_home: { label: 'Buy a home', description: 'Save for your dream home', icon: '🏠' },
    education: { label: 'Education fund', description: 'Save for learning & growth', icon: '🎓' },
    // Student Goals
    save_studies: { label: 'Save for studies', description: 'College/exam fees prep', icon: '📚' },
    internship_savings: { label: 'Internship savings', description: 'Career prep fund', icon: '💼' },
    reduce_subscriptions: { label: 'Reduce subscriptions', description: 'Cut unnecessary costs', icon: '📱' },
    // Working Professional Goals
    plan_vacation: { label: 'Plan vacation', description: 'Travel savings', icon: '🏖️' },
    // Self-Employed / Freelancer Goals
    separate_business: { label: 'Separate finances', description: 'Personal vs business', icon: '🏦' },
    tax_savings: { label: 'Tax savings', description: 'Optimize your taxes', icon: '💰' },
    retirement_planning: { label: 'Retirement planning', description: 'No employer pension', icon: '🌴' },
    manage_cashflow: { label: 'Manage cash flow', description: 'Smooth operations', icon: '📈' },
    // Entrepreneur Goals
    runway_extension: { label: 'Runway extension', description: 'Extend burn rate', icon: '🏦' },
    track_burn_rate: { label: 'Track burn rate', description: 'Control spending', icon: '🔥' },
    exit_fund: { label: 'Exit fund', description: 'Future liquidity', icon: '🎯' },
    // Business Owner Goals
    increase_profits: { label: 'Increase profits', description: 'Grow business revenue', icon: '📈' },
    expand_business: { label: 'Expand business', description: 'Growth capital', icon: '🚀' },
    tax_optimization: { label: 'Tax optimization', description: 'Legal tax savings', icon: '💰' },
    family_security: { label: 'Family security', description: 'Protect dependents', icon: '👨‍👩‍👧‍👦' },
    // Retired Goals
    healthcare_fund: { label: 'Healthcare fund', description: 'Medical expenses', icon: '🏥' },
    preserve_wealth: { label: 'Preserve wealth', description: 'Protect your savings', icon: '🏦' },
    legacy_planning: { label: 'Legacy planning', description: 'Leave for family', icon: '👨‍👩‍👧‍👦' },
    travel_hobbies: { label: 'Travel & hobbies', description: 'Enjoy retirement', icon: '✈️' },
    // Homemaker Goals
    kids_education: { label: "Kids' education", description: 'School/college fund', icon: '👧' },
    reduce_groceries: { label: 'Reduce grocery bills', description: 'Smart shopping', icon: '🛒' },
    festival_savings: { label: 'Festival savings', description: 'Special occasions', icon: '🎄' },
};

// Role-based goals mapping
const roleGoals: Record<UserType, GoalType[]> = {
    student: [
        'save_studies',
        'track_spending',
        'budget_better',
        'education',
        'internship_savings',
        'reduce_subscriptions',
    ],
    employee: [
        'save_money',
        'track_spending',
        'emergency_fund',
        'invest',
        'buy_home',
        'pay_debt',
        'education',
        'plan_vacation',
    ],
    self_employed: [
        'separate_business',
        'emergency_fund',
        'tax_savings',
        'retirement_planning',
        'buy_home',
        'manage_cashflow',
        'budget_better',
    ],
    entrepreneur: [
        'runway_extension',
        'track_burn_rate',
        'separate_business',
        'emergency_fund',
        'invest',
        'pay_debt',
        'exit_fund',
    ],
    business_owner: [
        'increase_profits',
        'track_spending',
        'emergency_fund',
        'expand_business',
        'tax_optimization',
        'buy_home',
        'family_security',
    ],
    freelancer: [
        'emergency_fund',
        'tax_savings',
        'track_spending',
        'retirement_planning',
        'save_money',
        'buy_home',
        'budget_better',
    ],
    retired: [
        'healthcare_fund',
        'track_spending',
        'preserve_wealth',
        'legacy_planning',
        'travel_hobbies',
        'budget_better',
        'pay_debt',
    ],
    homemaker: [
        'budget_better',
        'track_spending',
        'save_money',
        'kids_education',
        'emergency_fund',
        'reduce_groceries',
        'festival_savings',
    ],
};

// User type display names
const userTypeLabels: Record<UserType, string> = {
    student: 'Student',
    employee: 'Employee',
    self_employed: 'Self-Employed',
    entrepreneur: 'Entrepreneur',
    business_owner: 'Business Owner',
    freelancer: 'Freelancer',
    retired: 'Retired',
    homemaker: 'Homemaker',
};

export default function Step3Goals({ selectedGoals, userType, onChange }: Step3GoalsProps) {
    // Get goals for the selected user type
    const availableGoals = useMemo(() => {
        if (!userType) return [];
        return roleGoals[userType] || [];
    }, [userType]);

    const toggleGoal = (goal: GoalType) => {
        if (selectedGoals.includes(goal)) {
            onChange(selectedGoals.filter(g => g !== goal));
        } else {
            onChange([...selectedGoals, goal]);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userType ? (
                        <>As a <span className="text-purple-500">{userTypeLabels[userType]}</span>, what are your goals?</>
                    ) : (
                        'What are your financial goals?'
                    )}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Select all that apply <span className="text-purple-500 font-medium">(min 1)</span>
                </p>
            </motion.div>

            {/* Goals List */}
            <div className="space-y-2.5 sm:space-y-3">
                {availableGoals.map((goalKey, index) => {
                    const goal = allGoals[goalKey];
                    if (!goal) return null;
                    const isSelected = selectedGoals.includes(goalKey);

                    return (
                        <motion.button
                            key={goalKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleGoal(goalKey)}
                            className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-200 ${isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-lg shadow-purple-500/20'
                                : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {/* Checkbox */}
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isSelected
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'border-2 border-gray-300 dark:border-gray-600'
                                }`}>
                                {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </div>

                            {/* Icon */}
                            <span className="text-xl sm:text-2xl">{goal.icon}</span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm sm:text-base transition-colors ${isSelected
                                    ? 'text-purple-700 dark:text-purple-300'
                                    : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {goal.label}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {goal.description}
                                </p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selection count */}
            <AnimatedCounter count={selectedGoals.length} />
        </div>
    );
}

function AnimatedCounter({ count }: { count: number }) {
    if (count === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
        >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm font-semibold rounded-full">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                {count} goal{count > 1 ? 's' : ''} selected
            </span>
        </motion.div>
    );
}
