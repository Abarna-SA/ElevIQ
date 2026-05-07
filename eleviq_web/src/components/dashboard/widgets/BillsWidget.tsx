'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
    category: string;
}

interface BillsWidgetProps {
    bills: Bill[];
}

export default function BillsWidget({ bills }: BillsWidgetProps) {
    const upcomingBills = bills
        .filter(b => !b.isPaid)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const totalDue = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

    const getDaysText = (dueDate: Date) => {
        const days = differenceInDays(dueDate, new Date());
        if (days < 0) return { text: 'Overdue', urgent: true };
        if (days === 0) return { text: 'Today', urgent: true };
        if (days === 1) return { text: 'Tomorrow', urgent: true };
        if (days <= 3) return { text: `${days} days`, urgent: true };
        return { text: `${days} days`, urgent: false };
    };

    if (upcomingBills.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 p-6 h-full shadow-sm flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Upcoming Bills</h3>
                </div>

                {/* Empty State */}
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                        <Clock className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Add your first bill</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Never miss a payment again</p>
                    <Link
                        href="/bills"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <span className="text-lg">+</span> Add Bill
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#171717] rounded-2xl border border-gray-200/60 dark:border-white/5 h-full shadow-sm flex flex-col"
        >
            {/* Header - Edge to Edge */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Upcoming Bills</h3>
                <Link
                    href="/bills"
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                >
                    All
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-6 pt-5 flex-1 flex flex-col">

                {/* Total */}
                <div className="mb-6">
                    <p className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                        ₹{totalDue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{upcomingBills.length} bills due</p>
                </div>

                {/* Bills List */}
                <div className="flex-1 space-y-3">
                    {upcomingBills.slice(0, 4).map((bill) => {
                        const { text, urgent } = getDaysText(bill.dueDate);
                        return (
                            <div
                                key={bill.id}
                                className="flex items-center justify-between py-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-8 rounded-full ${urgent ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.name}</p>
                                        <p className={`text-xs ${urgent ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {text}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    ₹{bill.amount.toLocaleString('en-IN')}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
