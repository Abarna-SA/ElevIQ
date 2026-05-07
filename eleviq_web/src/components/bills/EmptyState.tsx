'use client';

import { motion } from 'framer-motion';
import { Plus, Calendar, Receipt, Home, Tv, Smartphone, CreditCard, Zap, Wifi } from 'lucide-react';

interface EmptyStateProps {
    onAddBill: () => void;
    onTemplateSelect: (templateId: string) => void;
}

const quickTemplates = [
    { id: 'rent', name: 'Rent', icon: Home, color: '#6366F1' },
    { id: 'netflix', name: 'Netflix', icon: Tv, color: '#EC4899' },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: '#8B5CF6' },
    { id: 'home-loan', name: 'EMI', icon: CreditCard, color: '#EF4444' },
    { id: 'electricity', name: 'Electric', icon: Zap, color: '#F59E0B' },
    { id: 'internet', name: 'WiFi', icon: Wifi, color: '#06B6D4' },
];

export function EmptyState({ onAddBill, onTemplateSelect }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Illustration */}
            <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-blue-500/50" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Receipt className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Text */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No bills added yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8">
                Add your recurring bills and never miss a payment deadline again.
            </p>

            {/* Add Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddBill}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow mb-8"
            >
                <Plus className="w-5 h-5" />
                Add Your First Bill
            </motion.button>

            {/* Quick Templates */}
            <div className="w-full max-w-md">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Quick Start</p>
                <div className="grid grid-cols-6 gap-3">
                    {quickTemplates.map((template, index) => {
                        const Icon = template.icon;
                        return (
                            <motion.button
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onTemplateSelect(template.id)}
                                className="p-3 bg-white dark:bg-[#171717] rounded-xl border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-colors group"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-1.5 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: `${template.color}20` }}
                                >
                                    <Icon className="w-5 h-5" style={{ color: template.color }} />
                                </div>
                                <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center">
                                    {template.name}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
