'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Calendar,
    Bell,
    CheckCircle,
    AlertCircle,
    Clock,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Check,
    CalendarClock,
    Zap,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore, parseISO, differenceInDays } from 'date-fns';
import { useBills } from '@/hooks/useBills';
import { Bill, billCategories, billTemplates, BillTemplate } from '@/types/bills';
import { AddBillModal, MarkAsPaidModal, BillDetailModal, EmptyState } from '@/components/bills';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

const getIcon = (iconName: string): LucideIcon => {
    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[iconName];
    return IconComponent || Icons.Receipt;
};

export default function BillsPage() {
    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(today);

    // Bill management hook
    const {
        bills,
        isLoaded,
        addBill,
        updateBill,
        deleteBill,
        markAsPaid,
        togglePaid,
        getBillsForDay,
        getBillPaymentHistory,
        getDueStatus,
        upcomingBills,
        overdueBills,
        paidBillsThisMonth,
        totalDue,
        totalPaidThisMonth,
    } = useBills();

    // Modal states
    const [showAddBill, setShowAddBill] = useState(false);
    const [showMarkAsPaid, setShowMarkAsPaid] = useState(false);
    const [showBillDetail, setShowBillDetail] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    // Calendar calculations
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    // Month navigation
    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentMonth(today);
    };

    // Handle template selection from empty state
    const handleTemplateSelect = useCallback((templateId: string) => {
        const template = billTemplates.find(t => t.id === templateId);
        if (template) {
            // Pre-fill and open modal
            setShowAddBill(true);
        }
    }, []);

    // Handle bill actions
    const handleBillClick = (bill: Bill) => {
        setSelectedBill(bill);
        setShowBillDetail(true);
    };

    const handleMarkAsPaidClick = () => {
        setShowBillDetail(false);
        setShowMarkAsPaid(true);
    };

    const handleDeleteBill = () => {
        if (selectedBill) {
            deleteBill(selectedBill.id);
            setShowBillDetail(false);
            setSelectedBill(null);
        }
    };

    const handleConfirmPayment = (billId: string, paidAmount: number, paidDate: string) => {
        markAsPaid(billId, paidAmount, paidDate);
        setSelectedBill(null);
    };

    // Status badge helper
    const getStatusBadge = (bill: Bill) => {
        const status = getDueStatus(bill);
        switch (status) {
            case 'paid':
                return { text: 'Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
            case 'overdue':
                return { text: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
            case 'today':
                return { text: 'Due Today', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
            case 'soon':
                return { text: 'Due Soon', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
            default:
                return { text: 'Upcoming', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
        }
    };

    // Show loading state
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={CalendarClock}
                iconColor="text-orange-400"
                title="Bill Calendar"
                actions={
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddBill(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Bill
                    </motion.button>
                }
            />
            <div className="p-4 lg:p-8">

                {/* Show empty state if no bills */}
                {bills.length === 0 ? (
                    <EmptyState onAddBill={() => setShowAddBill(true)} onTemplateSelect={handleTemplateSelect} />
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5"
                            >
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">Total Due</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalDue.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mt-1">{upcomingBills.length} bills pending</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5"
                            >
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">Upcoming</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{upcomingBills.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Next 30 days</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5"
                            >
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">Overdue</span>
                                </div>
                                <p className={`text-2xl font-bold ${overdueBills.length > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                    {overdueBills.length}
                                </p>
                                {overdueBills.length > 0 && (
                                    <p className="text-xs text-red-500 mt-1">Needs attention!</p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white dark:bg-[#171717] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5"
                            >
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm">Paid This Month</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">₹{totalPaidThisMonth.toLocaleString()}</p>
                                <p className="text-xs text-gray-400 mt-1">{paidBillsThisMonth.length} bills</p>
                            </motion.div>
                        </div>
                        {/* Calendar and Upcoming Bills - responsive layout */}
                        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                            {/* Calendar */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="lg:col-span-2 bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6"
                            >
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={goToToday}
                                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={goToPreviousMonth}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-600 dark:text-gray-400"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={goToNextMonth}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-600 dark:text-gray-400"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Empty cells for days before month start */}
                                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square" />
                                    ))}

                                    {/* Days of the month */}
                                    {daysInMonth.map(day => {
                                        const dayBills = getBillsForDay(day);
                                        const isCurrentDay = isToday(day);
                                        const hasOverdue = dayBills.some(b => !b.isPaid && isBefore(parseISO(b.dueDate), today));
                                        const hasDueSoon = dayBills.some(b => !b.isPaid);

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={`aspect-square p-1.5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${isCurrentDay
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : dayBills.length > 0
                                                        ? 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                                                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`text-sm mb-1 ${isCurrentDay
                                                    ? 'font-bold text-blue-600'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {format(day, 'd')}
                                                </div>

                                                {/* Bill indicators */}
                                                <div className="space-y-1">
                                                    {dayBills.slice(0, 2).map(bill => {
                                                        const cat = billCategories.find(c => c.id === bill.category);
                                                        const status = getDueStatus(bill);
                                                        return (
                                                            <div
                                                                key={bill.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBillClick(bill);
                                                                }}
                                                                className={`flex items-center justify-between gap-1 text-[10px] px-1.5 py-1 rounded cursor-pointer transition-opacity hover:opacity-80 ${status === 'paid'
                                                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                                    : ''
                                                                    }`}
                                                                style={status !== 'paid' ? {
                                                                    backgroundColor: `${cat?.color}20`,
                                                                    color: cat?.color
                                                                } : undefined}
                                                                title={`${bill.name} - ₹${bill.amount.toLocaleString()}`}
                                                            >
                                                                {/* Name column - truncates on small screens */}
                                                                <span className={`font-medium truncate min-w-0 flex-1 ${status === 'paid' ? 'line-through' : ''}`}>
                                                                    {bill.name}
                                                                </span>
                                                                {/* Amount column - responsive format */}
                                                                <span className={`flex-shrink-0 font-semibold tabular-nums ${status === 'paid' ? 'line-through' : ''}`}>
                                                                    {/* Large screens: full amount */}
                                                                    <span className="hidden xl:inline">₹{bill.amount.toLocaleString()}</span>
                                                                    {/* Small screens: abbreviated */}
                                                                    <span className="xl:hidden">₹{bill.amount >= 1000 ? `${(bill.amount / 1000).toFixed(1)}k` : bill.amount}</span>
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayBills.length > 2 && (
                                                        <div className="text-[9px] text-gray-500 text-center">
                                                            +{dayBills.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* Upcoming Bills List */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-100 dark:border-white/5">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Bills</h2>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[500px] overflow-y-auto">
                                    <AnimatePresence>
                                        {upcomingBills.map((bill, index) => {
                                            const cat = billCategories.find(c => c.id === bill.category);
                                            const Icon = getIcon(cat?.icon || 'Receipt');
                                            const status = getStatusBadge(bill);
                                            const daysUntil = differenceInDays(parseISO(bill.dueDate), today);

                                            return (
                                                <motion.div
                                                    key={bill.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ delay: index * 0.02 }}
                                                    onClick={() => handleBillClick(bill)}
                                                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    {/* Toggle paid button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePaid(bill.id);
                                                        }}
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${bill.isPaid
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                            }`}
                                                    >
                                                        {bill.isPaid && <Check className="w-3.5 h-3.5" />}
                                                    </button>

                                                    {/* Category Icon */}
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                        style={{ backgroundColor: `${cat?.color}20` }}
                                                    >
                                                        <Icon className="w-5 h-5" style={{ color: cat?.color }} />
                                                    </div>

                                                    {/* Bill Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`font-medium truncate ${bill.isPaid
                                                                ? 'text-gray-400 line-through'
                                                                : 'text-gray-900 dark:text-white'
                                                                }`}>
                                                                {bill.name}
                                                            </p>
                                                            {bill.autopay && (
                                                                <span title="Auto-pay"><Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" /></span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span>{format(parseISO(bill.dueDate), 'MMM d')}</span>
                                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${status.color}`}>
                                                                {daysUntil === 0 ? 'Today' : daysUntil < 0 ? 'Overdue' : `${daysUntil}d`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Amount */}
                                                    <p className={`font-semibold shrink-0 ${bill.isPaid ? 'text-gray-400' : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                        ₹{bill.amount.toLocaleString()}
                                                    </p>

                                                    {/* Delete button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteBill(bill.id);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {upcomingBills.length === 0 && (
                                        <div className="p-8 text-center">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-gray-500 dark:text-gray-400">All caught up!</p>
                                            <p className="text-sm text-gray-400">No bills due in the next 30 days</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* Modals */}
                <AnimatePresence>
                    {showAddBill && (
                        <AddBillModal
                            key="add-bill-modal"
                            isOpen={showAddBill}
                            onClose={() => setShowAddBill(false)}
                            onAdd={addBill}
                        />
                    )}

                    {showMarkAsPaid && (
                        <MarkAsPaidModal
                            key="mark-paid-modal"
                            isOpen={showMarkAsPaid}
                            bill={selectedBill}
                            onClose={() => {
                                setShowMarkAsPaid(false);
                                setSelectedBill(null);
                            }}
                            onConfirm={handleConfirmPayment}
                        />
                    )}

                    {showBillDetail && (
                        <BillDetailModal
                            key="bill-detail-modal"
                            isOpen={showBillDetail}
                            bill={selectedBill}
                            paymentHistory={selectedBill ? getBillPaymentHistory(selectedBill.id) : []}
                            onClose={() => {
                                setShowBillDetail(false);
                                setSelectedBill(null);
                            }}
                            onMarkAsPaid={handleMarkAsPaidClick}
                            onEdit={() => {
                                // TODO: Implement edit functionality
                                console.log('Edit bill:', selectedBill?.id);
                            }}
                            onDelete={handleDeleteBill}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
