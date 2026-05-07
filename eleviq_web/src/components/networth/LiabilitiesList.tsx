'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building, CreditCard, Calendar, Wallet,
    Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { LIABILITY_CATEGORIES, type Liability } from '@/types/networth';

interface LiabilitiesListProps {
    liabilities: Liability[];
    onAddLiability: () => void;
    onEditLiability: (liability: Liability) => void;
    onDeleteLiability: (liabilityId: string) => void;
}

export default function LiabilitiesList({
    liabilities,
    onAddLiability,
    onEditLiability,
    onDeleteLiability
}: LiabilitiesListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'value' | 'interest' | 'name'>('value');

    const getIcon = (category: string) => {
        switch (category) {
            case 'loans': return Building;
            case 'credit_cards': return CreditCard;
            case 'emi': return Calendar;
            default: return Wallet;
        }
    };

    const formatValue = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const groupedLiabilities = useMemo(() => {
        const filtered = liabilities.filter(liability =>
            liability.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const grouped: Record<string, { total: number; items: Liability[] }> = {};

        filtered.forEach(liability => {
            if (!grouped[liability.category]) {
                grouped[liability.category] = { total: 0, items: [] };
            }
            grouped[liability.category].total += liability.value;
            grouped[liability.category].items.push(liability);
        });

        // Sort items within each category
        Object.values(grouped).forEach(group => {
            group.items.sort((a, b) => {
                if (sortBy === 'value') return b.value - a.value;
                if (sortBy === 'interest') return (b.interestRate || 0) - (a.interestRate || 0);
                return a.name.localeCompare(b.name);
            });
        });

        return grouped;
    }, [liabilities, searchQuery, sortBy]);

    const totalLiabilities = useMemo(() =>
        liabilities.reduce((sum, l) => sum + l.value, 0),
        [liabilities]
    );

    const highInterestCount = useMemo(() =>
        liabilities.filter(l => (l.interestRate || 0) > 15).length,
        [liabilities]
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
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Liabilities</h3>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatValue(totalLiabilities)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onAddLiability}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Liability
                    </button>
                </div>

                {/* High Interest Warning */}
                {highInterestCount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                            You have <strong>{highInterestCount}</strong> high-interest {highInterestCount === 1 ? 'debt' : 'debts'} (&gt;15%). Consider prioritizing these.
                        </p>
                    </div>
                )}

                {/* Search & Sort */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search liabilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'value' | 'interest' | 'name')}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                        <option value="value">Sort by Amount</option>
                        <option value="interest">Sort by Interest Rate</option>
                        <option value="name">Sort by Name</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto">
                {Object.keys(groupedLiabilities).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                            {searchQuery ? 'No liabilities match your search' : 'No liabilities added yet'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            That's a good thing! 🎉
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {LIABILITY_CATEGORIES.map(category => {
                            const group = groupedLiabilities[category.id];
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
                                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
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
                                                    {group.items.map((liability, index) => (
                                                        <motion.div
                                                            key={liability.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {liability.name}
                                                                    </p>
                                                                    {(liability.interestRate || 0) > 15 && (
                                                                        <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                                                                            High Rate
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    {liability.interestRate && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {liability.interestRate}% p.a.
                                                                        </span>
                                                                    )}
                                                                    {liability.emiAmount && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            EMI: ₹{liability.emiAmount.toLocaleString('en-IN')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                                        {formatValue(liability.value)}
                                                                    </p>
                                                                    {liability.originalAmount && (
                                                                        <p className="text-xs text-gray-400">
                                                                            of {formatValue(liability.originalAmount)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="hidden group-hover:flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => onEditLiability(liability)}
                                                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    >
                                                                        <Pencil className="w-4 h-4 text-gray-500" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onDeleteLiability(liability.id)}
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
