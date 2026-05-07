'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ReceiptScanner } from '../ReceiptScanner';
import { LineItemsManager } from '../LineItemsManager';
import { ExpenseItem, generateItemId } from '@/types/expense';

interface GroceryFormProps {
    onDataChange: (data: {
        vendor: string;
        items: Partial<ExpenseItem>[];
        subtotal: number;
        discount: number;
        taxAmount: number;
        taxPercent: number;
        amount: number;
    }) => void;
    initialData?: {
        vendor?: string;
        items?: Partial<ExpenseItem>[];
        discount?: number;
        taxPercent?: number;
    };
    children?: React.ReactNode;
}

export function GroceryForm({ onDataChange, initialData, children }: GroceryFormProps) {
    const [vendor, setVendor] = useState(initialData?.vendor || '');
    const [items, setItems] = useState<Partial<ExpenseItem>[]>(
        initialData?.items?.length
            ? initialData.items
            : [{ id: generateItemId(), name: '', quantity: 1, unitPrice: 0, subtotal: 0 }]
    );
    const [discount, setDiscount] = useState<number>(initialData?.discount || 0);
    const [taxPercent, setTaxPercent] = useState<number>(initialData?.taxPercent || 0);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxAmount = (afterDiscount * taxPercent) / 100;
    const total = afterDiscount + taxAmount;

    useEffect(() => {
        onDataChange({
            vendor,
            items,
            subtotal,
            discount,
            taxAmount,
            taxPercent,
            amount: total,
        });
    }, [vendor, items, subtotal, discount, taxAmount, taxPercent, total, onDataChange]);

    const handleScanComplete = (data: any) => {
        if (data.vendor) setVendor(data.vendor);
        if (data.discount) setDiscount(data.discount);
        if (data.taxPercent) setTaxPercent(data.taxPercent);

        if (data.items && Array.isArray(data.items)) {
            const scannedItems: Partial<ExpenseItem>[] = data.items.map((item: any) => ({
                id: generateItemId(),
                name: item.name || '',
                quantity: item.quantity || 1,
                weight: item.weight || undefined,
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
                    category="grocery"
                    onScanComplete={handleScanComplete}
                />

                {/* Store Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Store / Vendor
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., BigBazaar, D-Mart, Local Grocery"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Items */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Items ({items.length})
                    </label>
                    <LineItemsManager
                        items={items}
                        onItemsChange={setItems}
                        showWeight={true}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {/* Totals Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Items Count:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{items.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">-₹</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={discount || ''}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-right text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-green-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">GST:</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.5"
                                placeholder="0"
                                value={taxPercent || ''}
                                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                                className="w-14 px-2 py-1 text-right text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-1 focus:ring-green-500 outline-none"
                            />
                            <span className="text-gray-400">%</span>
                            <span className="text-gray-500">=</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-green-200 dark:border-green-700 pt-3 mt-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-green-800 dark:text-green-200">Grand Total</span>
                            </div>
                            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
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

export default GroceryForm;
