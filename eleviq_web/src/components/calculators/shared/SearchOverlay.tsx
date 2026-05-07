'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Command } from 'lucide-react';

interface CalculatorItem {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    popular?: boolean;
}

interface CategoryItem {
    id: string;
    name: string;
    color: string;
}

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    calculators: CalculatorItem[];
    categories: CategoryItem[];
    onSelect: (id: string) => void;
}

export function SearchOverlay({ isOpen, onClose, calculators, categories, onSelect }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fuzzy search
    const results = useMemo(() => {
        if (!query.trim()) return calculators;
        const q = query.toLowerCase();
        return calculators.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.category.toLowerCase().includes(q)
        );
    }, [query, calculators]);

    // Group results by category
    const groupedResults = useMemo(() => {
        const groups: Record<string, CalculatorItem[]> = {};
        results.forEach((calc) => {
            if (!groups[calc.category]) groups[calc.category] = [];
            groups[calc.category].push(calc);
        });
        return groups;
    }, [results]);

    // Flat list for keyboard navigation
    const flatResults = useMemo(() => {
        const flat: CalculatorItem[] = [];
        Object.values(groupedResults).forEach((group) => flat.push(...group));
        return flat;
    }, [groupedResults]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (flatResults[selectedIndex]) {
                        handleSelect(flatResults[selectedIndex].id);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, flatResults, onClose]);

    const handleSelect = (id: string) => {
        onSelect(id);
        onClose();
    };

    const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || id;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xl mx-4 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/5">
                            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                placeholder="Search calculators..."
                                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 text-base outline-none"
                            />
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-white/10 rounded-md"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[50vh] overflow-y-auto py-2">
                            {flatResults.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No calculators found for &ldquo;{query}&rdquo;
                                    </p>
                                </div>
                            ) : (
                                Object.entries(groupedResults).map(([categoryId, calcs]) => (
                                    <div key={categoryId}>
                                        <div className="px-5 py-2">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                {getCategoryName(categoryId)}
                                            </span>
                                        </div>
                                        {calcs.map((calc) => {
                                            const globalIndex = flatResults.indexOf(calc);
                                            const isSelected = globalIndex === selectedIndex;
                                            const Icon = calc.icon;
                                            return (
                                                <button
                                                    key={calc.id}
                                                    onClick={() => handleSelect(calc.id)}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-500/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${isSelected
                                                            ? 'text-blue-700 dark:text-blue-300'
                                                            : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                            {calc.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {calc.description}
                                                        </p>
                                                    </div>
                                                    {calc.popular && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex-shrink-0">
                                                            Popular
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px] font-mono">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px] font-mono">↵</kbd>
                                Select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px] font-mono">esc</kbd>
                                Close
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
