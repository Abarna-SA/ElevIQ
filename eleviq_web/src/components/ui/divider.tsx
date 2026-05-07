import { cn } from '@/lib/utils/cn';

interface DividerProps {
    className?: string;
}

export function Divider({ className }: DividerProps) {
    return (
        <div className={cn('flex items-center gap-4 my-6', className)}>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <span className="text-sm text-gray-400 dark:text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>
    );
}
