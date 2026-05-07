'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Bill, BillCategory, BillFrequency, PaymentMethod, billTemplates, billCategories, frequencyOptions, paymentMethodOptions, reminderDayOptions } from '@/types/bills';
import { format } from 'date-fns';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AddBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'isPaid'>) => void;
}

interface BillFormData {
    name: string;
    amount: string;
    dueDate: string;
    category: BillCategory;
    frequency: BillFrequency;
    provider: string;
    accountNumber: string;
    autopay: boolean;
    paymentMethod: PaymentMethod;
    reminder: boolean;
    reminderDays: number[];
    notes: string;
    isVariableAmount: boolean;
    dayOfMonth: string;
}

const getIcon = (iconName: string): LucideIcon => {
    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[iconName];
    return IconComponent || Icons.Receipt;
};

export function AddBillModal({ isOpen, onClose, onAdd }: AddBillModalProps) {
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [formData, setFormData] = useState<BillFormData>({
        name: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        category: 'subscription',
        frequency: 'monthly',
        provider: '',
        accountNumber: '',
        autopay: false,
        paymentMethod: 'upi',
        reminder: true,
        reminderDays: [1, 3],
        notes: '',
        isVariableAmount: false,
        dayOfMonth: '',
    });

    const resetForm = () => {
        setStep(1);
        setSelectedTemplate(null);
        setFormData({
            name: '',
            amount: '',
            dueDate: format(new Date(), 'yyyy-MM-dd'),
            category: 'subscription',
            frequency: 'monthly',
            provider: '',
            accountNumber: '',
            autopay: false,
            paymentMethod: 'upi',
            reminder: true,
            reminderDays: [1, 3],
            notes: '',
            isVariableAmount: false,
            dayOfMonth: '',
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = billTemplates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setFormData(prev => ({
                ...prev,
                name: template.name,
                category: template.category,
                frequency: template.defaultFrequency,
                amount: template.suggestedAmount?.toString() || '',
                provider: template.suggestedProvider || '',
            }));
            setStep(2);
        }
    };

    const handleSkipTemplates = () => {
        setStep(2);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.amount) return;

        onAdd({
            name: formData.name,
            amount: parseFloat(formData.amount),
            dueDate: formData.dueDate,
            category: formData.category,
            frequency: formData.frequency,
            provider: formData.provider || undefined,
            accountNumber: formData.accountNumber || undefined,
            autopay: formData.autopay,
            paymentMethod: formData.paymentMethod,
            reminder: formData.reminder,
            reminderDays: formData.reminderDays,
            notes: formData.notes || undefined,
            isVariableAmount: formData.isVariableAmount,
            dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : undefined,
        });

        handleClose();
    };

    const toggleReminderDay = (day: number) => {
        setFormData(prev => ({
            ...prev,
            reminderDays: prev.reminderDays.includes(day)
                ? prev.reminderDays.filter(d => d !== day)
                : [...prev.reminderDays, day].sort((a, b) => a - b)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#171717] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Bill</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${s < step
                                        ? 'bg-green-500 text-white'
                                        : s === step
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                                        }`}
                                >
                                    {s < step ? <Check className="w-4 h-4" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`flex-1 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Template</span>
                        <span>Details</span>
                        <span>Payment</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <p className="text-gray-600 dark:text-gray-400 mb-4">Choose a template or start from scratch</p>

                                <div className="grid grid-cols-4 gap-3">
                                    {billTemplates.slice(0, 12).map((template) => {
                                        const Icon = getIcon(template.icon);
                                        const cat = billCategories.find(c => c.id === template.category);
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => handleTemplateSelect(template.id)}
                                                className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${selectedTemplate === template.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                                                    }`}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                                                    style={{ backgroundColor: `${cat?.color}20` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: cat?.color }} />
                                                </div>
                                                <p className="text-xs font-medium text-gray-900 dark:text-white text-center truncate">
                                                    {template.name.split(' ')[0]}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleSkipTemplates}
                                    className="w-full mt-4 py-3 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                                >
                                    Skip → Create Custom Bill
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Bill Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Bill Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Netflix, Electricity"
                                    />
                                </div>

                                {/* Amount & Provider */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Amount (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Provider
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.provider}
                                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Tata Power"
                                        />
                                    </div>
                                </div>

                                {/* Variable Amount Toggle */}
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isVariableAmount}
                                        onChange={(e) => setFormData({ ...formData, isVariableAmount: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Variable amount</p>
                                        <p className="text-xs text-gray-500">Amount changes each billing cycle</p>
                                    </div>
                                </label>

                                {/* Due Date & Frequency */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Due Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Frequency
                                        </label>
                                        <select
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as BillFrequency })}
                                            className="w-full px-4 py-3 h-12 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                        >
                                            {frequencyOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Category
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {billCategories.map((cat) => {
                                            const Icon = getIcon(cat.icon);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                                    className={`p-2 rounded-xl border-2 transition-all ${formData.category === cat.id
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-100 dark:border-white/5'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5 mx-auto" style={{ color: cat.color }} />
                                                    <p className="text-[10px] mt-1 text-center text-gray-600 dark:text-gray-400">{cat.name}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Account Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Account/Consumer Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="For your reference"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        💳 Payment Method
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {paymentMethodOptions.map((method) => {
                                            const Icon = getIcon(method.icon);
                                            return (
                                                <button
                                                    key={method.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                                                    className={`p-3 rounded-xl border-2 transition-all ${formData.paymentMethod === method.value
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-100 dark:border-white/5'
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5 mx-auto text-gray-600 dark:text-gray-400" />
                                                    <p className="text-[10px] mt-1 text-center text-gray-600 dark:text-gray-400">{method.label}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Auto-Pay Toggle */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <div className="flex-1 pr-4">
                                        <p className="font-medium text-gray-900 dark:text-white">🔄 Auto-Pay Enabled</p>
                                        <p className="text-sm text-gray-500">This bill is auto-debited</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, autopay: !formData.autopay })}
                                        className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors ${formData.autopay ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.autopay ? 'translate-x-8' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Reminders */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            🔔 Reminders
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, reminder: !formData.reminder })}
                                            className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${formData.reminder ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.reminder ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                    {formData.reminder && (
                                        <div className="flex gap-2">
                                            {reminderDayOptions.map((day) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleReminderDay(day)}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.reminderDays.includes(day)
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {day} day{day > 1 ? 's' : ''}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        📝 Notes (Optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={2}
                                        placeholder="Any additional notes..."
                                    />
                                </div>

                                {/* Summary */}
                                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Bill Summary</p>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p><span className="font-medium">{formData.name || 'Untitled'}</span> • ₹{formData.amount || '0'}</p>
                                        <p>Due: {formData.dueDate} • {frequencyOptions.find(f => f.value === formData.frequency)?.label}</p>
                                        {formData.autopay && <p className="text-blue-600">✓ Auto-pay enabled</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5">
                    {step === 1 ? (
                        <button
                            onClick={handleSkipTemplates}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Create Custom Bill
                        </button>
                    ) : step === 2 ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!formData.name || !formData.amount}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Add Bill
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
