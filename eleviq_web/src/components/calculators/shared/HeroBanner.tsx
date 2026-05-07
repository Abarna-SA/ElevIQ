'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface StatItem {
    label: string;
    value: string;
    prefix?: string;
}

interface HeroBannerProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    gradient: string; // e.g. "from-blue-600 to-indigo-600"
    stats?: StatItem[];
    onBack?: () => void;
    onAskAI?: () => void;
}

// Animated counter component
function AnimatedStat({ stat, delay }: { stat: StatItem; delay: number }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
        >
            <p className="text-white/60 text-[11px] font-medium mb-0.5">{stat.label}</p>
            <p className="text-white text-lg font-bold tracking-tight">
                {stat.prefix}{stat.value}
            </p>
        </motion.div>
    );
}

export function HeroBanner({ icon: Icon, title, description, gradient, stats, onBack, onAskAI }: HeroBannerProps) {
    return (
        <div className="space-y-4">
            {/* Back button */}
            {onBack && (
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={onBack}
                    className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm">Back to calculators</span>
                </motion.button>
            )}

            {/* Banner */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-6`}
            >
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), 
                                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
                    }}
                />

                <div className="relative">
                    {/* Title row */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <p className="text-white/70 text-sm">{description}</p>
                        </div>

                        {/* Ask AI Button */}
                        {onAskAI && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                onClick={onAskAI}
                                className="relative flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/25 transition-colors group"
                            >
                                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Ask AI Advisor</span>
                                <span className="sm:hidden">AI</span>
                                {/* Pulse glow */}
                                <span className="absolute inset-0 rounded-full bg-white/10 animate-ping opacity-20 pointer-events-none" />
                            </motion.button>
                        )}
                    </div>

                    {/* Stats row */}
                    {stats && stats.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-5">
                            {stats.map((stat, i) => (
                                <AnimatedStat key={stat.label} stat={stat} delay={200 + i * 100} />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
