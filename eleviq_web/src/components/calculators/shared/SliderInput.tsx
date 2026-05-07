'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SliderInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    prefix?: string;
    suffix?: string;
    formatValue?: (value: number) => string;
    quickValues?: number[];
}

export function SliderInput({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    prefix = '',
    suffix = '',
    formatValue,
    quickValues,
}: SliderInputProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const displayValue = formatValue ? formatValue(value) : value.toLocaleString();

    // Handle drag interaction
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        updateValue(e.clientX);

        const handleMouseMove = (e: MouseEvent) => {
            updateValue(e.clientX);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [min, max, step]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        updateValue(e.touches[0].clientX);

        const handleTouchMove = (e: TouchEvent) => {
            updateValue(e.touches[0].clientX);
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    }, [min, max, step]);

    const updateValue = useCallback((clientX: number) => {
        if (!trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const rawValue = min + percent * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.min(max, Math.max(min, steppedValue));

        if (clampedValue !== value) {
            onChange(clampedValue);
        }
    }, [min, max, step, value, onChange]);

    return (
        <div className="space-y-3">
            {/* Label and Value Display */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
                <div className="flex items-center gap-1">
                    {prefix && <span className="text-sm text-gray-500 dark:text-gray-400">{prefix}</span>}
                    <input
                        type="text"
                        value={displayValue}
                        onChange={(e) => {
                            const cleanValue = e.target.value.replace(/[^0-9.]/g, '');
                            const num = parseFloat(cleanValue);
                            if (!isNaN(num) && num >= min && num <= max) {
                                onChange(Math.round(num / step) * step);
                            }
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-24 text-right font-bold text-lg text-gray-900 dark:text-white"
                        style={{
                            background: 'transparent',
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                        }}
                    />
                    {suffix && <span className="text-sm text-gray-500 dark:text-gray-400">{suffix}</span>}
                </div>
            </div>

            {/* Enhanced Slider Track */}
            <div
                ref={trackRef}
                className="relative h-8 flex items-center cursor-pointer touch-none select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Track Background */}
                <div className="absolute inset-x-0 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    {/* Filled Track with Gradient */}
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                        }}
                        initial={false}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>

                {/* Track Glow Effect */}
                <div
                    className="absolute h-2 rounded-full blur-sm opacity-50 pointer-events-none"
                    style={{
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                    }}
                />

                {/* Thumb */}
                <motion.div
                    className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg border-2 cursor-grab z-10 ${isDragging ? 'cursor-grabbing scale-110' : ''
                        }`}
                    style={{
                        left: `calc(${percentage}% - 12px)`,
                        background: 'linear-gradient(135deg, #ffffff, #f3f4f6)',
                        borderColor: '#3b82f6',
                        boxShadow: isDragging
                            ? '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15)'
                            : '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                    initial={false}
                    animate={{
                        left: `calc(${percentage}% - 12px)`,
                        scale: isDragging ? 1.15 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    {/* Inner dot */}
                    <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                </motion.div>

                {/* Hover/Drag Value Tooltip */}
                {isDragging && (
                    <motion.div
                        className="absolute -top-10 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium shadow-lg"
                        style={{ left: `calc(${percentage}% - 40px)` }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        {prefix}{displayValue}{suffix}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900 dark:bg-white" />
                    </motion.div>
                )}
            </div>

            {/* Min/Max Range Labels */}
            <div className="flex items-center justify-between -mt-1">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {prefix}{formatValue ? formatValue(min) : min.toLocaleString()}{suffix}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {prefix}{formatValue ? formatValue(max) : max.toLocaleString()}{suffix}
                </span>
            </div>

            {/* Quick Value Buttons — Glassmorphic Pills */}
            {quickValues && quickValues.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {quickValues.map((qv) => {
                        const isSelected = value === qv;
                        return (
                            <motion.button
                                key={qv}
                                onClick={() => onChange(qv)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${isSelected
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                                    : 'bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {prefix}{formatValue ? formatValue(qv) : qv.toLocaleString()}{suffix}
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
