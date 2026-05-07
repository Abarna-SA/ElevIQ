'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ReceiptScannerProps {
    category: string;
    onScanComplete: (data: any) => void;
    onError?: (error: string) => void;
}

export function ReceiptScanner({ category, onScanComplete, onError }: ReceiptScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
    const [confidence, setConfidence] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleScan = async (file: File) => {
        setIsScanning(true);
        setScanResult(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('category', category);

            const response = await fetch('/api/scan-receipt', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setScanResult('success');
                setConfidence(result.confidence);
                onScanComplete(result.data);
            } else {
                setScanResult('error');
                onError?.(result.error || 'Failed to scan receipt');
            }
        } catch (error) {
            setScanResult('error');
            onError?.('Failed to process receipt');
        } finally {
            setIsScanning(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleScan(file);
        }
    };

    const getCategoryMessage = () => {
        const messages: Record<string, string> = {
            grocery: 'AI will extract items, weights & prices',
            fuel: 'AI extracts station, liters, rate & vehicle',
            food: 'AI detects items, tax, tip & service charge',
            healthcare: 'AI extracts medicines, dosages & pharmacy',
            utilities: 'AI reads units, billing period & provider',
            shopping: 'AI detects products, brands & prices',
            transport: 'AI extracts locations, distance & fare',
        };
        return messages[category] || 'AI will extract receipt details';
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                    Scan Receipt
                </span>
                {scanResult === 'success' && (
                    <div className="flex items-center gap-1 ml-auto text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>{confidence}% confident</span>
                    </div>
                )}
                {scanResult === 'error' && (
                    <div className="flex items-center gap-1 ml-auto text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Scan failed</span>
                    </div>
                )}
            </div>

            {isScanning ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Analyzing receipt with AI...
                    </span>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium">Take Photo</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium">Upload Image</span>
                    </button>
                </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                {getCategoryMessage()}
            </p>

            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}

export default ReceiptScanner;
