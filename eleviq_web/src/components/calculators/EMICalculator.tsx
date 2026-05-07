'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Download, Share2, FileText, PieChart as PieChartIcon, BarChart3, Table } from 'lucide-react';
import { SliderInput, PieChart, GrowthChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateEMISummary } from './shared/aiSummaryGenerators';

interface EMICalculatorProps {
    onBack?: () => void;
}

export function EMICalculator({ onBack }: EMICalculatorProps) {
    const [principal, setPrincipal] = useState(5000000);
    const [rate, setRate] = useState(8.5);
    const [tenure, setTenure] = useState(240);
    const [tenureType, setTenureType] = useState<'months' | 'years'>('months');
    const [showAmortization, setShowAmortization] = useState(false);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    // Calculate EMI and related values
    const result = useMemo(() => {
        const P = principal;
        const r = rate / 12 / 100;
        const n = tenureType === 'years' ? tenure * 12 : tenure;

        if (!P || !r || !n) return null;

        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        return { emi, totalPayment, totalInterest, months: n };
    }, [principal, rate, tenure, tenureType]);

    // Generate amortization schedule
    const amortization = useMemo(() => {
        if (!result) return [];

        const schedule = [];
        let balance = principal;
        const r = rate / 12 / 100;

        for (let month = 1; month <= Math.min(result.months, 360); month++) {
            const interest = balance * r;
            const principalPaid = result.emi - interest;
            balance = Math.max(0, balance - principalPaid);

            schedule.push({
                month,
                emi: result.emi,
                principal: principalPaid,
                interest,
                balance,
            });
        }

        return schedule;
    }, [principal, rate, result]);

    // Generate yearly balance data for chart
    const yearlyData = useMemo(() => {
        if (!amortization.length) return [];

        const data = [];
        for (let year = 0; year <= Math.ceil(amortization.length / 12); year++) {
            const monthIndex = year * 12;
            if (monthIndex === 0) {
                data.push({ year: 0, value: principal });
            } else if (monthIndex <= amortization.length) {
                const monthData = amortization[monthIndex - 1];
                data.push({ year, value: monthData?.balance || 0 });
            }
        }
        return data;
    }, [amortization, principal]);

    // AI Summary generator
    const handleGenerateSummary = useCallback(() => {
        if (!result) return [];
        return generateEMISummary(principal, rate, result.months, result.emi, result.totalInterest);
    }, [principal, rate, result]);

    // Pie chart data
    const pieData = result ? [
        { label: 'Principal', value: principal, color: '#3b82f6' },
        { label: 'Interest', value: result.totalInterest, color: '#f97316' },
    ] : [];

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
        return value.toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner
                title="EMI Calculator"
                description="Calculate your loan payments with precision"
                icon={BarChart3}
                gradient="from-blue-600 to-indigo-700"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={result ? [
                    { label: 'Monthly EMI', value: `₹${Math.round(result.emi).toLocaleString()}` },
                    { label: 'Total Interest', value: `₹${formatCurrency(result.totalInterest)}` },
                    { label: 'Rate', value: `${rate}%` },
                ] : []}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <GlassCard title="Loan Details" icon={FileText}>
                        <div className="space-y-6">
                            <SliderInput
                                label="Loan Amount"
                                value={principal}
                                onChange={setPrincipal}
                                min={100000}
                                max={50000000}
                                step={100000}
                                prefix="₹"
                                formatValue={formatCurrency}
                                quickValues={[1000000, 2500000, 5000000, 10000000]}
                            />

                            <SliderInput
                                label="Interest Rate (% p.a.)"
                                value={rate}
                                onChange={setRate}
                                min={5}
                                max={20}
                                step={0.1}
                                suffix="%"
                                formatValue={(v) => v.toFixed(1)}
                                quickValues={[7, 8.5, 10, 12]}
                            />

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tenure
                                    </span>
                                    <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                                        <button
                                            onClick={() => setTenureType('months')}
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${tenureType === 'months'
                                                ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            Months
                                        </button>
                                        <button
                                            onClick={() => setTenureType('years')}
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${tenureType === 'years'
                                                ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            Years
                                        </button>
                                    </div>
                                </div>
                                <SliderInput
                                    label=""
                                    value={tenure}
                                    onChange={setTenure}
                                    min={tenureType === 'years' ? 1 : 12}
                                    max={tenureType === 'years' ? 30 : 360}
                                    step={tenureType === 'years' ? 1 : 12}
                                    suffix={tenureType === 'years' ? ' Yrs' : ' Mo'}
                                    quickValues={tenureType === 'years' ? [5, 10, 15, 20, 25, 30] : [60, 120, 180, 240, 300, 360]}
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Results Cards */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-3 gap-3"
                        >
                            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-blue-200/50 dark:border-blue-500/20 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Monthly EMI</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{Math.round(result.emi).toLocaleString()}</p>
                            </div>
                            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-green-200/50 dark:border-green-500/20 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Payment</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{formatCurrency(result.totalPayment)}</p>
                            </div>
                            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-orange-200/50 dark:border-orange-500/20 shadow-sm">
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Interest</p>
                                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">₹{formatCurrency(result.totalInterest)}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Advisor Modal */}
                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="EMI Calculator"
                        calculatorContext={result ? [
                            { label: 'Amount', value: `₹${formatCurrency(principal)}` },
                            { label: 'Rate', value: `${rate}%` },
                            { label: 'Tenure', value: `${tenureType === 'years' ? tenure : Math.round(tenure / 12)} yrs` },
                            { label: 'EMI', value: `₹${Math.round(result.emi).toLocaleString()}` },
                        ] : []}
                        generateSummary={handleGenerateSummary}
                    />
                </div>

                {/* Visualization Section */}
                <div className="space-y-6">
                    {/* Pie Chart */}
                    {result && (
                        <GlassCard title="Payment Breakdown" icon={PieChartIcon}>
                            <PieChart data={pieData} size={200} />
                        </GlassCard>
                    )}

                    {/* Balance Over Time Chart */}
                    {yearlyData.length > 0 && (
                        <GlassCard title="Principal Balance Over Time" icon={BarChart3}>
                            <GrowthChart
                                data={yearlyData}
                                height={200}
                                formatValue={(v) => `₹${formatCurrency(v)}`}
                            />
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* Amortization Schedule */}
            {result && (
                <GlassCard title="Amortization Schedule" icon={Table} noPadding>
                    <button
                        onClick={() => setShowAmortization(!showAmortization)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {showAmortization ? 'Hide' : 'Show'} full schedule ({amortization.length} months)
                        </span>
                        <motion.div animate={{ rotate: showAmortization ? 180 : 0 }}>
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showAmortization && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0">
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-gray-50 dark:bg-[#0a0a0a]">
                                                <tr className="text-left text-gray-500 dark:text-gray-400">
                                                    <th className="p-3 font-medium">Month</th>
                                                    <th className="p-3 font-medium">EMI</th>
                                                    <th className="p-3 font-medium">Principal</th>
                                                    <th className="p-3 font-medium">Interest</th>
                                                    <th className="p-3 font-medium">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {amortization.slice(0, 60).map((row) => (
                                                    <tr key={row.month} className="text-gray-900 dark:text-white">
                                                        <td className="p-3">{row.month}</td>
                                                        <td className="p-3">₹{Math.round(row.emi).toLocaleString()}</td>
                                                        <td className="p-3 text-blue-600">₹{Math.round(row.principal).toLocaleString()}</td>
                                                        <td className="p-3 text-orange-600">₹{Math.round(row.interest).toLocaleString()}</td>
                                                        <td className="p-3">₹{Math.round(row.balance).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {amortization.length > 60 && (
                                            <p className="p-4 text-center text-sm text-gray-500">
                                                Showing first 60 months of {amortization.length} total
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </GlassCard>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download PDF</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share</span>
                </button>
            </div>
        </div>
    );
}
