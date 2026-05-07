'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface GoalMilestonesProps {
    progress: number;
    color: string;
}

const milestones = [25, 50, 75, 100];

export default function GoalMilestones({ progress, color }: GoalMilestonesProps) {
    return (
        <div className="relative">
            {/* Track line */}
            <div className="absolute top-3 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
            <div
                className="absolute top-3 left-4 h-0.5 transition-all duration-500"
                style={{
                    width: `${Math.min(progress, 100) * 0.92}%`,
                    backgroundColor: color,
                }}
            />

            {/* Milestone dots */}
            <div className="relative flex justify-between px-2">
                {milestones.map((milestone, index) => {
                    const isReached = progress >= milestone;
                    const isCurrent = progress >= milestone && (index === milestones.length - 1 || progress < milestones[index + 1]);

                    return (
                        <motion.div
                            key={milestone}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center"
                        >
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${isReached
                                        ? 'border-transparent'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717]'
                                    }`}
                                style={{
                                    backgroundColor: isReached ? color : undefined,
                                    boxShadow: isCurrent ? `0 0 0 4px ${color}30` : undefined,
                                }}
                            >
                                {isReached && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-xs mt-1 ${isReached ? 'font-semibold' : 'text-gray-400'
                                }`} style={{ color: isReached ? color : undefined }}>
                                {milestone}%
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
