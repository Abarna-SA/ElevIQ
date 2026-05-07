'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, RotateCcw, Copy, Check, Loader2 } from 'lucide-react';

export interface SummarySection {
    icon: string;
    title: string;
    content: string;
}

export interface CalculatorContextItem {
    label: string;
    value: string;
}

interface AIAdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    calculatorName: string;
    calculatorContext: CalculatorContextItem[];
    generateSummary: () => SummarySection[];
}

type ModalState = 'idle' | 'analyzing' | 'complete';

const ANALYSIS_STEPS = [
    'Reading your inputs...',
    'Calculating optimal scenarios...',
    'Analyzing financial patterns...',
    'Generating recommendations...',
    'Preparing your summary...',
];

export function AIAdvisorModal({
    isOpen,
    onClose,
    calculatorName,
    calculatorContext,
    generateSummary,
}: AIAdvisorModalProps) {
    const [state, setState] = useState<ModalState>('idle');
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [sections, setSections] = useState<SummarySection[]>([]);
    const [visibleText, setVisibleText] = useState<string[]>([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setState('idle');
            setCurrentStep(0);
            setProgress(0);
            setSections([]);
            setVisibleText([]);
            setCurrentSectionIndex(0);
            setCurrentCharIndex(0);
            setCopied(false);
        }
        return () => {
            if (typingRef.current) clearTimeout(typingRef.current);
        };
    }, [isOpen]);

    // Analysis step animation
    useEffect(() => {
        if (state !== 'analyzing') return;

        const stepDuration = 900;
        const totalDuration = ANALYSIS_STEPS.length * stepDuration;

        // Progress bar
        const progressInterval = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return p + (100 / (totalDuration / 50));
            });
        }, 50);

        // Step transitions
        const stepTimers = ANALYSIS_STEPS.map((_, i) =>
            setTimeout(() => setCurrentStep(i + 1), (i + 1) * stepDuration)
        );

        // Complete analysis
        const completeTimer = setTimeout(() => {
            const generatedSections = generateSummary();
            setSections(generatedSections);
            setVisibleText(generatedSections.map(() => ''));
            setCurrentSectionIndex(0);
            setCurrentCharIndex(0);
            setState('complete');
        }, totalDuration + 300);

        return () => {
            clearInterval(progressInterval);
            stepTimers.forEach(clearTimeout);
            clearTimeout(completeTimer);
        };
    }, [state, generateSummary]);

    // Typewriter animation
    useEffect(() => {
        if (state !== 'complete' || sections.length === 0) return;
        if (currentSectionIndex >= sections.length) return;

        const currentContent = sections[currentSectionIndex].content;

        if (currentCharIndex < currentContent.length) {
            typingRef.current = setTimeout(() => {
                setVisibleText((prev) => {
                    const updated = [...prev];
                    updated[currentSectionIndex] = currentContent.slice(0, currentCharIndex + 1);
                    return updated;
                });
                setCurrentCharIndex((i) => i + 1);

                // Auto-scroll
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 15 + Math.random() * 15); // Variable speed for natural feel
        } else {
            // Move to next section
            typingRef.current = setTimeout(() => {
                setCurrentSectionIndex((i) => i + 1);
                setCurrentCharIndex(0);
            }, 400);
        }

        return () => {
            if (typingRef.current) clearTimeout(typingRef.current);
        };
    }, [state, sections, currentSectionIndex, currentCharIndex]);

    const handleSummarize = useCallback(() => {
        setState('analyzing');
        setCurrentStep(0);
        setProgress(0);
    }, []);

    const handleRegenerate = useCallback(() => {
        setSections([]);
        setVisibleText([]);
        setCurrentSectionIndex(0);
        setCurrentCharIndex(0);
        setState('analyzing');
        setCurrentStep(0);
        setProgress(0);
    }, []);

    const handleCopy = useCallback(() => {
        const text = sections
            .map((s) => `${s.icon} ${s.title}\n${s.content}`)
            .join('\n\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [sections]);

    const isTypingDone = currentSectionIndex >= sections.length && sections.length > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]"
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
                        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <Sparkles className="w-4.5 h-4.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                        AI Financial Advisor
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {state === 'analyzing'
                                            ? `Analyzing your ${calculatorName.replace(' Calculator', '')} configuration...`
                                            : `${calculatorName} Analysis`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-white/10 rounded-md hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Body */}
                        <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto">
                            {/* Idle State */}
                            {state === 'idle' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 space-y-6"
                                >
                                    {/* AI Introduction */}
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 flex items-center justify-center border border-purple-200/50 dark:border-purple-500/20">
                                            <Sparkles className="w-7 h-7 text-purple-500" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
                                            I&apos;ll analyze your current{' '}
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {calculatorName.replace(' Calculator', '').toLowerCase()}
                                            </span>{' '}
                                            configuration and provide personalized financial advice.
                                        </p>
                                    </div>

                                    {/* Context Pills */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                                            Your Current Inputs
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {calculatorContext.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10"
                                                >
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {item.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summarize Button */}
                                    <button
                                        onClick={handleSummarize}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Summarize Now
                                    </button>
                                </motion.div>
                            )}

                            {/* Analyzing State */}
                            {state === 'analyzing' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 space-y-6"
                                >
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Analyzing...</span>
                                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                {Math.min(100, Math.round(progress))}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                                transition={{ duration: 0.1 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Step Indicators */}
                                    <div className="space-y-3">
                                        {ANALYSIS_STEPS.map((step, i) => {
                                            const isCompleted = i < currentStep;
                                            const isActive = i === currentStep;
                                            return (
                                                <motion.div
                                                    key={step}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    {isCompleted ? (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                                                        >
                                                            <Check className="w-3 h-3 text-white" />
                                                        </motion.div>
                                                    ) : isActive ? (
                                                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                                            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-white/10 flex-shrink-0" />
                                                    )}
                                                    <span
                                                        className={`text-sm transition-colors ${isCompleted
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : isActive
                                                                ? 'text-gray-900 dark:text-white font-medium'
                                                                : 'text-gray-400 dark:text-gray-500'
                                                            }`}
                                                    >
                                                        {step}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* Complete State */}
                            {state === 'complete' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-6 space-y-5"
                                >
                                    {sections.map((section, i) => {
                                        const text = visibleText[i] || '';
                                        if (i > currentSectionIndex && !isTypingDone) return null;
                                        return (
                                            <motion.div
                                                key={section.title}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-base">{section.icon}</span>
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {section.title}
                                                    </h4>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-7">
                                                    {isTypingDone ? section.content : text}
                                                    {i === currentSectionIndex && !isTypingDone && (
                                                        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 animate-pulse align-text-bottom" />
                                                    )}
                                                </p>
                                                {i < sections.length - 1 && (
                                                    <div className="border-b border-gray-100 dark:border-white/5 mt-5" />
                                                )}
                                            </motion.div>
                                        );
                                    })}

                                    {/* Action Buttons (shown after typing completes) */}
                                    <AnimatePresence>
                                        {isTypingDone && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-3 pt-2"
                                            >
                                                <button
                                                    onClick={handleRegenerate}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Regenerate
                                                </button>
                                                <button
                                                    onClick={handleCopy}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            Copy Summary
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-center px-6 py-3 border-t border-gray-100 dark:border-white/5">
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                Powered by ElevIQ AI · Based on your inputs
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
