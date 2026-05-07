'use client';

import { useState, useMemo, useCallback } from 'react';
import { Target, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { SliderInput, ProgressGauge, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface GoalPlannerProps {
    onBack?: () => void;
}

const goals = [
    { id: 'house', name: 'Dream Home', icon: '🏠', defaultAmount: 10000000 },
    { id: 'car', name: 'New Car', icon: '🚗', defaultAmount: 1500000 },
    { id: 'education', name: 'Education', icon: '🎓', defaultAmount: 3000000 },
    { id: 'wedding', name: 'Wedding', icon: '💒', defaultAmount: 2000000 },
    { id: 'vacation', name: 'Vacation', icon: '✈️', defaultAmount: 500000 },
    { id: 'custom', name: 'Custom Goal', icon: '🎯', defaultAmount: 1000000 },
];

export function GoalPlanner({ onBack }: GoalPlannerProps) {
    const [selectedGoal, setSelectedGoal] = useState('house');
    const [targetAmount, setTargetAmount] = useState(10000000);
    const [targetYears, setTargetYears] = useState(10);
    const [currentSavings, setCurrentSavings] = useState(500000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const r = expectedReturn / 12 / 100;
        const n = targetYears * 12;
        const fvCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, targetYears);
        const requiredFromSIP = targetAmount - fvCurrentSavings;
        const monthlySIP = requiredFromSIP > 0 ? (requiredFromSIP * r) / ((Math.pow(1 + r, n) - 1) * (1 + r)) : 0;
        const progress = Math.min(100, (fvCurrentSavings / targetAmount) * 100);
        return { monthlySIP: Math.max(0, monthlySIP), fvCurrentSavings, progress, requiredFromSIP: Math.max(0, requiredFromSIP), totalInvestment: currentSavings + (monthlySIP * n) };
    }, [targetAmount, targetYears, currentSavings, expectedReturn]);

    const yearlyData = useMemo(() => {
        const data = [];
        let savings = currentSavings;
        const monthlySIP = result.monthlySIP;
        for (let year = 0; year <= targetYears; year++) {
            data.push({ year, value: savings });
            savings = savings * (1 + expectedReturn / 100) + (monthlySIP * 12);
        }
        return data;
    }, [currentSavings, targetYears, expectedReturn, result.monthlySIP]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Goal Planner', [
            { label: 'Target', value: formatCurrency(targetAmount) },
            { label: 'Timeline', value: `${targetYears} yrs` },
        ], {
            summaryText: `To reach your goal of ${formatCurrency(targetAmount)} in ${targetYears} years, you need to invest ${formatCurrency(result.monthlySIP)} monthly. Your current savings of ${formatCurrency(currentSavings)} will grow to ${formatCurrency(result.fvCurrentSavings)}, covering ${result.progress.toFixed(0)}% of your target.`,
            insightText: `${result.progress >= 50 ? 'Great progress! Your current savings already cover more than half your goal.' : 'Your current savings cover ' + result.progress.toFixed(0) + '% of your goal — consistent investing will close the gap.'} ${result.monthlySIP > 50000 ? 'The required monthly SIP is high. Consider extending your timeline or increasing your initial savings to reduce the monthly commitment.' : 'The monthly SIP amount is manageable for most income levels.'}`,
            recommendationText: `Start your SIP as early as possible — even a 1-year delay can significantly increase the required monthly investment. Consider automating your investments through auto-debit to maintain discipline. Review and increase your SIP by 10% annually to stay ahead of inflation.`,
        });
    }, [targetAmount, targetYears, currentSavings, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Goal Planner"
                description="Plan investments to achieve your financial goals"
                icon={Target}
                gradient="from-teal-500 to-cyan-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Monthly SIP', value: formatCurrency(result.monthlySIP) },
                    { label: 'Progress', value: `${result.progress.toFixed(0)}%` },
                    { label: 'Target', value: formatCurrency(targetAmount) },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Select Your Goal" icon={Target}>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {goals.map((goal) => (
                                <button key={goal.id} onClick={() => { setSelectedGoal(goal.id); setTargetAmount(goal.defaultAmount); }}
                                    className={`p-4 rounded-xl border-2 transition-all text-center ${selectedGoal === goal.id
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
                                        : 'border-gray-100 dark:border-white/10 hover:border-gray-200'}`}>
                                    <span className="text-2xl">{goal.icon}</span>
                                    <p className="text-sm font-medium mt-1 text-gray-900 dark:text-white">{goal.name}</p>
                                </button>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <SliderInput label="Target Amount" value={targetAmount} onChange={setTargetAmount} min={100000} max={100000000} step={100000} prefix="₹" formatValue={(v) => formatCurrency(v)} />
                            <SliderInput label="Target Years" value={targetYears} onChange={setTargetYears} min={1} max={30} step={1} suffix=" yrs" quickValues={[5, 10, 15, 20]} />
                        </div>
                    </GlassCard>

                    <GlassCard title="Your Current Position" icon={Calendar}>
                        <div className="space-y-6">
                            <SliderInput label="Current Savings" value={currentSavings} onChange={setCurrentSavings} min={0} max={targetAmount * 0.5} step={10000} prefix="₹" formatValue={(v) => formatCurrency(v)} />
                            <SliderInput label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} min={6} max={20} step={0.5} suffix="% p.a." />
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Your Plan">
                        <div className="flex justify-center mb-6">
                            <ProgressGauge value={result.progress} max={100} label="Goal Progress" />
                        </div>
                        <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-xl p-6 text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Required Monthly SIP</p>
                            <p className="text-4xl font-bold text-teal-600">{formatCurrency(result.monthlySIP)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">for {targetYears} years</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Current Savings FV</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(result.fvCurrentSavings)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">From SIP</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(result.requiredFromSIP)}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Projection" icon={BarChart3}>
                        <GrowthChart data={yearlyData} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Goal Planner"
                        calculatorContext={[
                            { label: 'Target', value: formatCurrency(targetAmount) },
                            { label: 'Timeline', value: `${targetYears} yrs` },
                            { label: 'Savings', value: formatCurrency(currentSavings) },
                            { label: 'Monthly SIP', value: formatCurrency(result.monthlySIP) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
