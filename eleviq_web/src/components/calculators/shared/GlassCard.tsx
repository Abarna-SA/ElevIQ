'use client';

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface GlassCardProps {
    title: string;
    icon?: LucideIcon;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function GlassCard({ title, icon: Icon, action, children, className = '', noPadding = false }: GlassCardProps) {
    return (
        <div className={`bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden ${className}`}>
            {/* Header — matches dashboard widget pattern */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className="w-5 h-5 text-gray-400 dark:text-gray-500">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                        {title}
                    </h3>
                </div>
                {action && <div>{action}</div>}
            </div>
            {/* Body */}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
}
