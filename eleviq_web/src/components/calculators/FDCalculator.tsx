'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, PieChart as PieChartIcon, Settings2, FileText } from 'lucide-react';
import { SliderInput, PieChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface FDCalculatorProps {
    onBack?: () => void;
}

export function FDCalculator({ onBack }: FDCalculatorProps) {
    const [principal, setPrincipal] = useState(500000);
    const [interestRate, setInterestRate] = useState(7);
    const [tenure, setTenure] = useState(5);
    const [compounding, setCompounding] = useState<'yearly' | 'quarterly' | 'monthly'>('quarterly');
    const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const frequencyMap = { yearly: 1, quarterly: 4, monthly: 12 };

    const result = useMemo(() => {
        const effectiveRate = isSeniorCitizen ? interestRate + 0.5 : interestRate;
        const n = frequencyMap[compounding];
        const maturityAmount = principal * Math.pow(1 + effectiveRate / 100 / n, n * tenure);
        const interest = maturityAmount - principal;
        const effectiveYield = ((maturityAmount / principal) - 1) / tenure * 100;
        return { maturityAmount, interest, principal, effectiveRate, effectiveYield };
    }, [principal, interestRate, tenure, compounding, isSeniorCitizen]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const pieData = [
        { label: 'Principal', value: result.principal, color: '#3b82f6' },
        { label: 'Interest', value: result.interest, color: '#10b981' },
    ];

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Fixed Deposit', [
            { label: 'Amount', value: formatCurrency(principal) },
            { label: 'Rate', value: `${result.effectiveRate}%` },
        ], {
            summaryText: `Your Fixed Deposit of ${formatCurrency(principal)} at ${result.effectiveRate}% for ${tenure} years with ${compounding} compounding will mature at ${formatCurrency(result.maturityAmount)}. You'll earn ${formatCurrency(result.interest)} as interest with an effective yield of ${result.effectiveYield.toFixed(2)}% per annum.`,
            insightText: `${isSeniorCitizen ? 'You\'re benefiting from the senior citizen rate bonus of 0.5%.' : 'Senior citizens get an additional 0.5% rate — if eligible, consider opening the FD in their name.'} ${interestRate < 7 ? 'Current FD rates are on the lower side. Consider spreading across multiple banks for the best rates, or explore debt mutual funds for potentially better post-tax returns.' : 'Your FD rate is competitive in the current market.'}`,
            recommendationText: `FDs offer guaranteed returns and capital safety, making them ideal for short-term goals and emergency funds. Consider laddering your FDs — splitting the amount into multiple FDs with different maturities — for better liquidity management.`,
        });
    }, [principal, interestRate, tenure, compounding, isSeniorCitizen, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="FD Calculator"
                description="Calculate Fixed Deposit maturity amount"
                icon={Building2}
                gradient="from-blue-500 to-indigo-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Maturity', value: formatCurrency(result.maturityAmount) },
                    { label: 'Interest', value: formatCurrency(result.interest) },
                    { label: 'Rate', value: `${result.effectiveRate}%` },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="FD Details" icon={FileText}>
                        <div className="space-y-6">
                            <SliderInput label="Deposit Amount" value={principal} onChange={setPrincipal} min={10000} max={10000000} step={10000} prefix="₹" formatValue={(v) => formatCurrency(v)} quickValues={[100000, 500000, 1000000, 2500000]} />
                            <SliderInput label="Interest Rate" value={interestRate} onChange={setInterestRate} min={3} max={10} step={0.1} suffix="% p.a." />
                            <SliderInput label="Tenure" value={tenure} onChange={setTenure} min={1} max={10} step={1} suffix=" yrs" quickValues={[1, 2, 3, 5]} />

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Senior Citizen (+0.5%)</span>
                                <button onClick={() => setIsSeniorCitizen(!isSeniorCitizen)}
                                    className={`w-12 h-6 rounded-full transition-colors ${isSeniorCitizen ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <motion.div className="w-5 h-5 bg-white rounded-full shadow-md" animate={{ x: isSeniorCitizen ? 26 : 2 }} />
                                </button>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Compounding" icon={Settings2}>
                        <div className="grid grid-cols-3 gap-3">
                            {(['yearly', 'quarterly', 'monthly'] as const).map((freq) => (
                                <button key={freq} onClick={() => setCompounding(freq)}
                                    className={`p-3 rounded-xl border-2 text-sm font-medium capitalize ${compounding === freq
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                                        : 'border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}>
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Maturity Details" icon={PieChartIcon}>
                        <div className="text-center p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Maturity Amount</p>
                            <p className="text-4xl font-bold text-blue-600">{formatCurrency(result.maturityAmount)}</p>
                            <p className="text-sm text-green-600 mt-1">+{formatCurrency(result.interest)} interest</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Effective Rate</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{result.effectiveRate}%</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Effective Yield</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{result.effectiveYield.toFixed(2)}%</p>
                            </div>
                        </div>

                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="FD Calculator"
                        calculatorContext={[
                            { label: 'Amount', value: formatCurrency(principal) },
                            { label: 'Rate', value: `${result.effectiveRate}%` },
                            { label: 'Tenure', value: `${tenure} yrs` },
                            { label: 'Maturity', value: formatCurrency(result.maturityAmount) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
