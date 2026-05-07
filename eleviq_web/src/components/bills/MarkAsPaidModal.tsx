'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Calendar, Receipt } from 'lucide-react';
import { Bill, billCategories } from '@/types/bills';
import { format } from 'date-fns';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface MarkAsPaidModalProps {
    isOpen: boolean;
    bill: Bill | null;
    onClose: () => void;
    onConfirm: (billId: string, paidAmount: number, paidDate: string) => void;
}

const getIcon = (iconName: string): LucideIcon => {
    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[iconName];
    return IconComponent || Icons.Receipt;
};

export function MarkAsPaidModal({ isOpen, bill, onClose, onConfirm }: MarkAsPaidModalProps) {
    const [paidAmount, setPaidAmount] = useState('');
    const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    if (!isOpen || !bill) return null;

    const category = billCategories.find(c => c.id === bill.category);
    const Icon = getIcon(category?.icon || 'Receipt');

    const handleConfirm = () => {
        const amount = parseFloat(paidAmount) || bill.amount;
        onConfirm(bill.id, amount, paidDate);
        setPaidAmount('');
        setPaidDate(format(new Date(), 'yyyy-MM-dd'));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mark as Paid</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Bill Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${category?.color}20` }}
                        >
                            <Icon className="w-6 h-6" style={{ color: category?.color }} />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{bill.name}</p>
                            <p className="text-sm text-gray-500">Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Expected</label>
                            <p className="text-xl font-bold text-gray-400">₹{bill.amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Paid Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    placeholder={bill.amount.toString()}
                                    className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Adjust if different</p>
                        </div>
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Payment Date
                        </label>
                        <input
                            type="date"
                            value={paidDate}
                            onChange={(e) => setPaidDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Attach Receipt Placeholder */}
                    <button className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:border-gray-300 dark:hover:border-white/20 transition-colors flex items-center justify-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Attach Receipt (Coming Soon)
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Confirm Payment
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
