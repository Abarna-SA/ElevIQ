'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Trophy, TrendingDown, Scale, BarChart3 } from 'lucide-react';
import { SliderInput, BarChart, HeroBanner, GlassCard } from './shared';

interface LoanOption {
    id: string;
    name: string;
    rate: number;
}

interface LoanComparisonProps {
    onBack?: () => void;
}

export function LoanComparison({ onBack }: LoanComparisonProps) {
    const [principal, setPrincipal] = useState(5000000);
    const [tenure, setTenure] = useState(20);
    const [loans, setLoans] = useState<LoanOption[]>([
        { id: '1', name: 'Option A', rate: 8.5 },
        { id: '2', name: 'Option B', rate: 8.75 },
        { id: '3', name: 'Option C', rate: 9.0 },
    ]);

    const addLoan = () => {
        if (loans.length < 5) {
            setLoans([...loans, { id: Date.now().toString(), name: `Option ${String.fromCharCode(65 + loans.length)}`, rate: 9.0 }]);
        }
    };

    const removeLoan = (id: string) => {
        if (loans.length > 2) setLoans(loans.filter((l) => l.id !== id));
    };

    const updateLoanRate = (id: string, rate: number) => {
        setLoans(loans.map((l) => l.id === id ? { ...l, rate } : l));
    };

    const results = useMemo(() => {
        const months = tenure * 12;
        return loans.map((loan) => {
            const r = loan.rate / 12 / 100;
            const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
            const totalPayment = emi * months;
            const totalInterest = totalPayment - principal;
            return { ...loan, emi, totalPayment, totalInterest };
        });
    }, [loans, principal, tenure]);

    const bestOption = results.reduce((best, current) => current.totalPayment < best.totalPayment ? current : best, results[0]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
        return `₹${value.toLocaleString()}`;
    };

    const chartData = results.map((r) => ({
        label: `${r.name} (${r.rate}%)`,
        value: r.totalPayment,
        color: r.id === bestOption.id ? '#22c55e' : '#3b82f6',
    }));

    return (
        <div className="space-y-6">
            <HeroBanner
                title="Loan Comparison"
                description="Compare multiple loan offers side by side"
                icon={Scale}
                gradient="from-emerald-500 to-teal-600"
                onBack={onBack}
                stats={[
                    { label: 'Best Rate', value: `${bestOption.rate}%` },
                    { label: 'Best EMI', value: formatCurrency(bestOption.emi) },
                    { label: 'Max Savings', value: formatCurrency(Math.max(...results.map(r => r.totalPayment)) - bestOption.totalPayment) },
                ]}
            />

            {/* Common Parameters */}
            <GlassCard title="Loan Parameters">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderInput label="Loan Amount" value={principal} onChange={setPrincipal} min={100000} max={50000000} step={100000} prefix="₹" formatValue={formatCurrency} quickValues={[1000000, 2500000, 5000000, 10000000]} />
                    <SliderInput label="Tenure" value={tenure} onChange={setTenure} min={1} max={30} step={1} suffix=" Years" quickValues={[5, 10, 15, 20, 25, 30]} />
                </div>
            </GlassCard>

            {/* Loan Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map((result, index) => {
                    const isBest = result.id === bestOption.id;
                    const savings = result.totalPayment - bestOption.totalPayment;
                    return (
                        <motion.div key={result.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                            className={`relative bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all ${isBest ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200/50 dark:border-white/10'}`}>
                            {isBest && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> BEST CHOICE
                                </div>
                            )}
                            {loans.length > 2 && (
                                <button onClick={() => removeLoan(result.id)} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{result.name}</h4>
                            <div className="mb-4">
                                <label className="text-xs text-gray-500 mb-1 block">Interest Rate</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" step="0.1" value={result.rate} onChange={(e) => updateLoanRate(result.id, parseFloat(e.target.value) || 0)}
                                        className="w-20 px-3 py-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <span className="text-gray-500">% p.a.</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between"><span className="text-sm text-gray-500">Monthly EMI</span><span className="font-semibold text-gray-900 dark:text-white">₹{Math.round(result.emi).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-sm text-gray-500">Total Interest</span><span className="font-semibold text-orange-600">{formatCurrency(result.totalInterest)}</span></div>
                                <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-white/5"><span className="text-sm text-gray-500">Total Payment</span><span className="font-bold text-gray-900 dark:text-white">{formatCurrency(result.totalPayment)}</span></div>
                            </div>
                            {savings > 0 && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                    <div className="flex items-center gap-2 text-red-600"><TrendingDown className="w-4 h-4" /><span className="text-sm font-medium">+{formatCurrency(savings)} more</span></div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {loans.length < 5 && (
                    <button onClick={addLoan} className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                        <Plus className="w-8 h-8 text-gray-400" /><span className="text-sm text-gray-500">Add Option</span>
                    </button>
                )}
            </div>

            {/* Comparison Chart */}
            <GlassCard title="Total Cost Comparison" icon={BarChart3}>
                <BarChart data={chartData} formatValue={formatCurrency} />
            </GlassCard>

            {/* AI Recommendation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl p-6 border border-green-100 dark:border-green-800/30">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><Trophy className="w-5 h-5 text-white" /></div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">🤖 AI Recommendation</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                            <strong>{bestOption.name}</strong> at {bestOption.rate}% is your best option.
                            {results.length > 1 && (<> You save{' '}<strong className="text-green-600">{formatCurrency(Math.max(...results.map(r => r.totalPayment)) - bestOption.totalPayment)}</strong>{' '}compared to the highest rate option.</>)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
