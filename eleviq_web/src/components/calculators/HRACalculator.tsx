'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, PieChart as PieChartIcon, FileText } from 'lucide-react';
import { SliderInput, PieChart, HeroBanner, GlassCard, AIAdvisorModal } from './shared';
import { generateGenericSummary } from './shared/aiSummaryGenerators';

interface HRACalculatorProps {
    onBack?: () => void;
}

export function HRACalculator({ onBack }: HRACalculatorProps) {
    const [basicSalary, setBasicSalary] = useState(50000);
    const [hraReceived, setHraReceived] = useState(20000);
    const [rentPaid, setRentPaid] = useState(25000);
    const [isMetro, setIsMetro] = useState(true);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const result = useMemo(() => {
        const annualBasic = basicSalary * 12;
        const annualHRA = hraReceived * 12;
        const annualRent = rentPaid * 12;
        const condition1 = annualHRA;
        const condition2 = annualRent - (0.1 * annualBasic);
        const condition3 = (isMetro ? 0.5 : 0.4) * annualBasic;
        const exemption = Math.max(0, Math.min(condition1, condition2, condition3));
        const taxableHRA = annualHRA - exemption;
        const taxSaved = exemption * 0.3;
        return { exemption, taxableHRA, taxSaved, annualHRA, condition1, condition2: Math.max(0, condition2), condition3 };
    }, [basicSalary, hraReceived, rentPaid, isMetro]);

    const formatCurrency = (value: number) => {
        if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString()}`;
    };

    const pieData = [
        { label: 'Exempt HRA', value: result.exemption, color: '#10b981' },
        { label: 'Taxable HRA', value: result.taxableHRA, color: '#ef4444' },
    ];

    const handleGenerateSummary = useCallback(() => {
        return generateGenericSummary('HRA Tax Exemption', [
            { label: 'Basic', value: `₹${basicSalary.toLocaleString()}` },
            { label: 'Rent', value: `₹${rentPaid.toLocaleString()}` },
        ], {
            summaryText: `Based on your basic salary of ₹${basicSalary.toLocaleString()}/month, HRA of ₹${hraReceived.toLocaleString()}/month, and rent of ₹${rentPaid.toLocaleString()}/month in a ${isMetro ? 'metro' : 'non-metro'} city, your annual HRA exemption is ${formatCurrency(result.exemption)}. This saves you approximately ${formatCurrency(result.taxSaved)} in taxes (at 30% bracket).`,
            insightText: `Your HRA exemption is the minimum of three conditions: actual HRA (${formatCurrency(result.condition1)}), rent minus 10% of basic (${formatCurrency(result.condition2)}), and ${isMetro ? '50%' : '40%'} of basic (${formatCurrency(result.condition3)}). ${result.condition2 < result.condition1 && result.condition2 < result.condition3 ? 'The rent-based condition is limiting your exemption. Paying slightly higher rent could increase your exemption.' : 'Your exemption is well-optimized for your current salary structure.'}`,
            recommendationText: `${!isMetro ? 'If your city qualifies as a metro (Delhi/Mumbai/Kolkata/Chennai), update your city status for a higher 50% limit.' : ''} Keep rent receipts and landlord PAN for claiming HRA. If rent exceeds ₹₹1 lakh/year, landlord PAN is mandatory for claiming the exemption.`,
        });
    }, [basicSalary, hraReceived, rentPaid, isMetro, result]);

    return (
        <div className="space-y-6">
            <HeroBanner
                title="HRA Calculator"
                description="Calculate House Rent Allowance exemption"
                icon={Home}
                gradient="from-amber-500 to-orange-600"
                onBack={onBack}
                onAskAI={() => setShowAIAdvisor(true)}
                stats={[
                    { label: 'Exemption', value: formatCurrency(result.exemption) },
                    { label: 'Tax Saved', value: formatCurrency(result.taxSaved) },
                    { label: 'Taxable', value: formatCurrency(result.taxableHRA) },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <GlassCard title="Salary Details" icon={FileText}>
                        <div className="space-y-6">
                            <SliderInput label="Basic Salary (Monthly)" value={basicSalary} onChange={setBasicSalary} min={10000} max={500000} step={1000} prefix="₹" quickValues={[30000, 50000, 75000, 100000]} />
                            <SliderInput label="HRA Received (Monthly)" value={hraReceived} onChange={setHraReceived} min={0} max={basicSalary} step={500} prefix="₹" />
                            <SliderInput label="Rent Paid (Monthly)" value={rentPaid} onChange={setRentPaid} min={0} max={100000} step={500} prefix="₹" quickValues={[15000, 25000, 35000, 50000]} />

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Metro City (50% limit)</span>
                                <button onClick={() => setIsMetro(!isMetro)}
                                    className={`w-12 h-6 rounded-full transition-colors ${isMetro ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <motion.div className="w-5 h-5 bg-white rounded-full shadow-md" animate={{ x: isMetro ? 26 : 2 }} />
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="HRA Breakdown" icon={PieChartIcon}>
                        <div className="text-center p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Annual HRA Exemption</p>
                            <p className="text-4xl font-bold text-green-600">{formatCurrency(result.exemption)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tax saved: ~{formatCurrency(result.taxSaved)}</p>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Actual HRA</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(result.condition1)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Rent - 10% Basic</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(result.condition2)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{isMetro ? '50%' : '40%'} of Basic</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(result.condition3)}</span>
                            </div>
                        </div>
                        <PieChart data={pieData} size={180} />
                    </GlassCard>

                    <AIAdvisorModal
                        isOpen={showAIAdvisor}
                        onClose={() => setShowAIAdvisor(false)}
                        calculatorName="HRA Calculator"
                        calculatorContext={[
                            { label: 'Basic', value: `₹${basicSalary.toLocaleString()}` },
                            { label: 'HRA', value: `₹${hraReceived.toLocaleString()}` },
                            { label: 'Rent', value: `₹${rentPaid.toLocaleString()}` },
                            { label: 'Exemption', value: formatCurrency(result.exemption) },
                        ]}
                        generateSummary={handleGenerateSummary}
                    />
                </div>
            </div>
        </div>
    );
}
