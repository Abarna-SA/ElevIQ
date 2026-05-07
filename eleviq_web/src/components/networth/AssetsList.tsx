'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingUp, Home, Car, Briefcase, Gem,
    Plus, Pencil, Trash2, Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { ASSET_CATEGORIES, type Asset, type AssetCategory } from '@/types/networth';

interface AssetsListProps {
    assets: Asset[];
    onAddAsset: () => void;
    onEditAsset: (asset: Asset) => void;
    onDeleteAsset: (assetId: string) => void;
}

export default function AssetsList({
    assets,
    onAddAsset,
    onEditAsset,
    onDeleteAsset
}: AssetsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'value' | 'name' | 'date'>('value');

    const getIcon = (category: string) => {
        switch (category) {
            case 'cash': return Wallet;
            case 'investments': return TrendingUp;
            case 'property': return Home;
            case 'vehicles': return Car;
            case 'gold': return Gem;
            default: return Briefcase;
        }
    };

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const groupedAssets = useMemo(() => {
        const filtered = assets.filter(asset =>
            asset.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const grouped: Record<string, { total: number; items: Asset[] }> = {};

        filtered.forEach(asset => {
            if (!grouped[asset.category]) {
                grouped[asset.category] = { total: 0, items: [] };
            }
            grouped[asset.category].total += asset.value;
            grouped[asset.category].items.push(asset);
        });

        // Sort items within each category
        Object.values(grouped).forEach(group => {
            group.items.sort((a, b) => {
                if (sortBy === 'value') return b.value - a.value;
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                // Sort by date: handle optional createdAt
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bDate - aDate;
            });
        });

        return grouped;
    }, [assets, searchQuery, sortBy]);

    const totalAssets = useMemo(() =>
        assets.reduce((sum, a) => sum + a.value, 0),
        [assets]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Assets</h3>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatValue(totalAssets)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAddAsset}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Asset
                    </button>
                </div>

                {/* Search & Sort */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'value' | 'name' | 'date')}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    >
                        <option value="value">Sort by Value</option>
                        <option value="name">Sort by Name</option>
                        <option value="date">Sort by Date</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto">
                {Object.keys(groupedAssets).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                            {searchQuery ? 'No assets match your search' : 'No assets added yet'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {ASSET_CATEGORIES.map(category => {
                            const group = groupedAssets[category.id];
                            if (!group) return null;

                            const Icon = getIcon(category.id);
                            const isExpanded = expandedCategory === category.id;

                            return (
                                <div key={category.id}>
                                    {/* Category Header */}
                                    <button
                                        onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${category.color}20` }}
                                            >
                                                <Icon className="w-5 h-5" style={{ color: category.color }} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {category.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {formatValue(group.total)}
                                            </p>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Items */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-4 space-y-2">
                                                    {group.items.map((asset, index) => (
                                                        <motion.div
                                                            key={asset.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {asset.name}
                                                                </p>
                                                                {asset.notes && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                        {asset.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                                    {formatValue(asset.value)}
                                                                </p>
                                                                <div className="hidden group-hover:flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => onEditAsset(asset)}
                                                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    >
                                                                        <Pencil className="w-4 h-4 text-gray-500" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onDeleteAsset(asset.id)}
                                                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
