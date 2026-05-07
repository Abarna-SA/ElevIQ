'use client';

import { useState, useMemo, useCallback } from 'react';
import { Wallet, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { SliderInput, PieChart, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface LumpsumCalculatorProps {
    onBack?: () => void;
}

export function LumpsumCalculator({ onBack }: LumpsumCalculatorProps) {
    const [investmentAmount, setInvestmentAmount] = useState(1000000);
    const [expectedReturn, setExpectedReturn] = useState(12);
    const [timePeriod, setTimePeriod] = useState(10);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const futureValue = investmentAmount * Math.pow(1 + expectedReturn / 100, timePeriod);
        const returns = futureValue - investmentAmount;
        const absoluteReturn = (returns / investmentAmount) * 100;
        return { futureValue, returns, invested: investmentAmount, absoluteReturn };
    }, [investmentAmount, expectedReturn, timePeriod]);

    const yearlyData = useMemo(() => {
        const data = [];
        for (let year = 0; year <= timePeriod; year++) {
            data.push({ year, value: investmentAmount * Math.pow(1 + expectedReturn / 100, year) });
        }
        return data;
    }, [investmentAmount, expectedReturn, timePeriod]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const pieData = [
        { label: 'Invested', value: result.invested, color: '#6366f1' },
        { label: 'Returns', value: result.returns, color: '#10b981' },
    ];

    const handleGenerateSummary = useCallback(() => {
        const extraYearValue = investmentAmount * Math.pow(1 + expectedReturn / 100, timePeriod + 1);
        return generateGenericSummary('Lumpsum Investment', [
            { label: 'Amount', value: formatCurrency(investmentAmount) },
            { label: 'Return', value: `${expectedReturn}%` },
        ], {
            summaryText: `A one-time investment of ${formatCurrency(investmentAmount)} at ${expectedReturn}% annual returns will grow to ${formatCurrency(result.futureValue)} in ${timePeriod} years. Your money grows ${(result.futureValue / investmentAmount).toFixed(1)}x with total returns of ${formatCurrency(result.returns)} (${result.absoluteReturn.toFixed(0)}% absolute return).`,
            insightText: `Staying invested 1 more year would add ${formatCurrency(extraYearValue - result.futureValue)} to your corpus. ${expectedReturn < 12 ? 'Historical equity returns have been 12-15%. Consider allocating to equity for higher growth potential.' : 'Your expected return rate is healthy, but remember to account for inflation.'} The power of compounding accelerates significantly in later years.`,
            recommendationText: `Consider a Systematic Transfer Plan (STP) if investing a large lumpsum — it reduces market timing risk. Review your asset allocation annually. For long-term goals (10+ years), equity-heavy allocation typically outperforms other asset classes.`,
        });
    }, [investmentAmount, expectedReturn, timePeriod, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Lumpsum Calculator"
                description="Calculate returns on one-time investment"
                icon={Wallet}
                gradient="from-indigo-500 to-purple-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Total Value', value: formatCurrency(result.futureValue) },
                    { label: 'Returns', value: `+${formatCurrency(result.returns)}` },
                    { label: 'Growth', value: `${result.absoluteReturn.toFixed(0)}%` },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Investment Details" icon={TrendingUp}>
                        <div className="space-y-6">
                            <SliderInput label="Investment Amount" value={investmentAmount} onChange={setInvestmentAmount} min={10000} max={50000000} step={10000} prefix="₹" formatValue={(v) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v.toLocaleString()} quickValues={[500000, 1000000, 2500000, 5000000]} />
                            <SliderInput label="Expected Return" value={expectedReturn} onChange={setExpectedReturn} min={5} max={25} step={0.5} suffix="% p.a." quickValues={[8, 12, 15, 20]} />
                            <SliderInput label="Time Period" value={timePeriod} onChange={setTimePeriod} min={1} max={30} step={1} suffix=" yrs" quickValues={[5, 10, 15, 20, 25]} />
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Returns Summary" icon={PieChartIcon}>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Invested</p>
                                <p className="text-xl font-bold text-indigo-600">{formatCurrency(result.invested)}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Returns</p>
                                <p className="text-xl font-bold text-green-600">+{formatCurrency(result.returns)}</p>
                            </div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(result.futureValue)}</p>
                            <p className="text-sm text-green-600 mt-1">+{result.absoluteReturn.toFixed(0)}% absolute return</p>
                        </div>
                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <GlassCard title="Growth Over Time" icon={BarChart3}>
                        <GrowthChart data={yearlyData} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Lumpsum Calculator"
                        calculatorContext={[
                            { label: 'Investment', value: formatCurrency(investmentAmount) },
                            { label: 'Return', value: `${expectedReturn}% p.a.` },
                            { label: 'Period', value: `${timePeriod} yrs` },
                            { label: 'Total Value', value: formatCurrency(result.futureValue) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
