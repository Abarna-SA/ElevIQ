'use client';

import { motion } from 'framer-motion';

interface GoalProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color: string;
    children?: React.ReactNode;
}

export default function GoalProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    color,
    children
}: GoalProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100 dark:text-gray-800"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children || (
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {Math.round(progress)}%
                    </span>
                )}
            </div>
        </div>
    );
}
