'use client';

import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { OnboardingData } from '@/app/(auth)/_hooks/useUserDocument';

interface SetupAnimationProps {
    data: OnboardingData;
    userName: string;
    onComplete: () => void;
}

const setupSteps = [
    { id: 1, label: 'Creating your budget', delay: 0 },
    { id: 2, label: 'Setting up goals', delay: 2000 },
    { id: 3, label: 'Configuring notifications', delay: 4000 },
    { id: 4, label: 'Personalizing dashboard', delay: 6000 },
    { id: 5, label: 'Enabling AI insights', delay: 8000 },
];

export default function SetupAnimation({ data, userName, onComplete }: SetupAnimationProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 1;
            });
        }, 100);

        // Step progression
        setupSteps.forEach((step, index) => {
            setTimeout(() => {
                setCurrentStep(index + 1);
            }, step.delay);
        });

        // Complete after 10 seconds
        const completeTimeout = setTimeout(() => {
            onComplete();
        }, 10000);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(completeTimeout);
        };
    }, [onComplete]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center"
            >
                {/* Animated Icon */}
                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
                >
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Setting up your experience...
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Just a moment, {userName.split(' ')[0]}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                    />
                </div>

                {/* Steps */}
                <div className="space-y-3 text-left">
                    {setupSteps.map((step, index) => {
                        const isComplete = currentStep > index;
                        const isCurrent = currentStep === index + 1 && progress < 100;
                        const isPending = currentStep <= index;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: step.delay / 1000 }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isComplete ? 'bg-green-50 dark:bg-green-900/20' :
                                    isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' :
                                        'bg-gray-50 dark:bg-gray-800/50'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-500 text-white' :
                                    isCurrent ? 'bg-blue-500 text-white' :
                                        'bg-gray-300 dark:bg-gray-600'
                                    }`}>
                                    {isComplete ? (
                                        <Check className="w-4 h-4" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${isComplete ? 'text-green-700 dark:text-green-400' :
                                    isCurrent ? 'text-blue-700 dark:text-blue-400' :
                                        'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {step.label}
                                    {step.id === 1 && `: ₹${data.monthlyBudget.toLocaleString('en-IN')}/month`}
                                    {step.id === 2 && `: ${data.goals.length} goal${data.goals.length > 1 ? 's' : ''}`}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
