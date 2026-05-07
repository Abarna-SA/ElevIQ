'use client';

import { motion } from 'framer-motion';
import { Settings, Bell, BellRing, BellOff, VolumeX, Check } from 'lucide-react';
import type { NotificationPreference } from '@/app/(auth)/_hooks/useUserDocument';

interface Step5PreferencesProps {
    notificationPreference: NotificationPreference;
    aiInsightsEnabled: boolean;
    weeklyReportsEnabled: boolean;
    onNotificationChange: (value: NotificationPreference) => void;
    onAiInsightsChange: (value: boolean) => void;
    onWeeklyReportsChange: (value: boolean) => void;
}

const notificationOptions: { value: NotificationPreference; label: string; description: string; icon: typeof Bell }[] = [
    { value: 'all', label: 'All notifications', description: 'Bills, insights, tips, reminders', icon: BellRing },
    { value: 'important', label: 'Important only', description: 'Bills due, budget alerts', icon: Bell },
    { value: 'minimal', label: 'Minimal', description: 'Only critical alerts', icon: BellOff },
    { value: 'none', label: 'None', description: "I'll check manually", icon: VolumeX },
];

export default function Step5Preferences({
    notificationPreference,
    aiInsightsEnabled,
    weeklyReportsEnabled,
    onNotificationChange,
    onAiInsightsChange,
    onWeeklyReportsChange,
}: Step5PreferencesProps) {
    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Almost done!
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Customize your experience
                </p>
            </motion.div>

            {/* Notification Preference */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    How should we notify you? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                    {notificationOptions.map((option, index) => {
                        const Icon = option.icon;
                        const isSelected = notificationPreference === option.value;

                        return (
                            <motion.button
                                key={option.value}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNotificationChange(option.value)}
                                className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-200 ${isSelected
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                                    : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                {/* Radio */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                    ? 'border-indigo-500 bg-indigo-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>

                                {/* Icon */}
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors ${isSelected
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm sm:text-base transition-colors ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                                        {option.label}
                                        {option.value === 'important' && (
                                            <span className="ml-2 text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {option.description}
                                    </p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Toggle Options */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2.5 sm:space-y-3"
            >
                {/* AI Insights */}
                <button
                    onClick={() => onAiInsightsChange(!aiInsightsEnabled)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-200 ${aiInsightsEnabled
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                >
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-all ${aiInsightsEnabled
                        ? 'bg-indigo-500 text-white'
                        : 'border-2 border-gray-300 dark:border-gray-600'
                        }`}>
                        {aiInsightsEnabled && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </div>
                    <span className="text-xl sm:text-2xl">🤖</span>
                    <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">AI-powered insights</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Personalized tips & analysis</p>
                    </div>
                </button>

                {/* Weekly Reports */}
                <button
                    onClick={() => onWeeklyReportsChange(!weeklyReportsEnabled)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-200 ${weeklyReportsEnabled
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                >
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-all ${weeklyReportsEnabled
                        ? 'bg-indigo-500 text-white'
                        : 'border-2 border-gray-300 dark:border-gray-600'
                        }`}>
                        {weeklyReportsEnabled && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </div>
                    <span className="text-xl sm:text-2xl">📊</span>
                    <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Weekly spending reports</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Summary every Sunday morning</p>
                    </div>
                </button>
            </motion.div>
        </div>
    );
}
