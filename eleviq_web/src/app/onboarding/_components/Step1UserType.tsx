'use client';

import { motion } from 'framer-motion';
import {
    GraduationCap,
    Briefcase,
    Wrench,
    Rocket,
    Building2,
    Laptop,
    Palmtree,
    Home,
    Check
} from 'lucide-react';
import type { UserType } from '@/app/(auth)/_hooks/useUserDocument';

interface Step1UserTypeProps {
    value: UserType | null;
    onChange: (value: UserType) => void;
}

const userTypes: { value: UserType; label: string; description: string; icon: typeof GraduationCap }[] = [
    { value: 'student', label: 'Student', description: 'College / School', icon: GraduationCap },
    { value: 'employee', label: 'Employee', description: 'Salaried Worker', icon: Briefcase },
    { value: 'self_employed', label: 'Self Employed', description: 'Consultant / Doctor', icon: Wrench },
    { value: 'entrepreneur', label: 'Entrepreneur', description: 'Startup Founder', icon: Rocket },
    { value: 'business_owner', label: 'Business Owner', description: 'MSME / Shop', icon: Building2 },
    { value: 'freelancer', label: 'Freelancer', description: 'Gig / Remote', icon: Laptop },
    { value: 'retired', label: 'Retired', description: 'Pensioner', icon: Palmtree },
    { value: 'homemaker', label: 'Homemaker', description: 'Household', icon: Home },
];

export default function Step1UserType({ value, onChange }: Step1UserTypeProps) {
    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    What describes you best?
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    This helps us personalize your experience
                </p>
            </motion.div>

            {/* Options Grid - Responsive with fixed sizing */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {userTypes.map((type, index) => {
                    const Icon = type.icon;
                    const isSelected = value === type.value;

                    return (
                        <motion.button
                            key={type.value}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onChange(type.value)}
                            className={`
                                relative p-4 rounded-xl border-2 text-left transition-all duration-200 min-h-[110px] flex flex-col
                                ${isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                    : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }
                            `}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm"
                                >
                                    <Check className="w-3 h-3 text-white" />
                                </motion.div>
                            )}

                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors flex-shrink-0
                                ${isSelected
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }
                            `}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm leading-tight transition-colors ${isSelected
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {type.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                                    {type.description}
                                </p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
