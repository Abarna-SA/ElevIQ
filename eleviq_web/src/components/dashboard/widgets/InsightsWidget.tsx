'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Lightbulb, Bell, TrendingUp, TrendingDown } from 'lucide-react';

interface Insight {
    type: 'tip' | 'warning' | 'reminder' | 'positive' | 'negative';
    message: string;
    action?: string;
}

interface InsightsWidgetProps {
    insights: Insight[];
}

const insightConfig = {
    tip: { icon: Lightbulb, label: 'Tip' },
    warning: { icon: AlertCircle, label: 'Alert' },
    reminder: { icon: Bell, label: 'Reminder' },
    positive: { icon: TrendingUp, label: 'Insight' },
    negative: { icon: TrendingDown, label: 'Insight' },
};

export default function InsightsWidget({ insights }: InsightsWidgetProps) {
    const displayInsights = insights.slice(0, 4);

    if (displayInsights.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm"
            >
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Lightbulb className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No insights yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add more expenses to get insights</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm flex flex-col"
        >
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Insights</h3>
                <Link
                    href="/insights"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    All
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-6 pt-5 flex-1">
                {displayInsights.map((insight, index) => {
                    const config = insightConfig[insight.type];
                    const Icon = config.icon;
                    const isUrgent = insight.type === 'warning' || insight.type === 'reminder';

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-xl border transition-colors cursor-pointer ${isUrgent
                                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
                                    }`}>
                                    <Icon className={`w-4 h-4 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {config.label}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {insight.message}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
