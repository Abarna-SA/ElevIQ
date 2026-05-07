'use client';

import { motion } from 'framer-motion';
import { X, Check, Edit2, Trash2, Calendar, CreditCard, Bell, Clock, FileText } from 'lucide-react';
import { Bill, BillPaymentHistory, billCategories, frequencyOptions, paymentMethodOptions } from '@/types/bills';
import { format, parseISO } from 'date-fns';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface BillDetailModalProps {
    isOpen: boolean;
    bill: Bill | null;
    paymentHistory: BillPaymentHistory[];
    onClose: () => void;
    onMarkAsPaid: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const getIcon = (iconName: string): LucideIcon => {
    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[iconName];
    return IconComponent || Icons.Receipt;
};

export function BillDetailModal({
    isOpen,
    bill,
    paymentHistory,
    onClose,
    onMarkAsPaid,
    onEdit,
    onDelete
}: BillDetailModalProps) {
    if (!isOpen || !bill) return null;

    const category = billCategories.find(c => c.id === bill.category);
    const Icon = getIcon(category?.icon || 'Receipt');
    const frequency = frequencyOptions.find(f => f.value === bill.frequency);
    const paymentMethod = paymentMethodOptions.find(p => p.value === bill.paymentMethod);

    const getDueStatusInfo = () => {
        if (bill.isPaid) return { text: 'Paid', color: 'bg-green-500', textColor: 'text-green-600' };

        const dueDate = parseISO(bill.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Overdue', color: 'bg-red-500', textColor: 'text-red-600' };
        if (diffDays === 0) return { text: 'Due Today', color: 'bg-orange-500', textColor: 'text-orange-600' };
        if (diffDays <= 3) return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'bg-yellow-500', textColor: 'text-yellow-600' };
        return { text: `Due in ${diffDays} days`, color: 'bg-blue-500', textColor: 'text-blue-600' };
    };

    const status = getDueStatusInfo();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${category?.color}20` }}
                        >
                            <Icon className="w-6 h-6" style={{ color: category?.color }} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{bill.name}</h3>
                            {bill.provider && (
                                <p className="text-sm text-gray-500">{bill.provider}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Amount & Status */}
                    <div className="text-center py-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            ₹{bill.amount.toLocaleString()}
                        </p>
                        <p className="text-gray-500 mb-3">
                            Due {format(parseISO(bill.dueDate), 'MMM d, yyyy')}
                        </p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${status.color}/10 ${status.textColor} rounded-full text-sm font-medium`}>
                            <span className={`w-2 h-2 ${status.color} rounded-full`} />
                            {status.text}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Details</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs">Frequency</span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">{frequency?.label}</p>
                            </div>

                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-xs">Payment</span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">{paymentMethod?.label || 'Not set'}</p>
                            </div>

                            {bill.autopay && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl col-span-2">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Check className="w-4 h-4" />
                                        <span className="text-sm font-medium">Auto-pay enabled</span>
                                    </div>
                                </div>
                            )}

                            {bill.reminder && (
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl col-span-2">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <Bell className="w-4 h-4" />
                                        <span className="text-xs">Reminders</span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {bill.reminderDays.map(d => `${d} day${d > 1 ? 's' : ''}`).join(', ')} before
                                    </p>
                                </div>
                            )}

                            {bill.accountNumber && (
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl col-span-2">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-xs">Account Number</span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white font-mono">{bill.accountNumber}</p>
                                </div>
                            )}

                            {bill.notes && (
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl col-span-2">
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-xs">Notes</span>
                                    </div>
                                    <p className="text-gray-900 dark:text-white text-sm">{bill.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    {paymentHistory.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment History</h4>
                            <div className="space-y-2">
                                {paymentHistory.slice(0, 5).map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    ₹{payment.amount.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(parseISO(payment.paidDate), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        {payment.onTime ? (
                                            <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                                On time
                                            </span>
                                        ) : (
                                            <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                                                Late
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5">
                    <div className="grid grid-cols-3 gap-3">
                        {!bill.isPaid && (
                            <button
                                onClick={onMarkAsPaid}
                                className="py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Paid
                            </button>
                        )}
                        <button
                            onClick={onEdit}
                            className={`py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 ${bill.isPaid ? 'col-span-2' : ''
                                }`}
                        >
                            <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
