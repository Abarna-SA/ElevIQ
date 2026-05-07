'use client';

import React, { useState, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
    defaultCategories,
    Category,
    PaymentMethod,
    paymentMethodLabels,
    ExpenseItem,
    CreateEnhancedExpenseInput,
    ExpenseMetadata,
    generateItemId
} from '@/types/expense';
import { useEnhancedExpenseStore } from '@/store/enhanced-expense-store';
import { FuelForm, GroceryForm, FoodForm } from './forms';
import { ReceiptScanner } from './ReceiptScanner';
import { LineItemsManager } from './LineItemsManager';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (expenseId: string) => void;
}

type Step = 'category' | 'details' | 'review';

export function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
    const { addExpense } = useEnhancedExpenseStore();

    // Step state
    const [step, setStep] = useState<Step>('category');

    // Form state
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [vendor, setVendor] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [items, setItems] = useState<Partial<ExpenseItem>[]>([
        { id: generateItemId(), name: '', quantity: 1, unitPrice: 0, subtotal: 0 }
    ]);
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [taxPercent, setTaxPercent] = useState(0);
    const [amount, setAmount] = useState(0);
    const [metadata, setMetadata] = useState<ExpenseMetadata | undefined>();
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form
    const resetForm = useCallback(() => {
        setStep('category');
        setSelectedCategory(null);
        setVendor('');
        setDescription('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setPaymentMethod('upi');
        setItems([{ id: generateItemId(), name: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
        setSubtotal(0);
        setDiscount(0);
        setTaxAmount(0);
        setTaxPercent(0);
        setAmount(0);
        setMetadata(undefined);
        setNotes('');
    }, []);

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Handle category-specific data changes
    const handleFormDataChange = useCallback((data: any) => {
        if (data.vendor !== undefined) setVendor(data.vendor);
        if (data.items !== undefined) setItems(data.items);
        if (data.subtotal !== undefined) setSubtotal(data.subtotal);
        if (data.discount !== undefined) setDiscount(data.discount);
        if (data.taxAmount !== undefined) setTaxAmount(data.taxAmount);
        if (data.taxPercent !== undefined) setTaxPercent(data.taxPercent);
        if (data.amount !== undefined) setAmount(data.amount);
        if (data.metadata !== undefined) setMetadata(data.metadata);
    }, []);

    // Handle generic receipt scan
    const handleGenericScan = useCallback((data: any) => {
        if (data.vendor) setVendor(data.vendor);
        if (data.total) setAmount(data.total);
        if (data.subtotal) setSubtotal(data.subtotal);
        if (data.discount) setDiscount(data.discount);
        if (data.taxAmount) setTaxAmount(data.taxAmount);
        if (data.taxPercent) setTaxPercent(data.taxPercent);

        if (data.items && Array.isArray(data.items)) {
            const scannedItems: Partial<ExpenseItem>[] = data.items.map((item: any) => ({
                id: generateItemId(),
                name: item.name || '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || item.price || 0,
                subtotal: item.subtotal || (item.quantity || 1) * (item.unitPrice || item.price || 0),
                isAIExtracted: true,
            }));
            setItems(scannedItems);
        }
    }, []);

    // Submit expense
    const handleSubmit = async () => {
        if (!selectedCategory) return;

        setIsSubmitting(true);

        try {
            const expenseInput: CreateEnhancedExpenseInput = {
                categoryId: selectedCategory.id,
                category: selectedCategory.name,
                vendor: vendor || 'Unknown',
                description: description || vendor || selectedCategory.name,
                date: new Date(date),
                paymentMethod,
                items: items.filter(i => i.name) as Omit<ExpenseItem, 'id'>[],
                subtotal,
                discount: discount || undefined,
                taxAmount: taxAmount || undefined,
                taxPercent: taxPercent || undefined,
                amount: amount || subtotal,
                metadata,
                notes: notes || undefined,
            };

            const expenseId = await addExpense(expenseInput);

            onSuccess?.(expenseId);
            handleClose();
        } catch (error) {
            console.error('Failed to add expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Common fields element for the right column of the new 2-column layout
    const commonFields = (
        <React.Fragment>
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment
                    </label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                            <option key={method} value={method}>
                                {paymentMethodLabels[method]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                </label>
                <textarea
                    placeholder="Add any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
            </div>
        </React.Fragment>
    );

    // Render category-specific form
    const renderCategoryForm = () => {
        if (!selectedCategory) return null;

        switch (selectedCategory.formType) {
            case 'fuel':
                return <FuelForm onDataChange={handleFormDataChange}>{commonFields}</FuelForm>;
            case 'grocery':
                return <GroceryForm onDataChange={handleFormDataChange}>{commonFields}</GroceryForm>;
            case 'food':
                return <FoodForm onDataChange={handleFormDataChange}>{commonFields}</FoodForm>;
            default:
                // Generic form with receipt scanner
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <ReceiptScanner
                                category={selectedCategory.formType || 'generic'}
                                onScanComplete={handleGenericScan}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Vendor / Store
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter vendor name"
                                    value={vendor}
                                    onChange={(e) => setVendor(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <LineItemsManager
                                items={items}
                                onItemsChange={setItems}
                                showWeight={false}
                            />
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={amount || ''}
                                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                            className="w-28 px-2 py-1 text-right text-xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {commonFields}
                        </div>
                    </div>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl sm:rounded-2xl sm:mx-4 rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        {step !== 'category' && (
                            <button
                                onClick={() => setStep(step === 'review' ? 'details' : 'category')}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {step === 'category' && 'Add Expense'}
                            {step === 'details' && `${selectedCategory?.icon} ${selectedCategory?.name}`}
                            {step === 'review' && 'Review & Save'}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress indicator */}
                <div className="px-4 py-2 flex gap-2">
                    {['category', 'details', 'review'].map((s, i) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 rounded-full transition-colors ${['category', 'details', 'review'].indexOf(step) >= i
                                ? 'bg-blue-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Step 1: Category Selection */}
                    {step === 'category' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Select an expense category
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 lg:gap-4">
                                {defaultCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setSelectedCategory(cat);
                                            setStep('details');
                                        }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:scale-105"
                                    >
                                        <span className="text-2xl">{cat.icon}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Category-specific form */}
                    {step === 'details' && selectedCategory && (
                        <div className="space-y-6">
                            {renderCategoryForm()}
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 'review' && selectedCategory && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{selectedCategory.icon}</span>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{vendor || selectedCategory.name}</p>
                                        <p className="text-sm text-gray-500">{format(new Date(date), 'PPP')}</p>
                                    </div>
                                </div>

                                {items.filter(i => i.name).length > 0 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-1">
                                        {items.filter(i => i.name).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {item.quantity}× {item.name}
                                                </span>
                                                <span className="font-medium">₹{item.subtotal?.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            ₹{(amount || subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>Payment:</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {paymentMethodLabels[paymentMethod]}
                                </span>
                            </div>

                            {notes && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <span>Notes: </span>
                                    <span className="text-gray-700 dark:text-gray-300">{notes}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {step === 'details' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('category')}
                                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep('review')}
                                disabled={!(amount > 0 || subtotal > 0)}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('details')}
                                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Save Expense
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddExpenseModal;
