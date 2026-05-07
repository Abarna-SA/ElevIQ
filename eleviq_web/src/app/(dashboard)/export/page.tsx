'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, FileDown } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useExpenseStore } from '@/store/expense-store';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all';
type ExportFormat = 'pdf' | 'csv';

const dateRanges: { id: DateRange; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
];

export default function ExportPage() {
    const { expenses } = useExpenseStore();
    const [selectedRange, setSelectedRange] = useState<DateRange>('this_month');
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    const getFilteredExpenses = () => {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date = now;

        switch (selectedRange) {
            case 'this_month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'last_month':
                startDate = startOfMonth(subMonths(now, 1));
                endDate = endOfMonth(subMonths(now, 1));
                break;
            case 'last_3_months':
                startDate = startOfMonth(subMonths(now, 3));
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all':
                startDate = null;
                break;
        }

        return expenses.filter(e => {
            if (!startDate) return true;
            return e.date >= startDate && e.date <= endDate;
        });
    };

    const filteredExpenses = getFilteredExpenses();
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const handleExport = async () => {
        if (filteredExpenses.length === 0) return;

        setIsExporting(true);
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenses: filteredExpenses.map(e => ({
                        date: e.date.toISOString(),
                        description: e.description,
                        category: e.category,
                        amount: e.amount,
                        paymentMethod: e.paymentMethod,
                    })),
                    dateRange: selectedRange,
                    format: selectedFormat,
                }),
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expenses_${selectedRange}.${selectedFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader icon={FileDown} iconColor="text-cyan-400" title="Export Data" />
            <div className="p-4 lg:p-8">

                <div className="max-w-2xl">
                    {/* Date Range Selection */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Date Range</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                            {dateRanges.map(range => (
                                <button
                                    key={range.id}
                                    onClick={() => setSelectedRange(range.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedRange === range.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Format</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedFormat('pdf')}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedFormat === 'pdf'
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <FileText className={`w-8 h-8 mb-2 mx-auto ${selectedFormat === 'pdf' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <p className="font-medium text-gray-900 dark:text-white">PDF Report</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">With charts & summary</p>
                            </button>
                            <button
                                onClick={() => setSelectedFormat('csv')}
                                className={`p-4 rounded-xl border-2 transition-all ${selectedFormat === 'csv'
                                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <FileSpreadsheet className={`w-8 h-8 mb-2 mx-auto ${selectedFormat === 'csv' ? 'text-green-600' : 'text-gray-400'}`} />
                                <p className="font-medium text-gray-900 dark:text-white">CSV Data</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">For Excel/Sheets</p>
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Preview</h2>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredExpenses.length}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                        {filteredExpenses.length === 0 && (
                            <p className="text-center text-gray-400 dark:text-gray-500 py-4">No expenses in selected date range</p>
                        )}
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={isExporting || filteredExpenses.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium text-lg transition-colors shadow-lg shadow-blue-600/25"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Download {selectedFormat.toUpperCase()}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
