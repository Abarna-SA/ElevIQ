'use client';

import { useState, useMemo, useCallback } from 'react';
import { CreditCard, FileText, TrendingDown, BarChart3 } from 'lucide-react';
import { SliderInput, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface PrepaymentCalculatorProps {
    onBack?: () => void;
}

export function PrepaymentCalculator({ onBack }: PrepaymentCalculatorProps) {
    const [loanAmount, setLoanAmount] = useState(5000000);
    const [interestRate, setInterestRate] = useState(8.5);
    const [loanTenure, setLoanTenure] = useState(20);
    const [prepaymentAmount, setPrepaymentAmount] = useState(500000);
    const [prepaymentYear, setPrepaymentYear] = useState(3);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const r = interestRate / 12 / 100;
        const n = loanTenure * 12;
        const emi = loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalWithoutPrepay = emi * n;
        const interestWithoutPrepay = totalWithoutPrepay - loanAmount;
        const monthsBeforePrepay = prepaymentYear * 12;
        let balance = loanAmount;
        for (let i = 0; i < monthsBeforePrepay; i++) {
            const interest = balance * r;
            balance = balance + interest - emi;
        }
        const newBalance = Math.max(0, balance - prepaymentAmount);
        let newTenureMonths = 0;
        let tempBalance = newBalance;
        while (tempBalance > 0 && newTenureMonths < 360) {
            const interest = tempBalance * r;
            tempBalance = tempBalance + interest - emi;
            newTenureMonths++;
        }
        const totalWithPrepay = (monthsBeforePrepay * emi) + prepaymentAmount + (newTenureMonths * emi);
        const interestWithPrepay = totalWithPrepay - loanAmount;
        const interestSaved = interestWithoutPrepay - interestWithPrepay;
        const timeSaved = (loanTenure * 12) - (monthsBeforePrepay + newTenureMonths);
        return { emi, totalWithoutPrepay, totalWithPrepay, interestWithoutPrepay, interestWithPrepay, interestSaved: Math.max(0, interestSaved), timeSaved: Math.max(0, timeSaved), newTenureMonths };
    }, [loanAmount, interestRate, loanTenure, prepaymentAmount, prepaymentYear]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('Loan Prepayment', [
            { label: 'Loan', value: formatCurrency(loanAmount) },
            { label: 'Prepay', value: formatCurrency(prepaymentAmount) },
        ], {
            summaryText: `By prepaying ${formatCurrency(prepaymentAmount)} in year ${prepaymentYear} on your ${formatCurrency(loanAmount)} loan at ${interestRate}%, you save ${formatCurrency(result.interestSaved)} in interest. Your loan closes ${Math.floor(result.timeSaved / 12)} years and ${result.timeSaved % 12} months earlier.`,
            insightText: `Without prepayment, total interest is ${formatCurrency(result.interestWithoutPrepay)}. With prepayment, it reduces to ${formatCurrency(result.interestWithPrepay)}. Prepaying earlier (year 1 vs year ${prepaymentYear}) saves even more because the outstanding balance is higher in earlier years. Your EMI remains ${formatCurrency(result.emi)}/month.`,
            recommendationText: `Prepay during the first half of your loan tenure for maximum impact — that’s when interest components are highest. Check if your lender charges any prepayment penalty. Consider making partial prepayments annually instead of a single lump sum for better cash flow management.`,
        });
    }, [loanAmount, interestRate, loanTenure, prepaymentAmount, prepaymentYear, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Prepayment Calculator"
                description="See how much you save with loan prepayment"
                icon={CreditCard}
                gradient="from-green-500 to-emerald-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Interest Saved', value: formatCurrency(result.interestSaved) },
                    { label: 'Time Saved', value: `${Math.floor(result.timeSaved / 12)}y ${result.timeSaved % 12}m` },
                    { label: 'EMI', value: formatCurrency(result.emi) },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Loan Details" icon={FileText}>
                        <div className="space-y-6">
                            <SliderInput label="Loan Amount" value={loanAmount} onChange={setLoanAmount} min={500000} max={50000000} step={100000} prefix="₹" formatValue={(v) => (v / 100000).toFixed(0) + 'L'} quickValues={[2500000, 5000000, 10000000, 20000000]} />
                            <SliderInput label="Interest Rate" value={interestRate} onChange={setInterestRate} min={6} max={15} step={0.1} suffix="% p.a." />
                            <SliderInput label="Loan Tenure" value={loanTenure} onChange={setLoanTenure} min={5} max={30} step={1} suffix=" yrs" />
                        </div>
                    </GlassCard>

                    <GlassCard title="Prepayment Plan" icon={TrendingDown}>
                        <div className="space-y-6">
                            <SliderInput label="Prepayment Amount" value={prepaymentAmount} onChange={setPrepaymentAmount} min={50000} max={loanAmount * 0.5} step={50000} prefix="₹" formatValue={(v) => (v / 100000).toFixed(1) + 'L'} />
                            <SliderInput label="Prepay in Year" value={prepaymentYear} onChange={setPrepaymentYear} min={1} max={loanTenure - 1} step={1} suffix="" quickValues={[1, 3, 5, 10]} />
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Savings Summary" icon={BarChart3}>
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 mb-6 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Interest Saved</p>
                            <p className="text-4xl font-bold text-green-600">{formatCurrency(result.interestSaved)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {Math.floor(result.timeSaved / 12)} years {result.timeSaved % 12} months saved
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Without Prepayment</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(result.totalWithoutPrepay)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Interest</p>
                                    <p className="text-lg font-semibold text-red-500">{formatCurrency(result.interestWithoutPrepay)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-500/10 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">With Prepayment</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(result.totalWithPrepay)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Interest</p>
                                    <p className="text-lg font-semibold text-green-600">{formatCurrency(result.interestWithPrepay)}</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Prepayment Calculator"
                        calculatorContext={[
                            { label: 'Loan', value: formatCurrency(loanAmount) },
                            { label: 'Rate', value: `${interestRate}%` },
                            { label: 'Prepayment', value: formatCurrency(prepaymentAmount) },
                            { label: 'Interest Saved', value: formatCurrency(result.interestSaved) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
