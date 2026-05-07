'use client';

import { useState, useMemo, useCallback } from 'react';
import { Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { SliderInput, PieChart, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface RDCalculatorProps {
    onBack?: () => void;
}

export function RDCalculator({ onBack }: RDCalculatorProps) {
    const [monthlyDeposit, setMonthlyDeposit] = useState(10000);
    const [interestRate, setInterestRate] = useState(7);
    const [tenure, setTenure] = useState(5);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const r = interestRate / 100 / 4;
        const n = tenure * 12;
        const maturityAmount = monthlyDeposit * ((Math.pow(1 + r, n / 3) - 1) / (1 - Math.pow(1 + r, -1 / 3)));
        const totalDeposit = monthlyDeposit * n;
        const interest = maturityAmount - totalDeposit;
        return { maturityAmount, interest, totalDeposit, monthsToMature: n };
    }, [monthlyDeposit, interestRate, tenure]);

    const yearlyData = useMemo(() => {
        const data = [];
        const r = interestRate / 100 / 4;
        for (let month = 0; month <= tenure * 12; month += 12) {
            const deposited = monthlyDeposit * month;
            const value = monthlyDeposit * ((Math.pow(1 + r, month / 3) - 1) / (1 - Math.pow(1 + r, -1 / 3)));
            data.push({ year: month / 12, value: Math.max(deposited, value) });
        }
        return data;
    }, [monthlyDeposit, interestRate, tenure]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const pieData = [
        { label: 'Total Deposit', value: result.totalDeposit, color: '#8b5cf6' },
        { label: 'Interest', value: result.interest, color: '#10b981' },
    ];

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Recurring Deposit', [
            { label: 'Monthly', value: formatCurrency(monthlyDeposit) },
            { label: 'Rate', value: `${interestRate}%` },
        ], {
            summaryText: `By depositing ${formatCurrency(monthlyDeposit)} every month for ${tenure} years at ${interestRate}%, your total deposit of ${formatCurrency(result.totalDeposit)} will mature at ${formatCurrency(result.maturityAmount)}. You'll earn ${formatCurrency(result.interest)} as interest over ${result.monthsToMature} months.`,
            insightText: `RDs are excellent for building saving discipline through fixed monthly commitments. ${interestRate < 7 ? 'However, the current rate is relatively low. Consider comparing rates across banks or exploring SIPs in debt mutual funds for potentially better post-tax returns.' : 'Your RD rate is competitive for guaranteed returns.'} The power of regular savings means small monthly amounts grow into significant sums over time.`,
            recommendationText: `Consider setting up auto-debit for your RD to ensure consistent savings. If you have surplus funds beyond your RD, pair it with a SIP for equity exposure to beat inflation. A mix of RD for safety and SIP for growth creates a balanced portfolio.`,
        });
    }, [monthlyDeposit, interestRate, tenure, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="RD Calculator"
                description="Calculate Recurring Deposit returns"
                icon={Wallet}
                gradient="from-violet-500 to-purple-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Maturity', value: formatCurrency(result.maturityAmount) },
                    { label: 'Interest', value: formatCurrency(result.interest) },
                    { label: 'Deposited', value: formatCurrency(result.totalDeposit) },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="RD Details" icon={Wallet}>
                        <div className="space-y-6">
                            <SliderInput label="Monthly Deposit" value={monthlyDeposit} onChange={setMonthlyDeposit} min={500} max={100000} step={500} prefix="₹" quickValues={[5000, 10000, 25000, 50000]} />
                            <SliderInput label="Interest Rate" value={interestRate} onChange={setInterestRate} min={3} max={10} step={0.1} suffix="% p.a." />
                            <SliderInput label="Tenure" value={tenure} onChange={setTenure} min={1} max={10} step={1} suffix=" yrs" quickValues={[1, 2, 3, 5]} />
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Maturity Details" icon={PieChartIcon}>
                        <div className="text-center p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Maturity Amount</p>
                            <p className="text-4xl font-bold text-violet-600">{formatCurrency(result.maturityAmount)}</p>
                            <p className="text-sm text-green-600 mt-1">+{formatCurrency(result.interest)} interest</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Deposit</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.totalDeposit)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{result.monthsToMature} months</p>
                            </div>
                        </div>
                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <GlassCard title="Growth Over Time" icon={BarChart3}>
                        <GrowthChart data={yearlyData} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="RD Calculator"
                        calculatorContext={[
                            { label: 'Monthly', value: formatCurrency(monthlyDeposit) },
                            { label: 'Rate', value: `${interestRate}%` },
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
