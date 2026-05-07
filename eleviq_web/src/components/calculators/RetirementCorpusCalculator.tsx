'use client';

import { useState, useMemo, useCallback } from 'react';
import { Flame, Users, Settings2, BarChart3 } from 'lucide-react';
import { SliderInput, ProgressGauge, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface RetirementCorpusCalculatorProps {
    onBack?: () => void;
}

export function RetirementCorpusCalculator({ onBack }: RetirementCorpusCalculatorProps) {
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
    const [currentSavings, setCurrentSavings] = useState(500000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [inflationRate, setInflationRate] = useState(6);
    const [lifeExpectancy, setLifeExpectancy] = useState(85);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const yearsToRetirement = retirementAge - currentAge;
        const yearsInRetirement = lifeExpectancy - retirementAge;
        const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
        const realReturnInRetirement = (expectedReturn - inflationRate) / 100;
        const annualExpensesAtRetirement = futureMonthlyExpenses * 12;
        const requiredCorpus = annualExpensesAtRetirement * ((1 - Math.pow(1 + realReturnInRetirement, -yearsInRetirement)) / realReturnInRetirement);
        const fvCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
        const gap = requiredCorpus - fvCurrentSavings;
        const r = expectedReturn / 12 / 100;
        const n = yearsToRetirement * 12;
        const monthlySIP = gap > 0 ? (gap * r) / ((Math.pow(1 + r, n) - 1) * (1 + r)) : 0;
        const progress = Math.min(100, (fvCurrentSavings / requiredCorpus) * 100);
        return { requiredCorpus, fvCurrentSavings, gap: Math.max(0, gap), monthlySIP: Math.max(0, monthlySIP), futureMonthlyExpenses, progress, yearsToRetirement };
    }, [currentAge, retirementAge, monthlyExpenses, currentSavings, expectedReturn, inflationRate, lifeExpectancy]);

    const yearlyData = useMemo(() => {
        const data = [];
        let savings = currentSavings;
        const monthlyContribution = result.monthlySIP;
        for (let year = 0; year <= result.yearsToRetirement; year++) {
            data.push({ year, value: savings });
            savings = savings * (1 + expectedReturn / 100) + (monthlyContribution * 12);
        }
        return data;
    }, [currentSavings, result.yearsToRetirement, expectedReturn, result.monthlySIP]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Retirement Corpus', [
            { label: 'Expenses', value: `₹${monthlyExpenses.toLocaleString()}` },
            { label: 'Retire At', value: `${retirementAge}` },
        ], {
            summaryText: `To maintain your current lifestyle of ₹${monthlyExpenses.toLocaleString()}/month after retirement at age ${retirementAge}, you need a corpus of ${formatCurrency(result.requiredCorpus)}. Your current savings of ${formatCurrency(currentSavings)} will grow to ${formatCurrency(result.fvCurrentSavings)}, leaving a gap of ${formatCurrency(result.gap)} that requires a monthly SIP of ${formatCurrency(result.monthlySIP)}.`,
            insightText: `At ${inflationRate}% inflation, your monthly expenses will be ${formatCurrency(result.futureMonthlyExpenses)} at retirement. ${result.progress < 50 ? 'You are below 50% progress — the earlier you start, the less you need to invest monthly thanks to compounding.' : 'Good progress! You\'re on track with ' + result.progress.toFixed(0) + '% of your goal covered.'} A ${result.yearsToRetirement}-year investment horizon gives you good time to ride out market volatility.`,
            recommendationText: `Start with equity-heavy allocation (70-80%) in your early years and gradually shift to debt as you approach retirement. Consider inflation-protected instruments like equity mutual funds for long-term goals. Build an emergency fund covering 6-12 months of expenses before aggressive investing.`,
        });
    }, [monthlyExpenses, retirementAge, currentSavings, inflationRate, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Retirement Corpus"
                description="Calculate how much you need for a worry-free retirement"
                icon={Flame}
                gradient="from-red-500 to-rose-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Corpus Needed', value: formatCurrency(result.requiredCorpus) },
                    { label: 'Monthly SIP', value: formatCurrency(result.monthlySIP) },
                    { label: 'Progress', value: `${result.progress.toFixed(0)}%` },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Your Profile" icon={Users}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <SliderInput label="Current Age" value={currentAge} onChange={setCurrentAge} min={20} max={55} step={1} suffix=" yrs" />
                                <SliderInput label="Retire At" value={retirementAge} onChange={setRetirementAge} min={currentAge + 5} max={70} step={1} suffix=" yrs" />
                            </div>
                            <SliderInput label="Monthly Expenses" value={monthlyExpenses} onChange={setMonthlyExpenses} min={20000} max={500000} step={5000} prefix="₹" quickValues={[30000, 50000, 75000, 100000]} />
                            <SliderInput label="Current Savings" value={currentSavings} onChange={setCurrentSavings} min={0} max={50000000} step={100000} prefix="₹" formatValue={(v) => formatCurrency(v)} />
                        </div>
                    </GlassCard>

                    <GlassCard title="Assumptions" icon={Settings2}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <SliderInput label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} min={6} max={18} step={0.5} suffix="% p.a." />
                                <SliderInput label="Inflation" value={inflationRate} onChange={setInflationRate} min={3} max={10} step={0.5} suffix="% p.a." />
                            </div>
                            <SliderInput label="Life Expectancy" value={lifeExpectancy} onChange={setLifeExpectancy} min={70} max={100} step={1} suffix=" yrs" />
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Your Retirement Plan">
                        <div className="flex justify-center mb-6">
                            <ProgressGauge value={result.progress} max={100} label="Progress" />
                        </div>
                        <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-xl p-6 text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Corpus Required</p>
                            <p className="text-4xl font-bold text-red-600">{formatCurrency(result.requiredCorpus)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Future expenses: {formatCurrency(result.futureMonthlyExpenses)}/month
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly SIP</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.monthlySIP)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gap to Fill</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.gap)}</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Projected Growth" icon={BarChart3}>
                        <GrowthChart data={yearlyData} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Retirement Corpus"
                        calculatorContext={[
                            { label: 'Expenses', value: `₹${monthlyExpenses.toLocaleString()}` },
                            { label: 'Retire At', value: `${retirementAge} yrs` },
                            { label: 'Corpus', value: formatCurrency(result.requiredCorpus) },
                            { label: 'Monthly SIP', value: formatCurrency(result.monthlySIP) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
