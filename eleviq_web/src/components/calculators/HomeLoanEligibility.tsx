'use client';

import { useState, useMemo, useCallback } from 'react';
import { Building2, Wallet, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { SliderInput, PieChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface HomeLoanEligibilityProps {
    onBack?: () => void;
}

export function HomeLoanEligibility({ onBack }: HomeLoanEligibilityProps) {
    const [monthlyIncome, setMonthlyIncome] = useState(150000);
    const [existingEMI, setExistingEMI] = useState(0);
    const [loanTenure, setLoanTenure] = useState(20);
    const [interestRate, setInterestRate] = useState(8.5);
    const [otherIncome, setOtherIncome] = useState(0);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const totalIncome = monthlyIncome + otherIncome;
        const foir = 0.5;
        const maxEMI = (totalIncome * foir) - existingEMI;
        const r = interestRate / 12 / 100;
        const n = loanTenure * 12;
        const maxLoan = maxEMI * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
        const maxPropertyValue = maxLoan / 0.8;
        const downPayment = maxPropertyValue - maxLoan;
        return { maxLoan: Math.max(0, maxLoan), maxEMI: Math.max(0, maxEMI), maxPropertyValue: Math.max(0, maxPropertyValue), downPayment: Math.max(0, downPayment), totalIncome };
    }, [monthlyIncome, existingEMI, loanTenure, interestRate, otherIncome]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Home Loan Eligibility', [
            { label: 'Income', value: formatCurrency(monthlyIncome) },
            { label: 'EMIs', value: formatCurrency(existingEMI) },
        ], {
            summaryText: `Based on your monthly income of ${formatCurrency(monthlyIncome)}${otherIncome > 0 ? ' plus ' + formatCurrency(otherIncome) + ' other income' : ''}, you're eligible for a home loan of up to ${formatCurrency(result.maxLoan)} at ${interestRate}% for ${loanTenure} years. Your maximum EMI capacity is ${formatCurrency(result.maxEMI)}/month (50% FOIR).`,
            insightText: `${existingEMI > monthlyIncome * 0.3 ? 'Your existing EMIs are over 30% of income, significantly reducing your eligibility. Consider paying off some loans first.' : 'Your existing EMI burden is manageable.'} You can look at properties up to ${formatCurrency(result.maxPropertyValue)} with a 20% down payment of ${formatCurrency(result.downPayment)}. A co-applicant with ₹50k income would increase eligibility by approximately ${formatCurrency(result.maxLoan * 0.33)}.`,
            recommendationText: `To maximize your eligibility: maintain a good credit score (750+), clear existing debts, and consider a longer tenure for higher eligibility. Compare rates across banks — even a 0.5% difference on a large loan can save lakhs over the tenure.`,
        });
    }, [monthlyIncome, existingEMI, otherIncome, loanTenure, interestRate, result]);

    const pieData = [
        { label: 'Loan Amount', value: result.maxLoan, color: '#3b82f6' },
        { label: 'Down Payment', value: result.downPayment, color: '#10b981' },
    ];

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Home Loan Eligibility"
                description="Check how much you can borrow based on your income"
                icon={Building2}
                gradient="from-blue-500 to-cyan-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Max Loan', value: formatCurrency(result.maxLoan) },
                    { label: 'Max EMI', value: formatCurrency(result.maxEMI) },
                    { label: 'Max Property', value: formatCurrency(result.maxPropertyValue) },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Income Details" icon={Wallet}>
                        <div className="space-y-6">
                            <SliderInput label="Monthly Salary" value={monthlyIncome} onChange={setMonthlyIncome} min={25000} max={1000000} step={5000} prefix="₹" quickValues={[50000, 100000, 150000, 250000]} />
                            <SliderInput label="Other Monthly Income" value={otherIncome} onChange={setOtherIncome} min={0} max={500000} step={5000} prefix="₹" />
                            <SliderInput label="Existing EMIs" value={existingEMI} onChange={setExistingEMI} min={0} max={200000} step={1000} prefix="₹" />
                        </div>
                    </GlassCard>

                    <GlassCard title="Loan Details" icon={FileText}>
                        <div className="space-y-6">
                            <SliderInput label="Loan Tenure" value={loanTenure} onChange={setLoanTenure} min={5} max={30} step={1} suffix=" yrs" quickValues={[10, 15, 20, 25, 30]} />
                            <SliderInput label="Interest Rate" value={interestRate} onChange={setInterestRate} min={6} max={15} step={0.1} suffix="% p.a." />
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Your Eligibility" icon={PieChartIcon}>
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Maximum Loan Amount</p>
                            <p className="text-4xl font-bold text-blue-600">{formatCurrency(result.maxLoan)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Max EMI</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.maxEMI)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Max Property</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.maxPropertyValue)}</p>
                            </div>
                        </div>
                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Home Loan Eligibility"
                        calculatorContext={[
                            { label: 'Income', value: formatCurrency(monthlyIncome) },
                            { label: 'Existing EMI', value: formatCurrency(existingEMI) },
                            { label: 'Max Loan', value: formatCurrency(result.maxLoan) },
                            { label: 'Max Property', value: formatCurrency(result.maxPropertyValue) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
