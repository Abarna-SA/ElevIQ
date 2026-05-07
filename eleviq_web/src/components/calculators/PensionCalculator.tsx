'use client';

import { useState, useMemo, useCallback } from 'react';
import { PiggyBank, Users, BarChart3, PieChart as PieChartIcon, Settings2 } from 'lucide-react';
import { SliderInput, PieChart, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface PensionCalculatorProps {
    onBack?: () => void;
}

export function PensionCalculator({ onBack }: PensionCalculatorProps) {
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyContribution, setMonthlyContribution] = useState(10000);
    const [employerContribution, setEmployerContribution] = useState(10000);
    const [currentCorpus, setCurrentCorpus] = useState(500000);
    const [expectedReturn, setExpectedReturn] = useState(10);
    const [annuityRate, setAnnuityRate] = useState(6);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const yearsToRetirement = retirementAge - currentAge;
        const n = yearsToRetirement * 12;
        const r = expectedReturn / 12 / 100;
        const totalMonthly = monthlyContribution + employerContribution;
        const fvCurrent = currentCorpus * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
        const fvContributions = totalMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        const totalCorpus = fvCurrent + fvContributions;
        const lumpsum = totalCorpus * 0.4;
        const annuityCorpus = totalCorpus * 0.6;
        const monthlyPension = (annuityCorpus * annuityRate / 100) / 12;
        const totalInvested = currentCorpus + (totalMonthly * n);
        const returns = totalCorpus - totalInvested;
        return { totalCorpus, lumpsum, annuityCorpus, monthlyPension, totalInvested, returns, yearsToRetirement };
    }, [currentAge, retirementAge, monthlyContribution, employerContribution, currentCorpus, expectedReturn, annuityRate]);

    const yearlyData = useMemo(() => {
        const data = [];
        let corpus = currentCorpus;
        const totalMonthly = monthlyContribution + employerContribution;
        for (let year = 0; year <= result.yearsToRetirement; year++) {
            data.push({ year, value: corpus });
            corpus = corpus * (1 + expectedReturn / 100) + (totalMonthly * 12);
        }
        return data;
    }, [currentCorpus, monthlyContribution, employerContribution, result.yearsToRetirement, expectedReturn]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const pieData = [
        { label: 'Lumpsum (40%)', value: result.lumpsum, color: '#10b981' },
        { label: 'Annuity (60%)', value: result.annuityCorpus, color: '#6366f1' },
    ];

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Pension (NPS)', [
            { label: 'Contribution', value: `₹${monthlyContribution.toLocaleString()}` },
            { label: 'Retire At', value: `${retirementAge}` },
        ], {
            summaryText: `With a monthly contribution of ₹${monthlyContribution.toLocaleString()} (plus ₹${employerContribution.toLocaleString()} from employer) and a current corpus of ${formatCurrency(currentCorpus)}, your NPS corpus will grow to ${formatCurrency(result.totalCorpus)} by age ${retirementAge}. You'll receive a lumpsum of ${formatCurrency(result.lumpsum)} and an estimated monthly pension of ${formatCurrency(result.monthlyPension)}.`,
            insightText: `Total invested: ${formatCurrency(result.totalInvested)}, returns: ${formatCurrency(result.returns)}. The 60:40 annuity-lumpsum split means 60% goes to buying an annuity for regular pension income. ${monthlyContribution < employerContribution ? 'Consider matching your contribution to your employer\'s for maximum benefit.' : 'Your personal contribution is well-balanced with employer contribution.'} NPS offers additional tax benefits of up to ₹50,000 under section 80CCD(1B).`,
            recommendationText: `Maximize your NPS tax benefits by investing ₹50,000 under 80CCD(1B) — this is over and above the ₹1.5L limit of Section 80C. Choose aggressive allocation (75% equity) if you’re under 40. Review and increase contributions annually to beat inflation.`,
        });
    }, [monthlyContribution, employerContribution, currentCorpus, retirementAge, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Pension Calculator"
                description="Estimate your NPS pension and retirement corpus"
                icon={PiggyBank}
                gradient="from-pink-500 to-rose-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Total Corpus', value: formatCurrency(result.totalCorpus) },
                    { label: 'Pension/month', value: formatCurrency(result.monthlyPension) },
                    { label: 'Lumpsum', value: formatCurrency(result.lumpsum) },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Your Profile" icon={Users}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <SliderInput label="Current Age" value={currentAge} onChange={setCurrentAge} min={18} max={55} step={1} suffix=" yrs" />
                                <SliderInput label="Retire At" value={retirementAge} onChange={setRetirementAge} min={currentAge + 5} max={70} step={1} suffix=" yrs" />
                            </div>
                            <SliderInput label="Current NPS Corpus" value={currentCorpus} onChange={setCurrentCorpus} min={0} max={10000000} step={50000} prefix="₹" formatValue={(v) => formatCurrency(v)} />
                        </div>
                    </GlassCard>

                    <GlassCard title="Contributions" icon={Settings2}>
                        <div className="space-y-6">
                            <SliderInput label="Your Monthly Contribution" value={monthlyContribution} onChange={setMonthlyContribution} min={500} max={100000} step={500} prefix="₹" quickValues={[5000, 10000, 25000, 50000]} />
                            <SliderInput label="Employer Contribution" value={employerContribution} onChange={setEmployerContribution} min={0} max={100000} step={500} prefix="₹" />
                            <div className="grid grid-cols-2 gap-4">
                                <SliderInput label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} min={6} max={15} step={0.5} suffix="%" />
                                <SliderInput label="Annuity Rate" value={annuityRate} onChange={setAnnuityRate} min={4} max={10} step={0.5} suffix="%" />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Retirement Benefits" icon={PieChartIcon}>
                        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl p-6 text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Corpus at Retirement</p>
                            <p className="text-4xl font-bold text-pink-600">{formatCurrency(result.totalCorpus)}</p>
                            <p className="text-sm text-green-600 mt-1">Returns: +{formatCurrency(result.returns)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lumpsum (40%)</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(result.lumpsum)}</p>
                            </div>
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Pension</p>
                                <p className="text-xl font-bold text-indigo-600">{formatCurrency(result.monthlyPension)}</p>
                            </div>
                        </div>
                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <GlassCard title="Corpus Growth" icon={BarChart3}>
                        <GrowthChart data={yearlyData} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Pension Calculator"
                        calculatorContext={[
                            { label: 'Your Contribution', value: `₹${monthlyContribution.toLocaleString()}` },
                            { label: 'Employer', value: `₹${employerContribution.toLocaleString()}` },
                            { label: 'Corpus', value: formatCurrency(result.totalCorpus) },
                            { label: 'Pension', value: formatCurrency(result.monthlyPension) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
