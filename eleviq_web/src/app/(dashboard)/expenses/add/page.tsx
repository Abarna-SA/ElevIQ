'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Save, Mic, MicOff, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useExpenseStore } from '@/store/expense-store';
import { defaultCategories, PaymentMethod } from '@/types/expense';

const paymentMethods: PaymentMethod[] = ['cash', 'card', 'upi', 'netbanking', 'other'];

function AddExpenseForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addExpense } = useExpenseStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [formData, setFormData] = useState({
        amount: '',
        categoryId: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'upi' as PaymentMethod,
        notes: '',
    });

    // Pre-fill form from URL params (from receipt scanner)
    useEffect(() => {
        const amount = searchParams.get('amount');
        const description = searchParams.get('description');
        const category = searchParams.get('category');
        const date = searchParams.get('date');
        const payment = searchParams.get('payment');

        if (amount || description || category || date) {
            setFormData(prev => ({
                ...prev,
                amount: amount || prev.amount,
                description: description || prev.description,
                categoryId: category || prev.categoryId,
                date: date || prev.date,
                paymentMethod: (payment as PaymentMethod) || prev.paymentMethod,
            }));
        }
    }, [searchParams]);

    // Voice input handler
    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setVoiceText(transcript);
            setIsParsing(true);

            try {
                const response = await fetch('/api/parse-voice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: transcript }),
                });

                const result = await response.json();
                if (result.success && result.data) {
                    const category = defaultCategories.find(
                        c => c.name.toLowerCase() === result.data.category?.toLowerCase()
                    );
                    setFormData(prev => ({
                        ...prev,
                        amount: result.data.amount?.toString() || prev.amount,
                        description: result.data.description || prev.description,
                        categoryId: category?.id || prev.categoryId,
                        date: result.data.date || prev.date,
                    }));
                }
            } catch (error) {
                console.error('Voice parse error:', error);
            } finally {
                setIsParsing(false);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.start();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.categoryId || !formData.description) return;

        setIsSubmitting(true);
        try {
            const category = defaultCategories.find((c) => c.id === formData.categoryId);
            await addExpense({
                amount: parseFloat(formData.amount),
                category: category?.name || 'Other',
                categoryId: formData.categoryId,
                description: formData.description,
                date: new Date(formData.date),
                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
            });
            router.push('/expenses');
        } catch (error) {
            console.error('Failed to add expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
            {/* Voice Input Banner */}
            {(voiceText || isListening || isParsing) && (
                <div className="max-w-2xl mx-auto mb-4">
                    <div className={`p-4 rounded-xl ${isListening ? 'bg-red-100 border border-red-200' : isParsing ? 'bg-blue-100 border border-blue-200' : 'bg-green-100 border border-green-200'}`}>
                        <div className="flex items-center gap-2">
                            {isListening && <><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-red-700 text-sm">Listening...</span></>}
                            {isParsing && <><Loader2 className="w-4 h-4 animate-spin text-blue-600" /><span className="text-blue-700 text-sm">Parsing: "{voiceText}"</span></>}
                            {!isListening && !isParsing && voiceText && <><span className="text-green-700 text-sm">✓ Parsed: "{voiceText}"</span></>}
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/expenses"
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add Expense</h1>
                        <p className="text-gray-500 text-sm mt-1">Track your spending</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={isListening || isParsing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isListening ? 'Listening...' : 'Voice Input'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Amount */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Description
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="What did you spend on?"
                            />
                        </div>

                        {/* Date & Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Date
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Payment Method
                                    </label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                                    >
                                        {paymentMethods.map((method) => (
                                            <option key={method} value={method} className="capitalize">
                                                {method === 'netbanking' ? 'Net Banking' : method.charAt(0).toUpperCase() + method.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                                placeholder="Add any additional notes..."
                            />
                        </div>
                    </div>

                    {/* Right Column - Category */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                            Category
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {defaultCategories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, categoryId: category.id })}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${formData.categoryId === category.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-2xl mb-2">{category.icon}</span>
                                    <span className={`text-xs font-medium text-center ${formData.categoryId === category.id ? 'text-blue-600' : 'text-gray-600'
                                        }`}>
                                        {category.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-gray-700 hover:bg-white rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.amount || !formData.categoryId}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/25"
                    >
                        <Save className="w-5 h-5" />
                        {isSubmitting ? 'Saving...' : 'Save Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function AddExpensePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">Loading...</div>}>
            <AddExpenseForm />
        </Suspense>
    );
}
