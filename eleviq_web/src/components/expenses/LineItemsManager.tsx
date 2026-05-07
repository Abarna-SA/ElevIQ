'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Bot } from 'lucide-react';
import { ExpenseItem, generateItemId, calculateItemSubtotal, ItemUnit } from '@/types/expense';

interface LineItemRowProps {
    item: Partial<ExpenseItem>;
    index: number;
    showWeight?: boolean;
    onUpdate: (index: number, updates: Partial<ExpenseItem>) => void;
    onDelete: (index: number) => void;
}

export function LineItemRow({ item, index, showWeight = true, onUpdate, onDelete }: LineItemRowProps) {
    const handleChange = (field: keyof ExpenseItem, value: any) => {
        const updates: Partial<ExpenseItem> = { [field]: value };

        // Auto-calculate subtotal when quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? value : item.quantity || 1;
            const price = field === 'unitPrice' ? value : item.unitPrice || 0;
            updates.subtotal = qty * price;
        }

        onUpdate(index, updates);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 relative">
            {item.isAIExtracted && (
                <div className="absolute top-2 right-12 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Bot className="w-3 h-3" />
                    <span>AI filled</span>
                </div>
            )}

            <button
                type="button"
                onClick={() => onDelete(index)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
            </div>

            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Item name"
                    value={item.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                        <input
                            type="number"
                            placeholder="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {showWeight && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="—"
                                value={item.weight || ''}
                                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || undefined)}
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Subtotal: ₹{(item.subtotal || 0).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface LineItemsManagerProps {
    items: Partial<ExpenseItem>[];
    onItemsChange: (items: Partial<ExpenseItem>[]) => void;
    showWeight?: boolean;
}

export function LineItemsManager({ items, onItemsChange, showWeight = true }: LineItemsManagerProps) {
    const handleAddItem = () => {
        const newItem: Partial<ExpenseItem> = {
            id: generateItemId(),
            name: '',
            quantity: 1,
            unitPrice: 0,
            subtotal: 0,
        };
        onItemsChange([...items, newItem]);
    };

    const handleUpdateItem = (index: number, updates: Partial<ExpenseItem>) => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], ...updates };
        onItemsChange(updatedItems);
    };

    const handleDeleteItem = (index: number) => {
        if (items.length > 1) {
            const updatedItems = items.filter((_, i) => i !== index);
            onItemsChange(updatedItems);
        }
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <LineItemRow
                    key={item.id || index}
                    item={item}
                    index={index}
                    showWeight={showWeight}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                />
            ))}

            <button
                type="button"
                onClick={handleAddItem}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
            >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Another Item</span>
            </button>
        </div>
    );
}

export default LineItemsManager;
