'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Wallet,
    RefreshCw,
    Landmark,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useUserNetWorth } from '@/hooks/useUserNetWorth';
import { type Asset, type Liability, type AssetCategory, type LiabilityCategory } from '@/types/networth';
import {
    NetWorthTrendChart,
    AssetAllocationChart,
    FinancialHealthScore,
    NetWorthEmptyState,
    InsightsPanel,
    AssetsList,
    LiabilitiesList,
    AddAssetModal,
    AddLiabilityModal,
} from '@/components/networth';

export default function NetWorthPage() {
    // Get real data from Firestore
    const {
        assets,
        liabilities,
        isLoading: loading,
        error,
        addAsset,
        updateAsset,
        deleteAsset,
        addLiability,
        updateLiability,
        deleteLiability,
    } = useUserNetWorth();

    // Modal states
    const [showAddAsset, setShowAddAsset] = useState(false);
    const [showAddLiability, setShowAddLiability] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
    const [timeRange, setTimeRange] = useState<'3M' | '6M' | '1Y' | 'ALL'>('6M');

    // Computed values
    const totalAssets = useMemo(() =>
        assets.reduce((sum, a) => sum + a.value, 0),
        [assets]
    );

    const totalLiabilities = useMemo(() =>
        liabilities.reduce((sum, l) => sum + l.value, 0),
        [liabilities]
    );

    const netWorth = totalAssets - totalLiabilities;

    // Calculate liquid assets (cash + investments)
    const liquidAssets = useMemo(() =>
        assets
            .filter(a => a.category === 'cash' || a.category === 'investments')
            .reduce((sum, a) => sum + a.value, 0),
        [assets]
    );

    // Calculate high-interest debt (> 12%)
    const highInterestDebt = useMemo(() =>
        liabilities
            .filter(l => (l.interestRate || 0) > 12)
            .reduce((sum, l) => sum + l.value, 0),
        [liabilities]
    );

    // Assets by category for charts
    const assetsByCategory = useMemo(() =>
        assets.map(a => ({
            category: a.category,
            value: a.value,
        })),
        [assets]
    );

    // Liabilities by category for insights
    const liabilitiesByCategory = useMemo(() =>
        liabilities.map(l => ({
            category: l.category,
            value: l.value,
            interestRate: l.interestRate,
        })),
        [liabilities]
    );

    // Sample trend data (would come from networthHistory in production)
    const trendData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const data = [];

        // If no data yet, return empty
        if (totalAssets === 0 && totalLiabilities === 0) return [];

        let currentNetWorth = netWorth * 0.85; // Start at 85% of current

        for (let i = 11; i >= 0; i--) {
            const monthIndex = (now.getMonth() - i + 12) % 12;
            currentNetWorth += (netWorth - currentNetWorth) / (i + 1); // Gradually approach current

            data.push({
                date: months[monthIndex],
                netWorth: Math.round(currentNetWorth),
                assets: Math.round(currentNetWorth * 1.3),
                liabilities: Math.round(currentNetWorth * 0.3),
            });
        }

        return data;
    }, [netWorth, totalAssets, totalLiabilities]);

    // Handlers
    const handleAddAsset = async (asset: {
        name: string;
        category: AssetCategory;
        value: number;
        purchaseValue?: number;
        purchaseDate?: string;
        notes?: string;
    }) => {
        await addAsset(asset);
    };

    const handleAddLiability = async (liability: {
        name: string;
        category: LiabilityCategory;
        value: number;
        originalAmount?: number;
        interestRate?: number;
        emiAmount?: number;
        tenureMonths?: number;
        startDate?: string;
        notes?: string;
    }) => {
        await addLiability(liability);
    };

    const handleEditAsset = (asset: Asset) => {
        setEditingAsset(asset);
        setShowAddAsset(true);
    };

    const handleEditLiability = (liability: Liability) => {
        setEditingLiability(liability);
        setShowAddLiability(true);
    };

    const handleDeleteAsset = async (id: string) => {
        if (confirm('Are you sure you want to delete this asset?')) {
            await deleteAsset(id);
        }
    };

    const handleDeleteLiability = async (id: string) => {
        if (confirm('Are you sure you want to delete this liability?')) {
            await deleteLiability(id);
        }
    };

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    // Check if we have any data
    const hasData = assets.length > 0 || liabilities.length > 0;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-4 lg:p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Loading your net worth data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-4 lg:p-8 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader icon={Landmark} iconColor="text-amber-400" title="Net Worth" />
            <div className="p-4 lg:p-8">

                {/* Empty State */}
                {!hasData && (
                    <NetWorthEmptyState
                        onAddAsset={() => setShowAddAsset(true)}
                        onAddLiability={() => setShowAddLiability(true)}
                    />
                )}

                {/* Main Content when data exists */}
                {hasData && (
                    <>
                        {/* Net Worth Summary Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
                        >
                            {/* Total Assets Card */}
                            <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400">Total Assets</span>
                                </div>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {formatValue(totalAssets)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
                                </p>
                            </div>

                            {/* Total Liabilities Card */}
                            <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400">Total Liabilities</span>
                                </div>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {formatValue(totalLiabilities)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {liabilities.length} {liabilities.length === 1 ? 'liability' : 'liabilities'}
                                </p>
                            </div>

                            {/* Net Worth Card */}
                            <div className={`rounded-2xl p-6 shadow-sm border ${netWorth >= 0
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                : 'bg-gradient-to-br from-red-500 to-rose-600'
                                } text-white`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <PiggyBank className="w-5 h-5" />
                                    </div>
                                    <span className="opacity-90">Net Worth</span>
                                </div>
                                <p className="text-3xl font-bold">{formatValue(netWorth)}</p>
                                <p className="text-xs opacity-75 mt-1">
                                    {netWorth >= 0 ? "You're in the green! 🎉" : 'Time to reduce debt'}
                                </p>
                            </div>
                        </motion.div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Net Worth Trend Chart */}
                            <NetWorthTrendChart
                                data={trendData}
                                timeRange={timeRange}
                                onTimeRangeChange={setTimeRange}
                            />

                            {/* Asset Allocation Chart */}
                            <AssetAllocationChart
                                assets={assetsByCategory}
                                totalAssets={totalAssets}
                            />
                        </div>

                        {/* Health Score & Insights Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Financial Health Score */}
                            <FinancialHealthScore
                                totalAssets={totalAssets}
                                totalLiabilities={totalLiabilities}
                                liquidAssets={liquidAssets}
                                highInterestDebt={highInterestDebt}
                            />

                            {/* Smart Insights */}
                            <InsightsPanel
                                totalAssets={totalAssets}
                                totalLiabilities={totalLiabilities}
                                liquidAssets={liquidAssets}
                                assetsByCategory={assetsByCategory}
                                liabilitiesByCategory={liabilitiesByCategory}
                            />
                        </div>

                        {/* Assets & Liabilities Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Assets List */}
                            <AssetsList
                                assets={assets}
                                onAddAsset={() => setShowAddAsset(true)}
                                onEditAsset={handleEditAsset}
                                onDeleteAsset={handleDeleteAsset}
                            />

                            {/* Liabilities List */}
                            <LiabilitiesList
                                liabilities={liabilities}
                                onAddLiability={() => setShowAddLiability(true)}
                                onEditLiability={handleEditLiability}
                                onDeleteLiability={handleDeleteLiability}
                            />
                        </div>
                    </>
                )}

                {/* Add Asset Modal */}
                <AddAssetModal
                    isOpen={showAddAsset}
                    onClose={() => {
                        setShowAddAsset(false);
                        setEditingAsset(null);
                    }}
                    onAdd={handleAddAsset}
                />

                {/* Add Liability Modal */}
                <AddLiabilityModal
                    isOpen={showAddLiability}
                    onClose={() => {
                        setShowAddLiability(false);
                        setEditingLiability(null);
                    }}
                    onAdd={handleAddLiability}
                />
            </div>
        </div>
    );
}
