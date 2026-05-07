'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Check, X, Wallet, BarChart3, PieChart as PieChartIcon, Scale, Table } from 'lucide-react';
import { SliderInput, PieChart, BarChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateTaxSummary } from './shared/aiSummaryGenerators';

interface TaxCalculatorProps {
    onBack?: () => void;
}

// Tax slabs for FY 2024-25
const oldRegimeSlabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

const newRegimeSlabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 600000, rate: 5 },
    { min: 600000, max: 900000, rate: 10 },
    { min: 900000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 },
];

function calculateTax(income: number, slabs: typeof oldRegimeSlabs): number {
    let tax = 0;
    let remaining = income;
    for (const slab of slabs) {
        if (remaining <= 0) break;
        const taxableInSlab = Math.min(remaining, slab.max - slab.min);
        tax += taxableInSlab * (slab.rate / 100);
        remaining -= taxableInSlab;
    }
    return tax;
}

const formatCurrencyTax = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
    return value.toLocaleString();
};

export function TaxCalculator({ onBack }: TaxCalculatorProps) {
    const [grossSalary, setGrossSalary] = useState(1500000);
    const [otherIncome, setOtherIncome] = useState(50000);
    const [regime, setRegime] = useState<'old' | 'new'>('new');
    const [section80C, setSection80C] = useState(150000);
    const [section80D, setSection80D] = useState(25000);
    const [nps, setNps] = useState(50000);
    const [hra, setHra] = useState(0);
    const [otherDeductions, setOtherDeductions] = useState(0);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const totalIncome = grossSalary + otherIncome;
        const totalDeductionsOld = Math.min(section80C, 150000) + Math.min(section80D, 25000) + Math.min(nps, 50000) + hra + otherDeductions;
        const standardDeductionOld = 50000;
        const taxableIncomeOld = Math.max(0, totalIncome - totalDeductionsOld - standardDeductionOld);
        const taxOld = calculateTax(taxableIncomeOld, oldRegimeSlabs);
        const cessOld = taxOld * 0.04;
        const totalTaxOld = taxOld + cessOld;

        const standardDeductionNew = 75000;
        const taxableIncomeNew = Math.max(0, totalIncome - standardDeductionNew);
        const taxNew = calculateTax(taxableIncomeNew, newRegimeSlabs);
        const cessNew = taxNew * 0.04;
        const totalTaxNew = taxNew + cessNew;

        const betterRegime = totalTaxOld < totalTaxNew ? 'old' : 'new';
        const savings = Math.abs(totalTaxOld - totalTaxNew);

        const slabs = regime === 'old' ? oldRegimeSlabs : newRegimeSlabs;
        const taxableIncome = regime === 'old' ? taxableIncomeOld : taxableIncomeNew;
        const slabBreakdown: { range: string; amount: number; rate: number; tax: number }[] = [];
        let remaining = taxableIncome;
        for (const slab of slabs) {
            if (remaining <= 0) break;
            const taxableInSlab = Math.min(remaining, slab.max - slab.min);
            const taxInSlab = taxableInSlab * (slab.rate / 100);
            slabBreakdown.push({
                range: slab.max === Infinity ? `Above ₹${(slab.min / 100000).toFixed(1)}L` : `₹${(slab.min / 100000).toFixed(1)}L - ₹${(slab.max / 100000).toFixed(1)}L`,
                amount: taxableInSlab, rate: slab.rate, tax: taxInSlab,
            });
            remaining -= taxableInSlab;
        }

        return {
            totalIncome, taxableIncomeOld, taxableIncomeNew, totalTaxOld, totalTaxNew,
            betterRegime, savings, slabBreakdown,
            inHandOld: totalIncome - totalTaxOld, inHandNew: totalIncome - totalTaxNew,
        };
    }, [grossSalary, otherIncome, section80C, section80D, nps, hra, otherDeductions, regime]);

    // AI Summary generator
    const handleGenerateSummary = useCallback(() => {
        return generateTaxSummary(
            result.totalIncome, result.totalTaxOld, result.totalTaxNew, result.savings
        );
    }, [result]);

    const pieData = regime === 'new'
        ? [{ label: 'In-Hand', value: result.inHandNew, color: '#22c55e' }, { label: 'Tax', value: result.totalTaxNew, color: '#ef4444' }]
        : [{ label: 'In-Hand', value: result.inHandOld, color: '#22c55e' }, { label: 'Tax', value: result.totalTaxOld, color: '#ef4444' }];

    const comparisonData = [
        { label: 'Old Regime', value: result.totalTaxOld, color: result.betterRegime === 'old' ? '#22c55e' : '#3b82f6' },
        { label: 'New Regime', value: result.totalTaxNew, color: result.betterRegime === 'new' ? '#22c55e' : '#3b82f6' },
    ];

    const formatCurrency = formatCurrencyTax;
    const currentTax = regime === 'old' ? result.totalTaxOld : result.totalTaxNew;
    const currentInHand = regime === 'old' ? result.inHandOld : result.inHandNew;

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner
                title="Income Tax Calculator"
                description="FY 2024-25 | Compare Old vs New Tax Regime"
                icon={FileText}
                gradient="from-indigo-500 to-purple-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Total Tax', value: `₹${formatCurrency(currentTax)}` },
                    { label: 'In-Hand', value: `₹${formatCurrency(currentInHand)}` },
                    { label: 'Savings', value: `₹${formatCurrency(result.savings)}` },
                ]}
            />

            {/* Regime Selector */}
            <div className="flex gap-4 p-2 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 rounded-xl">
                <button onClick={() => setRegime('old')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${regime === 'old'
                        ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'}`}>
                    Old Regime
                    {result.betterRegime === 'old' && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Better</span>}
                </button>
                <button onClick={() => setRegime('new')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${regime === 'new'
                        ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'}`}>
                    New Regime
                    {result.betterRegime === 'new' && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Better</span>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <GlassCard title="Income Details" icon={Wallet}>
                        <div className="space-y-6">
                            <SliderInput label="Gross Salary" value={grossSalary} onChange={setGrossSalary} min={300000} max={10000000} step={50000} prefix="₹" formatValue={formatCurrency} quickValues={[500000, 1000000, 1500000, 2000000, 3000000]} />
                            <SliderInput label="Other Income (Interest, Rental, etc.)" value={otherIncome} onChange={setOtherIncome} min={0} max={2000000} step={10000} prefix="₹" formatValue={formatCurrency} />
                        </div>
                    </GlassCard>

                    {regime === 'old' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <GlassCard title="Deductions" icon={Scale}>
                                <div className="space-y-6">
                                    <SliderInput label="Section 80C (Max ₹1.5L)" value={section80C} onChange={setSection80C} min={0} max={150000} step={5000} prefix="₹" formatValue={(v) => v.toLocaleString()} quickValues={[50000, 100000, 150000]} />
                                    <SliderInput label="Section 80D - Health Insurance" value={section80D} onChange={setSection80D} min={0} max={100000} step={5000} prefix="₹" formatValue={(v) => v.toLocaleString()} quickValues={[25000, 50000, 75000]} />
                                    <SliderInput label="NPS (Additional 80CCD)" value={nps} onChange={setNps} min={0} max={50000} step={5000} prefix="₹" formatValue={(v) => v.toLocaleString()} />
                                    <SliderInput label="HRA Exemption" value={hra} onChange={setHra} min={0} max={500000} step={10000} prefix="₹" formatValue={(v) => v.toLocaleString()} />
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {/* AI Advisor Modal */}
                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="Income Tax Calculator"
                        calculatorContext={[
                            { label: 'Income', value: `₹${formatCurrency(result.totalIncome)}` },
                            { label: 'Old Tax', value: `₹${formatCurrency(result.totalTaxOld)}` },
                            { label: 'New Tax', value: `₹${formatCurrency(result.totalTaxNew)}` },
                            { label: 'Better', value: result.betterRegime === 'old' ? 'Old Regime' : 'New Regime' },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-red-200/50 dark:border-red-500/20 shadow-sm">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Tax</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{formatCurrency(currentTax)}</p>
                            <p className="text-xs text-gray-400 mt-1">Including 4% cess</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-[#171717] rounded-xl p-4 border border-green-200/50 dark:border-green-500/20 shadow-sm">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">In-Hand Income</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{formatCurrency(currentInHand)}</p>
                            <p className="text-xs text-gray-400 mt-1">{((currentInHand / result.totalIncome) * 100).toFixed(0)}% of gross</p>
                        </motion.div>
                    </div>

                    <GlassCard title="Income Breakdown" icon={PieChartIcon}>
                        <PieChart data={pieData} size={200} />
                    </GlassCard>

                    <GlassCard title="Regime Comparison" icon={BarChart3}>
                        <BarChart data={comparisonData} formatValue={(v) => `₹${formatCurrency(v)}`} />
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                            <p className="text-green-700 dark:text-green-300 font-medium">
                                {result.betterRegime === 'old' ? 'Old' : 'New'} regime saves ₹{formatCurrency(result.savings)}
                            </p>
                        </div>
                    </GlassCard>

                    <GlassCard title={`Tax Slab Breakdown (${regime === 'old' ? 'Old' : 'New'} Regime)`} icon={Table}>
                        <div className="space-y-2">
                            {result.slabBreakdown.map((slab, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{slab.range}</span>
                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">{slab.rate}%</span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">₹{Math.round(slab.tax).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/10 rounded-lg font-medium">
                                <span className="text-gray-900 dark:text-white">Total Tax + Cess</span>
                                <span className="text-red-600">₹{Math.round(currentTax).toLocaleString()}</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Regime Features" icon={Scale}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="p-2">Feature</th>
                                        <th className="p-2 text-center">Old</th>
                                        <th className="p-2 text-center">New</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {[
                                        { feature: '80C Deductions', old: true, new: false },
                                        { feature: 'HRA Exemption', old: true, new: false },
                                        { feature: '80D Health Insurance', old: true, new: false },
                                        { feature: 'NPS Benefits', old: true, new: false },
                                        { feature: 'Lower Tax Slabs', old: false, new: true },
                                        { feature: 'Standard Deduction', old: true, new: true },
                                    ].map((row, i) => (
                                        <tr key={i} className="text-gray-900 dark:text-white">
                                            <td className="p-2">{row.feature}</td>
                                            <td className="p-2 text-center">{row.old ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>
                                            <td className="p-2 text-center">{row.new ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
