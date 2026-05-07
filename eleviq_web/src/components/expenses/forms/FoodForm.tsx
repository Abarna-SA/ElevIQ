'use client';

import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { ReceiptScanner } from '../ReceiptScanner';
import { LineItemsManager } from '../LineItemsManager';
import { ExpenseItem, FoodMetadata, generateItemId } from '@/types/expense';

interface FoodFormProps {
    onDataChange: (data: {
        vendor: string;
        items: Partial<ExpenseItem>[];
        metadata: { type: 'food'; data: FoodMetadata };
        subtotal: number;
        amount: number;
    }) => void;
    initialData?: Partial<FoodMetadata & { vendor: string; items: Partial<ExpenseItem>[] }>;
    children?: React.ReactNode;
}

export function FoodForm({ onDataChange, initialData, children }: FoodFormProps) {
    const [vendor, setVendor] = useState(initialData?.vendor || '');
    const [items, setItems] = useState<Partial<ExpenseItem>[]>(
        initialData?.items?.length
            ? initialData.items
            : [{ id: generateItemId(), name: '', quantity: 1, unitPrice: 0, subtotal: 0 }]
    );
    const [gstPercent, setGstPercent] = useState<number>(initialData?.gstPercent || 5);
    const [serviceCharge, setServiceCharge] = useState<number>(initialData?.serviceCharge || 0);
    const [tipPercent, setTipPercent] = useState<number>(initialData?.tipPercent || 0);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const gstAmount = (subtotal * gstPercent) / 100;
    const tipAmount = (subtotal * tipPercent) / 100;
    const total = subtotal + gstAmount + serviceCharge + tipAmount;

    useEffect(() => {
        onDataChange({
            vendor,
            items,
            metadata: {
                type: 'food',
                data: {
                    restaurantName: vendor,
                    gstAmount,
                    gstPercent,
                    serviceCharge,
                    tipAmount,
                    tipPercent,
                },
            },
            subtotal,
            amount: total,
        });
    }, [vendor, items, subtotal, gstAmount, gstPercent, serviceCharge, tipAmount, tipPercent, total, onDataChange]);

    const handleScanComplete = (data: any) => {
        if (data.vendor) setVendor(data.vendor);
        if (data.gstPercent) setGstPercent(data.gstPercent);
        if (data.serviceCharge) setServiceCharge(data.serviceCharge);
        if (data.tipPercent) setTipPercent(data.tipPercent);

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
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                {/* Receipt Scanner */}
                <ReceiptScanner
                    category="food"
                    onScanComplete={handleScanComplete}
                />

                {/* Restaurant Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Restaurant / Cafe
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Starbucks, McDonald's, Local Restaurant"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Items */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Food Items ({items.length})
                    </label>
                    <LineItemsManager
                        items={items}
                        onItemsChange={setItems}
                        showWeight={false}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {/* Totals Section */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">GST:</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.5"
                                value={gstPercent || ''}
                                onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
                                className="w-14 px-2 py-1 text-right text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                            <span className="text-gray-400">%</span>
                            <span className="text-gray-500">=</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Service Charge:</span>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">₹</span>
                            <input
                                type="number"
                                step="1"
                                placeholder="0"
                                value={serviceCharge || ''}
                                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-right text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tip:</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="1"
                                placeholder="0"
                                value={tipPercent || ''}
                                onChange={(e) => setTipPercent(parseFloat(e.target.value) || 0)}
                                className="w-14 px-2 py-1 text-right text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                            <span className="text-gray-400">%</span>
                            <span className="text-gray-500">=</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                ₹{tipAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-orange-200 dark:border-orange-700 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-orange-600" />
                                <span className="font-semibold text-orange-800 dark:text-orange-200">Total Bill</span>
                            </div>
                            <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

export default FoodForm;
