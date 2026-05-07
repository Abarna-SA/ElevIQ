'use client';

import { LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

interface PageHeaderProps {
    icon: LucideIcon;
    iconColor?: string;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({
    icon: Icon,
    iconColor = 'text-purple-400',
    title,
    subtitle,
    actions,
}: PageHeaderProps) {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';

    return (
        <header
            className={`sticky top-0 z-10 flex-shrink-0 h-14 flex items-center justify-between px-4 lg:px-6 border-b backdrop-blur-sm ${isDark
                    ? 'border-white/5 bg-[#171717]/80'
                    : 'border-gray-200 bg-white/80'
                }`}
        >
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <span>/</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {title}
                </span>
                {subtitle && (
                    <>
                        <span className="mx-1">·</span>
                        <span className="text-xs">{subtitle}</span>
                    </>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}
