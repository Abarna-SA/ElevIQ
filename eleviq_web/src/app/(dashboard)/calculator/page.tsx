'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    Home,
    TrendingUp,
    PiggyBank,
    Flame,
    FileText,
    Scale,
    Wallet,
    Target,
    Building2,
    CreditCard,
    Sparkles,
    Search,
    Command,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { SearchOverlay, CalculatorCard } from '@/components/calculators/shared';
import {
    EMICalculator,
    SIPCalculator,
    LoanComparison,
    FIRECalculator,
    TaxCalculator,
    HomeLoanEligibility,
    PrepaymentCalculator,
    LumpsumCalculator,
    GoalPlanner,
    CompoundInterestCalculator,
    FDCalculator,
    RDCalculator,
    HRACalculator,
    RetirementCorpusCalculator,
    PensionCalculator,
} from '@/components/calculators';

// ─────────────────────────────────────────────
// Category & Calculator definitions
// ─────────────────────────────────────────────

const categories = [
    { id: 'loans', name: 'Loans', icon: Home, color: '#3b82f6', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'investments', name: 'Investments', icon: TrendingUp, color: '#22c55e', gradient: 'from-green-500 to-emerald-500' },
    { id: 'interest', name: 'Interest', icon: PiggyBank, color: '#a855f7', gradient: 'from-purple-500 to-violet-500' },
    { id: 'tax', name: 'Tax', icon: FileText, color: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
    { id: 'retirement', name: 'Retirement', icon: Flame, color: '#ef4444', gradient: 'from-red-500 to-rose-500' },
];

const calculators = [
    // Loans
    { id: 'emi', name: 'EMI Calculator', icon: Home, description: 'Calculate loan EMI & amortization schedule', category: 'loans', popular: true, component: EMICalculator },
    { id: 'home-eligibility', name: 'Home Loan Eligibility', icon: Building2, description: 'Check your maximum loan eligibility', category: 'loans', component: HomeLoanEligibility },
    { id: 'compare-loans', name: 'Loan Comparison', icon: Scale, description: 'Compare multiple loan offers side by side', category: 'loans', component: LoanComparison },
    { id: 'prepayment', name: 'Prepayment Calculator', icon: CreditCard, description: 'See how prepayments save you interest', category: 'loans', component: PrepaymentCalculator },

    // Investments
    { id: 'sip', name: 'SIP Calculator', icon: TrendingUp, description: 'Plan your systematic investment plan', category: 'investments', popular: true, component: SIPCalculator },
    { id: 'lumpsum', name: 'Lumpsum Calculator', icon: Wallet, description: 'Calculate one-time investment returns', category: 'investments', component: LumpsumCalculator },
    { id: 'goal', name: 'Goal Planner', icon: Target, description: 'Map investments to your financial goals', category: 'investments', component: GoalPlanner },
    { id: 'fire', name: 'FIRE Calculator', icon: Flame, description: 'Financial independence retire early planning', category: 'investments', popular: true, component: FIRECalculator },

    // Interest
    { id: 'compound', name: 'Compound Interest', icon: PiggyBank, description: 'Visualize the power of compounding', category: 'interest', component: CompoundInterestCalculator },
    { id: 'fd', name: 'FD Calculator', icon: Building2, description: 'Fixed deposit maturity & returns', category: 'interest', component: FDCalculator },
    { id: 'rd', name: 'RD Calculator', icon: Wallet, description: 'Recurring deposit growth projection', category: 'interest', component: RDCalculator },

    // Tax
    { id: 'income-tax', name: 'Income Tax', icon: FileText, description: 'Compare Old vs New regime (FY 2024-25)', category: 'tax', popular: true, component: TaxCalculator },
    { id: 'hra', name: 'HRA Exemption', icon: Home, description: 'Calculate your HRA tax benefit', category: 'tax', component: HRACalculator },

    // Retirement
    { id: 'retirement', name: 'Retirement Corpus', icon: Flame, description: 'Plan your retirement savings goal', category: 'retirement', component: RetirementCorpusCalculator },
    { id: 'pension', name: 'Pension Calculator', icon: PiggyBank, description: 'Estimate monthly pension income', category: 'retirement', component: PensionCalculator },
];

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────

export default function CalculatorPage() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);

    // CMD+K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredCalculators = activeCategory
        ? calculators.filter((c) => c.category === activeCategory)
        : calculators;

    const popularCalculators = calculators.filter((c) => c.popular);

    const selectedCalculator = calculators.find((c) => c.id === activeCalculator);
    const CalculatorComponent = selectedCalculator?.component;

    const getCategoryColor = (categoryId: string) =>
        categories.find((c) => c.id === categoryId)?.color || '#6b7280';

    const getCategoryName = (categoryId: string) =>
        categories.find((c) => c.id === categoryId)?.name || categoryId;

    const getCategoryCount = (categoryId: string) =>
        calculators.filter((c) => c.category === categoryId).length;

    const handleBack = () => setActiveCalculator(null);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={Calculator}
                iconColor="text-blue-400"
                title="Financial Calculators"
                subtitle={`${calculators.length} tools to plan your finances`}
            />

            {/* Search Overlay */}
            <SearchOverlay
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                calculators={calculators}
                categories={categories}
                onSelect={(id) => setActiveCalculator(id)}
            />

            <div className="p-4 lg:p-8">
                <AnimatePresence mode="wait">
                    {activeCalculator && CalculatorComponent ? (
                        <motion.div
                            key="calculator"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <CalculatorComponent onBack={handleBack} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {/* ── Search Bar ─────────────────────────── */}
                            <motion.button
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSearchOpen(true)}
                                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl
                                    bg-white dark:bg-white/[0.04]
                                    border border-gray-200 dark:border-white/[0.08]
                                    hover:border-blue-300 dark:hover:border-blue-500/30
                                    hover:shadow-lg hover:shadow-blue-500/5
                                    transition-all duration-300 group cursor-pointer"
                            >
                                <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="flex-1 text-left text-sm text-gray-400">
                                    Search calculators...
                                </span>
                                <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-[11px] text-gray-400 font-mono">
                                    <Command className="w-3 h-3" />K
                                </span>
                            </motion.button>

                            {/* ── Featured / Bento Grid ─────────────── */}
                            <section>
                                <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                                    Featured
                                </h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* AI Banner — spans 2 rows on desktop */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="col-span-2 row-span-1 lg:row-span-2 relative overflow-hidden rounded-2xl
                                            bg-gradient-to-br from-purple-500/15 via-blue-500/10 to-cyan-500/15
                                            border border-purple-500/20 dark:border-purple-500/15
                                            p-6 flex flex-col justify-between cursor-default"
                                    >
                                        {/* Animated bg orbs */}
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                AI-Powered Financial Suite
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                                                Every calculator includes real-time AI insights — personalized tips,
                                                warnings, and optimization suggestions based on your inputs.
                                            </p>
                                        </div>

                                        <div className="relative mt-5 flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {[
                                                    'from-blue-400 to-blue-600',
                                                    'from-green-400 to-green-600',
                                                    'from-amber-400 to-amber-600',
                                                ].map((g, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center`}
                                                    >
                                                        <span className="text-white text-[10px] font-bold">
                                                            {['E', 'S', 'F'][i]}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {calculators.length} calculators with AI insights
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Popular calculator cards */}
                                    {popularCalculators.map((calc, index) => (
                                        <CalculatorCard
                                            key={calc.id}
                                            id={calc.id}
                                            name={calc.name}
                                            description={calc.description}
                                            icon={calc.icon}
                                            categoryColor={getCategoryColor(calc.category)}
                                            categoryName={getCategoryName(calc.category)}
                                            popular={calc.popular}
                                            onClick={() => setActiveCalculator(calc.id)}
                                            index={index}
                                            variant="featured"
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* ── Category Tabs ────────────────────── */}
                            <section>
                                <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                                    Categories
                                </h2>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {/* All tab */}
                                    <button
                                        onClick={() => setActiveCategory(null)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200
                                            ${activeCategory === null
                                                ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 shadow-lg shadow-gray-900/20 dark:shadow-white/20 scale-[1.02]'
                                                : 'bg-white/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:scale-[1.01]'
                                            }`}
                                    >
                                        All
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === null
                                            ? 'bg-white/20 dark:bg-gray-900/20'
                                            : 'bg-gray-100 dark:bg-white/10'
                                            }`}>
                                            {calculators.length}
                                        </span>
                                    </button>

                                    {categories.map((category) => {
                                        const Icon = category.icon;
                                        const isActive = activeCategory === category.id;
                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => setActiveCategory(category.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200
                                                    ${isActive
                                                        ? 'text-white shadow-lg scale-[1.02]'
                                                        : 'bg-white/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:scale-[1.01]'
                                                    }`}
                                                style={isActive ? {
                                                    background: `linear-gradient(135deg, ${category.color}, ${category.color}cc)`,
                                                    boxShadow: `0 8px 24px -4px ${category.color}40`,
                                                } : undefined}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {category.name}
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                                                    ? 'bg-white/20'
                                                    : 'bg-gray-100 dark:bg-white/10'
                                                    }`}>
                                                    {getCategoryCount(category.id)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* ── All Calculators Grid ─────────────── */}
                            <section>
                                <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                                    {activeCategory
                                        ? `${getCategoryName(activeCategory)} Calculators`
                                        : 'All Calculators'}
                                    <span className="ml-2 text-xs font-normal">
                                        ({filteredCalculators.length})
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredCalculators.map((calc, index) => (
                                        <CalculatorCard
                                            key={calc.id}
                                            id={calc.id}
                                            name={calc.name}
                                            description={calc.description}
                                            icon={calc.icon}
                                            categoryColor={getCategoryColor(calc.category)}
                                            categoryName={getCategoryName(calc.category)}
                                            popular={calc.popular}
                                            onClick={() => setActiveCalculator(calc.id)}
                                            index={index}
                                            variant="default"
                                        />
                                    ))}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
