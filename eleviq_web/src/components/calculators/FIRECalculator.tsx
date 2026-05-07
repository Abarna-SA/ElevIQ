'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Settings2 } from 'lucide-react';
import { SliderInput, ProgressGauge, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateFIRESummary } from './shared/aiSummaryGenerators';

interface FIRECalculatorProps {
    onBack?: () => void;
}

// Helper function - defined outside component to avoid initialization issues
const formatCurrencyFIRE = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
    return value.toLocaleString();
};

export function FIRECalculator({ onBack }: FIRECalculatorProps) {
    const [currentAge, setCurrentAge] = useState(30);
    const [targetAge, setTargetAge] = useState(45);
    const [monthlyExpenses, setMonthlyExpenses] = useState(75000);
    const [currentSavings, setCurrentSavings] = useState(4500000);
    const [monthlyInvestment, setMonthlyInvestment] = useState(100000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [inflationRate, setInflationRate] = useState(6);
    const [withdrawalRate, setWithdrawalRate] = useState(4);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    // FIRE calculations
    const result = useMemo(() => {
        const yearsToFIRE = targetAge - currentAge;
        const annualExpenses = monthlyExpenses * 12;
        const futureAnnualExpenses = annualExpenses * Math.pow(1 + inflationRate / 100, yearsToFIRE);
        const fireNumber = futureAnnualExpenses / (withdrawalRate / 100);

        const r = expectedReturn / 12 / 100;
        const n = yearsToFIRE * 12;
        const fvCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToFIRE);
        const fvInvestments = monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        const projectedCorpus = fvCurrentSavings + fvInvestments;

        let fireAge = targetAge;
        let yearlyCorpus = currentSavings;
        const yearlyInvestment = monthlyInvestment * 12;

        for (let age = currentAge; age <= 70; age++) {
            if (yearlyCorpus >= fireNumber) {
                fireAge = age;
                break;
            }
            yearlyCorpus = yearlyCorpus * (1 + expectedReturn / 100) + yearlyInvestment;
        }

        const isOnTrack = projectedCorpus >= fireNumber;
        const gap = fireNumber - projectedCorpus;
        const progressPercent = (projectedCorpus / fireNumber) * 100;
        const requiredMonthly = gap > 0
            ? (gap * r) / ((Math.pow(1 + r, n) - 1) * (1 + r))
            : 0;

        return {
            fireNumber, projectedCorpus, isOnTrack, gap, progressPercent,
            fireAge, requiredMonthly, fvCurrentSavings, fvInvestments, futureAnnualExpenses,
        };
    }, [currentAge, targetAge, monthlyExpenses, currentSavings, monthlyInvestment, expectedReturn, inflationRate, withdrawalRate]);

    // Yearly projection data
    const yearlyData = useMemo(() => {
        const data = [];
        let corpus = currentSavings;
        for (let year = 0; year <= targetAge - currentAge; year++) {
            data.push({ year, value: corpus });
            corpus = corpus * (1 + expectedReturn / 100) + monthlyInvestment * 12;
        }
        return data;
    }, [currentAge, targetAge, currentSavings, monthlyInvestment, expectedReturn]);

    // AI Summary generator
    const handleGenerateSummary = useCallback(() => {
        const savingsRate = ((monthlyInvestment / (monthlyExpenses + monthlyInvestment)) * 100);
        return generateFIRESummary(
            monthlyExpenses + monthlyInvestment, monthlyExpenses, savingsRate,
            result.fireNumber, targetAge - currentAge
        );
    }, [monthlyInvestment, monthlyExpenses, result, targetAge, currentAge]);

    const formatCurrency = formatCurrencyFIRE;

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner
                title="FIRE Calculator"
                description="Financial Independence, Retire Early — Plan your path to freedom"
                icon={Flame}
                gradient="from-orange-500 to-red-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'FIRE Number', value: `₹${formatCurrency(result.fireNumber)}` },
                    { label: 'FIRE Age', value: `${result.fireAge}` },
                    { label: 'Progress', value: `${Math.min(result.progressPercent, 100).toFixed(0)}%` },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <GlassCard title="Your Profile" icon={Target}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <SliderInput
                                    label="Current Age"
                                    value={currentAge}
                                    onChange={setCurrentAge}
                                    min={18}
                                    max={60}
                                    step={1}
                                    suffix=" yrs"
                                />
                                <SliderInput
                                    label="Target Retire Age"
                                    value={targetAge}
                                    onChange={setTargetAge}
                                    min={currentAge + 1}
                                    max={70}
                                    step={1}
                                    suffix=" yrs"
                                />
                            </div>

                            <SliderInput
                                label="Monthly Expenses"
                                value={monthlyExpenses}
                                onChange={setMonthlyExpenses}
                                min={10000}
                                max={500000}
                                step={5000}
                                prefix="₹"
                                formatValue={(v) => v.toLocaleString()}
                                quickValues={[25000, 50000, 75000, 100000, 150000]}
                            />

                            <SliderInput
                                label="Current Savings/Investments"
                                value={currentSavings}
                                onChange={setCurrentSavings}
                                min={0}
                                max={50000000}
                                step={100000}
                                prefix="₹"
                                formatValue={formatCurrency}
                                quickValues={[1000000, 2500000, 5000000, 10000000]}
                            />

                            <SliderInput
                                label="Monthly Investment"
                                value={monthlyInvestment}
                                onChange={setMonthlyInvestment}
                                min={5000}
                                max={500000}
                                step={5000}
                                prefix="₹"
                                formatValue={(v) => v.toLocaleString()}
                                quickValues={[25000, 50000, 100000, 150000, 200000]}
                            />
                        </div>
                    </GlassCard>

                    <GlassCard title="Assumptions" icon={Settings2}>
                        <div className="grid grid-cols-2 gap-4">
                            <SliderInput label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} min={6} max={18} step={0.5} suffix="% p.a." />
                            <SliderInput label="Inflation Rate" value={inflationRate} onChange={setInflationRate} min={3} max={10} step={0.5} suffix="% p.a." />
                            <SliderInput label="Safe Withdrawal Rate" value={withdrawalRate} onChange={setWithdrawalRate} min={2} max={6} step={0.5} suffix="%" />
                        </div>
                    </GlassCard>

                    {/* AI Insights */}
                    {/* AI Advisor Modal */}
                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="FIRE Calculator"
                        calculatorContext={[
                            { label: 'Monthly Income', value: `₹${formatCurrency(monthlyExpenses + monthlyInvestment)}` },
                            { label: 'Expenses', value: `₹${formatCurrency(monthlyExpenses)}` },
                            { label: 'FIRE Number', value: `₹${formatCurrency(result.fireNumber)}` },
                            { label: 'FIRE Age', value: `${result.fireAge}` },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {/* Progress Gauge */}
                    <GlassCard title="FIRE Progress">
                        <div className="flex justify-center mb-4">
                            <ProgressGauge
                                value={result.progressPercent}
                                max={100}
                                label={result.isOnTrack ? 'On Track!' : 'Need More'}
                                sublabel={`Age ${result.fireAge}`}
                                color={result.isOnTrack ? '#22c55e' : '#f59e0b'}
                            />
                        </div>
                        <div className={`text-center p-3 rounded-xl ${result.isOnTrack
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                            }`}>
                            {result.isOnTrack ? (
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">FIRE achievable by age {result.fireAge}!</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-medium">You&apos;ll reach FIRE at age {result.fireAge}</span>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Key Numbers */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-orange-200/50 dark:border-orange-500/20 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4 text-orange-500" />
                                <p className="text-gray-500 dark:text-gray-400 text-xs">FIRE Number</p>
                            </div>
                            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">₹{formatCurrency(result.fireNumber)}</p>
                            <p className="text-xs text-gray-400 mt-1">25x annual expenses</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-blue-200/50 dark:border-blue-500/20 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Projected Corpus</p>
                            </div>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{formatCurrency(result.projectedCorpus)}</p>
                            <p className="text-xs text-gray-400 mt-1">At age {targetAge}</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-gray-200/50 dark:border-white/10 shadow-sm">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Current Savings</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{formatCurrency(currentSavings)}</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-gray-200/50 dark:border-white/10 shadow-sm">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Gap to Target</p>
                            <p className={`text-xl font-bold ${result.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {result.gap > 0 ? `₹${formatCurrency(result.gap)}` : '✓ Surplus'}
                            </p>
                        </motion.div>
                    </div>

                    {/* Growth Chart */}
                    <GlassCard title="Path to FIRE" icon={BarChart3}>
                        <GrowthChart
                            data={yearlyData}
                            height={200}
                            formatValue={(v) => `₹${formatCurrency(v)}`}
                        />
                        <div className="mt-4 flex items-center gap-2 justify-center">
                            <div className="w-8 h-0.5 bg-orange-500 border-dashed" />
                            <span className="text-xs text-gray-500">FIRE Target: ₹{formatCurrency(result.fireNumber)}</span>
                        </div>
                    </GlassCard>

                    {/* Breakdown */}
                    <GlassCard title={`Corpus Breakdown at Age ${targetAge}`}>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">From Current Savings</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{formatCurrency(result.fvCurrentSavings)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">From Monthly SIP</span>
                                <span className="font-medium text-gray-900 dark:text-white">₹{formatCurrency(result.fvInvestments)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                                <span className="font-medium text-gray-900 dark:text-white">Total Corpus</span>
                                <span className="font-bold text-blue-600">₹{formatCurrency(result.projectedCorpus)}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
