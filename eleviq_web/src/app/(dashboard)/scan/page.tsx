'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera,
    Upload,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    RotateCcw,
    Sparkles,
    ScanLine,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { defaultCategories, getCategoryById } from '@/types/expense';

interface ExtractedData {
    merchant: string;
    date: string;
    totalAmount: number;
    items: { name: string; price: number }[];
    category: string;
    paymentMethod: string;
    confidence: number;
}

export default function ScanPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
            setError(null);
            setExtractedData(null);
        };
        reader.readAsDataURL(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleScan = async () => {
        if (!selectedFile) return;

        setIsScanning(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to scan receipt');
            }

            setExtractedData(result.data);
        } catch (err: any) {
            setError(err.message || 'Failed to scan receipt');
        } finally {
            setIsScanning(false);
        }
    };

    const handleReset = () => {
        setImagePreview(null);
        setSelectedFile(null);
        setExtractedData(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddExpense = () => {
        if (!extractedData) return;

        // Navigate to add expense with pre-filled data
        const params = new URLSearchParams({
            amount: extractedData.totalAmount.toString(),
            description: extractedData.merchant,
            category: extractedData.category,
            date: extractedData.date,
            payment: extractedData.paymentMethod,
        });

        router.push(`/expenses/add?${params.toString()}`);
    };

    const category = extractedData ? getCategoryById(extractedData.category) : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <PageHeader
                icon={ScanLine}
                iconColor="text-cyan-400"
                title="Scan Receipt"
            />
            <div className="p-4 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Upload Area */}
                    {!imagePreview ? (
                        <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-8">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                    }`}
                            >
                                <div className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${isDragging ? 'scale-110' : ''}`}>
                                    <Camera className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {isDragging ? 'Drop your receipt here!' : 'Upload Receipt'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    {isDragging ? 'Release to upload' : 'Drag & drop or click to select an image'}
                                </p>
                                {!isDragging && (
                                    <div className="flex items-center justify-center gap-4">
                                        <span className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
                                            <Upload className="w-4 h-4" />
                                            Choose File
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                                    Supports JPG, PNG, HEIC up to 10MB
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Image Preview */}
                            <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Receipt preview"
                                        className="w-full max-h-96 object-contain bg-gray-50 dark:bg-[#0a0a0a]"
                                    />
                                    <button
                                        onClick={handleReset}
                                        className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-black/50 backdrop-blur rounded-full shadow-lg hover:bg-white dark:hover:bg-black/70"
                                    >
                                        <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                    </button>
                                </div>

                                {/* Scan Button */}
                                {!extractedData && !isScanning && (
                                    <div className="p-4 border-t border-gray-100 dark:border-white/5">
                                        <button
                                            onClick={handleScan}
                                            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            Scan with AI
                                        </button>
                                    </div>
                                )}

                                {/* Loading State */}
                                {isScanning && (
                                    <div className="p-8 text-center border-t border-gray-100 dark:border-white/5">
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                                            Analyzing receipt with AI...
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                            Extracting merchant, amount & category
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Error State */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-700 dark:text-red-400">{error}</p>
                                    <button
                                        onClick={handleScan}
                                        className="ml-auto px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {/* Extracted Data */}
                            {extractedData && (
                                <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6" />
                                        <div>
                                            <p className="font-semibold">Successfully Extracted!</p>
                                            <p className="text-sm opacity-90">
                                                Confidence: {extractedData.confidence}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {/* Merchant */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Merchant</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {extractedData.merchant}
                                            </span>
                                        </div>

                                        {/* Amount */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Amount</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                ₹{extractedData.totalAmount.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Date</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {new Date(extractedData.date).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>

                                        {/* Category */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Category</span>
                                            <span
                                                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                                                style={{
                                                    backgroundColor: `${category?.color}20`,
                                                    color: category?.color
                                                }}
                                            >
                                                <span>{category?.icon}</span>
                                                <span>{category?.name}</span>
                                            </span>
                                        </div>

                                        {/* Items */}
                                        {extractedData.items.length > 0 && (
                                            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    Items Detected
                                                </p>
                                                <div className="space-y-2">
                                                    {extractedData.items.slice(0, 5).map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                                                                {item.name}
                                                            </span>
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                ₹{item.price}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {extractedData.items.length > 5 && (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                                            +{extractedData.items.length - 5} more items
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
                                        <button
                                            onClick={handleReset}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Scan Another
                                        </button>
                                        <button
                                            onClick={handleAddExpense}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Add Expense
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tips */}
                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                            📸 Tips for better scanning
                        </h3>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                            <li>• Ensure good lighting and clear focus</li>
                            <li>• Capture the entire receipt including date and total</li>
                            <li>• Flatten the receipt before taking a photo</li>
                            <li>• Avoid shadows and glare</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
