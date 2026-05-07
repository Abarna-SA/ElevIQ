'use client';

import { useState, useMemo, useCallback } from 'react';
import { PiggyBank, TrendingUp, BarChart3, PieChart as PieChartIcon, Settings2 } from 'lucide-react';
import { SliderInput, PieChart, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface CompoundInterestCalculatorProps {
    onBack?: () => void;
}

export function CompoundInterestCalculator({ onBack }: CompoundInterestCalculatorProps) {
    const [principal, setPrincipal] = useState(100000);
    const [rate, setRate] = useState(10);
    const [timePeriod, setTimePeriod] = useState(10);
    const [compoundingFrequency, setCompoundingFrequency] = useState<'yearly' | 'half-yearly' | 'quarterly' | 'monthly'>('yearly');
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const frequencyMap = { yearly: 1, 'half-yearly': 2, quarterly: 4, monthly: 12 };

    const result = useMemo(() => {
        const n = frequencyMap[compoundingFrequency];
        const amount = principal * Math.pow(1 + rate / 100 / n, n * timePeriod);
        const interest = amount - principal;
        const simpleInterest = principal * rate / 100 * timePeriod;
        const compoundBenefit = interest - simpleInterest;
        return { amount, interest, principal, simpleInterest, compoundBenefit };
    }, [principal, rate, timePeriod, compoundingFrequency]);

    const yearlyData = useMemo(() => {
        const data = [];
        const n = frequencyMap[compoundingFrequency];
        for (let year = 0; year <= timePeriod; year++) {
            data.push({ year, value: principal * Math.pow(1 + rate / 100 / n, n * year) });
        }
        return data;
    }, [principal, rate, timePeriod, compoundingFrequency]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const pieData = [
        { label: 'Principal', value: result.principal, color: '#6366f1' },
        { label: 'Interest', value: result.interest, color: '#10b981' },
    ];

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Compound Interest', [
            { label: 'Principal', value: formatCurrency(principal) },
            { label: 'Rate', value: `${rate}%` },
            { label: 'Period', value: `${timePeriod} yrs` },
        ], {
            summaryText: `Your principal of ${formatCurrency(principal)} at ${rate}% ${compoundingFrequency} compounding for ${timePeriod} years will grow to ${formatCurrency(result.amount)}. You'll earn ${formatCurrency(result.interest)} as interest — that's a ${((result.amount / principal - 1) * 100).toFixed(0)}% total return.`,
            insightText: `Compound interest gives you ${formatCurrency(result.compoundBenefit)} more than simple interest. ${compoundingFrequency !== 'monthly' ? 'Switching to monthly compounding could boost your returns further.' : 'You\'re already using the most frequent compounding.'} At ${rate}%, your money doubles approximately every ${Math.round(72 / rate)} years (Rule of 72).`,
            recommendationText: `Consider increasing your investment period or principal to maximize compounding benefits. Even a 1% increase in returns from ${rate}% to ${rate + 1}% over ${timePeriod} years would give you ${formatCurrency(principal * Math.pow(1 + (rate + 1) / 100, timePeriod) - result.amount)} extra.`,
        });
    }, [principal, rate, timePeriod, compoundingFrequency, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Compound Interest"
                description="Experience the power of compound growth"
                icon={PiggyBank}
                gradient="from-purple-500 to-violet-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Total Amount', value: formatCurrency(result.amount) },
                    { label: 'Interest Earned', value: formatCurrency(result.interest) },
                    { label: 'Rate', value: `${rate}%` },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Investment Details" icon={TrendingUp}>
                        <div className="space-y-6">
                            <SliderInput label="Principal Amount" value={principal} onChange={setPrincipal} min={1000} max={10000000} step={1000} prefix="₹" formatValue={(v) => formatCurrency(v)} quickValues={[100000, 500000, 1000000, 2500000]} />
                            <SliderInput label="Interest Rate" value={rate} onChange={setRate} min={1} max={25} step={0.5} suffix="% p.a." />
                            <SliderInput label="Time Period" value={timePeriod} onChange={setTimePeriod} min={1} max={30} step={1} suffix=" yrs" quickValues={[5, 10, 15, 20]} />
                        </div>
                    </GlassCard>

                    <GlassCard title="Compounding Frequency" icon={Settings2}>
                        <div className="grid grid-cols-2 gap-3">
                            {(['yearly', 'half-yearly', 'quarterly', 'monthly'] as const).map((freq) => (
                                <button key={freq} onClick={() => setCompoundingFrequency(freq)}
                                    className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${compoundingFrequency === freq
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-600'
                                        : 'border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-200'}`}>
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Returns" icon={PieChartIcon}>
                        <div className="text-center p-6 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-xl mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.amount)}</p>
                            <p className="text-sm text-green-600 mt-1">Interest: +{formatCurrency(result.interest)}</p>
                        </div>
                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <GlassCard title="Growth Chart" icon={BarChart3}>
                        <GrowthChart data={yearlyData} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Compound Interest Calculator"
                        calculatorContext={[
                            { label: 'Principal', value: formatCurrency(principal) },
                            { label: 'Rate', value: `${rate}%` },
                            { label: 'Period', value: `${timePeriod} yrs` },
                            { label: 'Amount', value: formatCurrency(result.amount) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
