'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lightbulb, AlertTriangle, Target, ChevronRight, X, MessageSquare, Loader2 } from 'lucide-react';

interface AIInsight {
    type: 'tip' | 'warning' | 'goal';
    title: string;
    message: string;
    action?: string;
    actionHandler?: () => void;
}

interface AIInsightsProps {
    insights: AIInsight[];
    isLoading?: boolean;
    onAskAI?: (question: string) => void;
}

export function AIInsights({ insights, isLoading, onAskAI }: AIInsightsProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [question, setQuestion] = useState('');

    const getIcon = (type: string) => {
        switch (type) {
            case 'tip':
                return <Lightbulb className="w-4 h-4" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4" />;
            case 'goal':
                return <Target className="w-4 h-4" />;
            default:
                return <Sparkles className="w-4 h-4" />;
        }
    };

    const getColors = (type: string) => {
        switch (type) {
            case 'tip':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
            case 'goal':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
            default:
                return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && onAskAI) {
            onAskAI(question);
            setQuestion('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30 overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">AI Financial Advisor</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Smart suggestions based on your inputs</p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                    <span className="ml-2 text-sm text-gray-500">Analyzing your inputs...</span>
                                </div>
                            ) : insights.length > 0 ? (
                                insights.map((insight, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-3 rounded-xl border ${getColors(insight.type)}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">{getIcon(insight.type)}</div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{insight.title}</p>
                                                <p className="text-sm opacity-80 mt-0.5">{insight.message}</p>
                                                {insight.action && (
                                                    <button
                                                        onClick={insight.actionHandler}
                                                        className="mt-2 text-xs font-medium flex items-center gap-1 hover:underline"
                                                    >
                                                        {insight.action}
                                                        <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Enter your details to get AI suggestions</p>
                                </div>
                            )}

                            {/* Ask AI Input */}
                            {onAskAI && (
                                <form onSubmit={handleSubmit} className="pt-2 border-t border-purple-100 dark:border-purple-800/30">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                placeholder="Ask me anything..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder:text-gray-400"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Ask
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Utility function to generate insights based on calculator data
export function generateEMIInsights(
    principal: number,
    rate: number,
    tenure: number,
    emi: number,
    totalInterest: number
): AIInsight[] {
    const insights: AIInsight[] = [];

    // Interest rate insight
    if (rate > 9) {
        insights.push({
            type: 'warning',
            title: 'High Interest Rate',
            message: `Your rate (${rate}%) is above average. Consider negotiating or exploring other lenders.`,
            action: 'Compare rates',
        });
    } else if (rate < 8) {
        insights.push({
            type: 'tip',
            title: 'Great Interest Rate!',
            message: `You've secured a competitive rate of ${rate}%. This is below market average.`,
        });
    }

    // Interest to principal ratio
    const interestRatio = (totalInterest / principal) * 100;
    if (interestRatio > 50) {
        insights.push({
            type: 'warning',
            title: 'High Interest Burden',
            message: `You'll pay ${interestRatio.toFixed(0)}% extra as interest. Consider a shorter tenure.`,
            action: 'See optimal tenure',
        });
    }

    // Tenure optimization
    if (tenure > 180) {
        const shorterTenure = 180;
        const shorterEMI = calculateEMI(principal, rate, shorterTenure);
        const savings = (emi * tenure) - (shorterEMI * shorterTenure);
        if (savings > 100000) {
            insights.push({
                type: 'goal',
                title: 'Save with Shorter Tenure',
                message: `15-year tenure saves ₹${Math.round(savings).toLocaleString()} in interest!`,
                action: 'Apply 15-year tenure',
            });
        }
    }

    // Prepayment suggestion
    const monthlyExtra = Math.round(emi * 0.1);
    insights.push({
        type: 'tip',
        title: 'Prepayment Strategy',
        message: `Adding ₹${monthlyExtra.toLocaleString()}/month extra can reduce tenure by ~2-3 years.`,
        action: 'Calculate prepayment',
    });

    return insights;
}

function calculateEMI(principal: number, rate: number, tenure: number): number {
    const r = rate / 12 / 100;
    return (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
}

export function generateSIPInsights(
    monthly: number,
    rate: number,
    years: number,
    invested: number,
    returns: number,
    total: number
): AIInsight[] {
    const insights: AIInsight[] = [];

    // Growth multiple
    const multiple = total / invested;
    if (multiple > 3) {
        insights.push({
            type: 'goal',
            title: 'Excellent Growth!',
            message: `Your money will grow ${multiple.toFixed(1)}x over ${years} years. The power of compounding!`,
        });
    }

    // Step-up suggestion
    const stepUpRate = 10;
    const stepUpTotal = calculateStepUpSIP(monthly, rate, years, stepUpRate);
    const extraGains = stepUpTotal - total;
    if (extraGains > 100000) {
        insights.push({
            type: 'tip',
            title: 'Step-Up Your SIP',
            message: `Increase SIP by ${stepUpRate}%/year → Get ₹${Math.round(extraGains).toLocaleString()} extra!`,
            action: 'Enable step-up',
        });
    }

    // Earlier start suggestion
    const extraYears = 2;
    const earlierTotal = calculateSIP(monthly, rate, years + extraYears);
    const earlierGains = earlierTotal - total;
    insights.push({
        type: 'tip',
        title: 'Start Earlier, Earn More',
        message: `Starting ${extraYears} years earlier would give ₹${Math.round(earlierGains).toLocaleString()} more!`,
    });

    // Tax saving
    if (monthly * 12 < 150000) {
        const taxSavingPotential = 150000 - (monthly * 12);
        insights.push({
            type: 'goal',
            title: 'Tax Saving Opportunity',
            message: `You can invest ₹${Math.round(taxSavingPotential).toLocaleString()} more in ELSS for 80C deduction.`,
            action: 'Explore ELSS funds',
        });
    }

    return insights;
}

function calculateSIP(monthly: number, rate: number, years: number): number {
    const r = rate / 12 / 100;
    const n = years * 12;
    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function calculateStepUpSIP(monthly: number, rate: number, years: number, stepUp: number): number {
    let total = 0;
    let currentMonthly = monthly;
    const r = rate / 12 / 100;

    for (let year = 1; year <= years; year++) {
        const n = 12;
        const yearValue = currentMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        total += yearValue * Math.pow(1 + rate / 100, years - year);
        currentMonthly *= (1 + stepUp / 100);
    }

    return total;
}
