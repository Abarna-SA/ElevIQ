'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CalculatorCardProps {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    categoryColor: string;
    categoryName: string;
    popular?: boolean;
    onClick: () => void;
    index?: number;
    variant?: 'default' | 'featured';
}

export function CalculatorCard({
    name,
    description,
    icon: Icon,
    categoryColor,
    categoryName,
    popular,
    onClick,
    index = 0,
    variant = 'default',
}: CalculatorCardProps) {
    if (variant === 'featured') {
        return (
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
                onClick={onClick}
                className="group relative text-left rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer
                    bg-white dark:bg-white/[0.03]
                    border border-gray-100 dark:border-white/[0.06]
                    hover:border-transparent
                    hover:shadow-[0_0_40px_-5px] hover:shadow-blue-500/15 dark:hover:shadow-blue-500/20"
            >
                {/* Hover glow border */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                        background: `linear-gradient(135deg, ${categoryColor}20, transparent 50%, ${categoryColor}10)`,
                    }}
                />

                <div className="relative p-5 h-full flex flex-col">
                    {/* Icon */}
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                        style={{
                            background: `linear-gradient(135deg, ${categoryColor}25, ${categoryColor}10)`,
                            color: categoryColor,
                        }}
                    >
                        <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">{description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                        {popular && (
                            <span className="relative text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 overflow-hidden">
                                <span className="relative z-10">⭐ Popular</span>
                                {/* Shimmer */}
                                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1 ml-auto" />
                    </div>
                </div>
            </motion.button>
        );
    }

    // Default variant — list-style card
    return (
        <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 350, damping: 28 }}
            onClick={onClick}
            className="group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer
                bg-white dark:bg-white/[0.03]
                border border-gray-100 dark:border-white/[0.06]
                hover:border-transparent
                hover:shadow-[0_0_30px_-5px] hover:shadow-blue-500/10 dark:hover:shadow-blue-500/15"
        >
            {/* Hover glow border */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${categoryColor}15, transparent 60%, ${categoryColor}08)`,
                }}
            />

            <div className="relative p-4 flex items-center gap-4">
                {/* Icon */}
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                        background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}08)`,
                        color: categoryColor,
                    }}
                >
                    <Icon className="w-5 h-5" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {popular && (
                        <span className="relative text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 overflow-hidden">
                            <span className="relative z-10">⭐</span>
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1" />
                </div>
            </div>

            {/* Category bottom bar */}
            <div className="px-4 pb-3">
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50 dark:border-white/[0.03]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColor }} />
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{categoryName}</span>
                </div>
            </div>
        </motion.button>
    );
}
