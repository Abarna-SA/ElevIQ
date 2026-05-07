'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, Car, GraduationCap, Plane, Wallet, TrendingUp, Download, Share2, Target, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { SliderInput, PieChart, GrowthChart, ProgressGauge, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateSIPSummary } from './shared/aiSummaryGenerators';

interface SIPCalculatorProps {
    onBack?: () => void;
}

const goals = [
    { id: 'house', name: 'House', icon: Home, color: '#3b82f6' },
    { id: 'car', name: 'Car', icon: Car, color: '#10b981' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: '#8b5cf6' },
    { id: 'vacation', name: 'Vacation', icon: Plane, color: '#f59e0b' },
    { id: 'custom', name: 'Custom', icon: Wallet, color: '#ec4899' },
];

const riskProfiles = [
    { id: 'conservative', name: 'Conservative', rate: 8, description: 'Debt funds, FDs' },
    { id: 'moderate', name: 'Moderate', rate: 12, description: 'Balanced funds' },
    { id: 'aggressive', name: 'Aggressive', rate: 15, description: 'Equity funds' },
];

export function SIPCalculator({ onBack }: SIPCalculatorProps) {
    const [monthly, setMonthly] = useState(10000);
    const [years, setYears] = useState(15);
    const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
    const [targetAmount, setTargetAmount] = useState(5000000);
    const [selectedRisk, setSelectedRisk] = useState('moderate');
    const [stepUpEnabled, setStepUpEnabled] = useState(false);
    const [stepUpPercent, setStepUpPercent] = useState(10);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const rate = riskProfiles.find((r) => r.id === selectedRisk)?.rate || 12;

    // Calculate SIP results
    const result = useMemo(() => {
        if (!monthly || !years) return null;

        const r = rate / 12 / 100;
        const n = years * 12;

        let futureValue: number;
        let totalInvested: number;

        if (stepUpEnabled) {
            futureValue = 0;
            totalInvested = 0;
            let currentMonthly = monthly;

            for (let year = 1; year <= years; year++) {
                const yearlyInvested = currentMonthly * 12;
                totalInvested += yearlyInvested;
                const yearsRemaining = years - year;
                const fv = currentMonthly * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
                futureValue += fv * Math.pow(1 + rate / 100, yearsRemaining);
                currentMonthly *= (1 + stepUpPercent / 100);
            }
        } else {
            futureValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
            totalInvested = monthly * n;
        }

        const earnings = futureValue - totalInvested;
        const growthMultiple = futureValue / totalInvested;

        return { futureValue, invested: totalInvested, earnings, growthMultiple };
    }, [monthly, rate, years, stepUpEnabled, stepUpPercent]);

    // Generate yearly data for chart
    const yearlyData = useMemo(() => {
        if (!result) return [];

        const data = [];
        const r = rate / 12 / 100;

        for (let year = 0; year <= years; year++) {
            const n = year * 12;
            let value: number;
            let invested: number;

            if (stepUpEnabled) {
                value = 0;
                invested = 0;
                let currentMonthly = monthly;

                for (let y = 1; y <= year; y++) {
                    invested += currentMonthly * 12;
                    const yearsRemaining = year - y;
                    const fv = currentMonthly * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
                    value += fv * Math.pow(1 + rate / 100, yearsRemaining);
                    currentMonthly *= (1 + stepUpPercent / 100);
                }
            } else {
                value = year === 0 ? 0 : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
                invested = monthly * n;
            }

            data.push({ year, value, invested });
        }

        return data;
    }, [monthly, rate, years, stepUpEnabled, stepUpPercent]);

    // Calculate milestones
    const milestones = useMemo(() => {
        const targets = [500000, 1000000, 2500000, 5000000, 10000000];
        return targets.map((target) => {
            const yearToReach = yearlyData.findIndex((d) => d.value >= target);
            return {
                amount: target,
                year: yearToReach > 0 ? yearToReach : null,
            };
        }).filter((m) => m.year !== null && m.year <= years);
    }, [yearlyData, years]);

    // AI Summary generator
    const handleGenerateSummary = useCallback(() => {
        if (!result) return [];
        return generateSIPSummary(monthly, rate, years, result.invested, result.earnings, result.futureValue);
    }, [monthly, rate, years, result]);

    // Goal progress
    const goalProgress = result ? (result.futureValue / targetAmount) * 100 : 0;

    // Pie chart data
    const pieData = result ? [
        { label: 'Invested', value: result.invested, color: '#a855f7' },
        { label: 'Returns', value: result.earnings, color: '#22c55e' },
    ] : [];

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
        return `₹${value.toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner
                title="SIP Calculator"
                description="Plan your systematic investment journey"
                icon={TrendingUp}
                gradient="from-purple-600 to-violet-700"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={result ? [
                    { label: 'Future Value', value: formatCurrency(result.futureValue) },
                    { label: 'Growth', value: `${result.growthMultiple.toFixed(1)}x` },
                    { label: 'Returns', value: formatCurrency(result.earnings) },
                ] : []}
            />

            {/* Goal Selection */}
            <GlassCard title="Investment Goal" icon={Target}>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {goals.map((goal) => {
                        const Icon = goal.icon;
                        const isSelected = selectedGoal === goal.id;
                        return (
                            <button
                                key={goal.id}
                                onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[80px] ${isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300'
                                    }`}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${goal.color}20` }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: goal.color }} />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{goal.name}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedGoal && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5"
                    >
                        <SliderInput
                            label="Target Amount"
                            value={targetAmount}
                            onChange={setTargetAmount}
                            min={100000}
                            max={50000000}
                            step={100000}
                            prefix="₹"
                            formatValue={formatCurrency}
                            quickValues={[1000000, 2500000, 5000000, 10000000]}
                        />
                    </motion.div>
                )}
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <GlassCard title="Investment Details" icon={Wallet}>
                        <div className="space-y-6">
                            <SliderInput
                                label="Monthly Investment"
                                value={monthly}
                                onChange={setMonthly}
                                min={500}
                                max={500000}
                                step={500}
                                prefix="₹"
                                formatValue={(v) => v.toLocaleString()}
                                quickValues={[5000, 10000, 25000, 50000, 100000]}
                            />

                            {/* Risk Profile */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Expected Return
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {riskProfiles.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => setSelectedRisk(profile.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedRisk === profile.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className={`w-4 h-4 ${selectedRisk === profile.id ? 'text-blue-600' : 'text-gray-400'
                                                    }`} />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {profile.rate}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{profile.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <SliderInput
                                label="Time Period"
                                value={years}
                                onChange={setYears}
                                min={1}
                                max={40}
                                step={1}
                                suffix=" Years"
                                quickValues={[5, 10, 15, 20, 25, 30]}
                            />

                            {/* Step-up Option */}
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Step-up SIP</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Increase SIP annually</p>
                                    </div>
                                    <button
                                        onClick={() => setStepUpEnabled(!stepUpEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors ${stepUpEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        <motion.div
                                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                                            animate={{ x: stepUpEnabled ? 26 : 2 }}
                                        />
                                    </button>
                                </div>
                                {stepUpEnabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <SliderInput
                                            label="Annual Increase"
                                            value={stepUpPercent}
                                            onChange={setStepUpPercent}
                                            min={5}
                                            max={25}
                                            step={1}
                                            suffix="%"
                                            quickValues={[5, 10, 15, 20]}
                                        />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Results Cards */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-purple-200/50 dark:border-purple-500/20 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Invested</p>
                                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(result.invested)}</p>
                            </div>
                            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-green-200/50 dark:border-green-500/20 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Est. Returns</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(result.earnings)}</p>
                            </div>
                            <div className="col-span-2 bg-white dark:bg-[#171717] rounded-xl p-4 border border-blue-200/50 dark:border-blue-500/20 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Value</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(result.futureValue)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Growth</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{result.growthMultiple.toFixed(1)}x</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Advisor Modal */}
                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="SIP Calculator"
                        calculatorContext={result ? [
                            { label: 'Monthly', value: `₹${formatCurrency(monthly)}` },
                            { label: 'Rate', value: `${rate}%` },
                            { label: 'Years', value: `${years}` },
                            { label: 'Total Value', value: formatCurrency(result.futureValue) },
                        ] : []}
                        generateSummary={handleGenerateSummary}
                    />
                </div>

                {/* Visualization Section */}
                <div className="space-y-6">
                    {/* Goal Progress Gauge */}
                    {selectedGoal && result && (
                        <GlassCard title="Goal Progress" icon={Target}>
                            <div className="flex justify-center">
                                <ProgressGauge
                                    value={result.futureValue}
                                    max={targetAmount}
                                    label={goalProgress >= 100 ? '🎉 Goal Achieved!' : `Target: ${formatCurrency(targetAmount)}`}
                                    sublabel={goalProgress >= 100 ? undefined : `${Math.round(goalProgress)}% complete`}
                                    color={goalProgress >= 100 ? '#22c55e' : '#3b82f6'}
                                />
                            </div>
                        </GlassCard>
                    )}

                    {/* Pie Chart */}
                    {result && (
                        <GlassCard title="Investment Breakdown" icon={PieChartIcon}>
                            <PieChart data={pieData} size={200} />
                        </GlassCard>
                    )}

                    {/* Wealth Growth Chart */}
                    {yearlyData.length > 0 && (
                        <GlassCard title="Wealth Growth Over Time" icon={BarChart3}>
                            <GrowthChart
                                data={yearlyData}
                                height={200}
                                formatValue={(v) => formatCurrency(v)}
                            />
                        </GlassCard>
                    )}

                    {/* Milestones */}
                    {milestones.length > 0 && (
                        <GlassCard title="Milestone Tracker" icon={Target}>
                            <div className="space-y-3">
                                {milestones.map((milestone, index) => (
                                    <motion.div
                                        key={milestone.amount}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-20 text-right">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(milestone.amount)}
                                            </span>
                                        </div>
                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(milestone.year! / years) * 100}%` }}
                                                transition={{ delay: 0.5, duration: 0.5 }}
                                            />
                                        </div>
                                        <div className="w-16">
                                            <span className="text-sm text-gray-500">Year {milestone.year}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share</span>
                </button>
            </div>
        </div>
    );
}
