'use client';

import React, { useState, useEffect } from 'react';
import { Fuel } from 'lucide-react';
import { ReceiptScanner } from '../ReceiptScanner';
import { VehicleSelector } from '../VehicleSelector';
import { useVehicleStore } from '@/store/vehicle-store';
import { FuelType, FuelMetadata, fuelTypeLabels, fuelTypeColors, Vehicle } from '@/types/expense';

interface FuelFormProps {
    onDataChange: (data: {
        vendor: string;
        metadata: { type: 'fuel'; data: FuelMetadata };
        amount: number;
    }) => void;
    initialData?: Partial<FuelMetadata & { vendor: string }>;
    children?: React.ReactNode;
}

export function FuelForm({ onDataChange, initialData, children }: FuelFormProps) {
    const { updateOdometer, getVehicleById } = useVehicleStore();

    const [vendor, setVendor] = useState(initialData?.vendor || '');
    const [fuelType, setFuelType] = useState<FuelType>(initialData?.fuelType || 'petrol');
    const [liters, setLiters] = useState<number>(initialData?.liters || 0);
    const [ratePerLiter, setRatePerLiter] = useState<number>(initialData?.ratePerLiter || 0);
    const [odometerReading, setOdometerReading] = useState<number | undefined>(initialData?.odometerReading);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(initialData?.vehicleId);
    const [isFullTank, setIsFullTank] = useState<boolean>(initialData?.isFullTank ?? true);

    const total = liters * ratePerLiter;
    const selectedVehicle = selectedVehicleId ? getVehicleById(selectedVehicleId) : undefined;

    // Calculate mileage if we have previous odometer reading
    const [calculatedMileage, setCalculatedMileage] = useState<number | undefined>();
    const [distanceSinceLastFill, setDistanceSinceLastFill] = useState<number | undefined>();

    useEffect(() => {
        if (selectedVehicle?.lastOdometer && odometerReading && odometerReading > selectedVehicle.lastOdometer) {
            const distance = odometerReading - selectedVehicle.lastOdometer;
            setDistanceSinceLastFill(distance);
            if (liters > 0 && isFullTank) {
                setCalculatedMileage(distance / liters);
            }
        } else {
            setDistanceSinceLastFill(undefined);
            setCalculatedMileage(undefined);
        }
    }, [selectedVehicle, odometerReading, liters, isFullTank]);

    useEffect(() => {
        onDataChange({
            vendor,
            metadata: {
                type: 'fuel',
                data: {
                    fuelType,
                    liters,
                    ratePerLiter,
                    odometerReading,
                    vehicleId: selectedVehicleId,
                    isFullTank,
                    stationName: vendor,
                    distanceSinceLastFill,
                    calculatedMileage,
                },
            },
            amount: total,
        });
    }, [vendor, fuelType, liters, ratePerLiter, odometerReading, selectedVehicleId, isFullTank, total, distanceSinceLastFill, calculatedMileage, onDataChange]);

    const handleScanComplete = (data: any) => {
        if (data.vendor) setVendor(data.vendor);
        if (data.fuelType) setFuelType(data.fuelType as FuelType);
        if (data.liters) setLiters(data.liters);
        if (data.ratePerLiter) setRatePerLiter(data.ratePerLiter);
        if (data.odometerReading) setOdometerReading(data.odometerReading);
    };

    const handleVehicleSelect = (vehicle: Vehicle | null) => {
        setSelectedVehicleId(vehicle?.id);
        if (vehicle) {
            setFuelType(vehicle.fuelType);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                {/* Receipt Scanner */}
                <ReceiptScanner
                    category="fuel"
                    onScanComplete={handleScanComplete}
                />

                {/* Fuel Station */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fuel Station
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Shell - Sector 45, Noida"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Fuel Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fuel Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['petrol', 'diesel', 'cng'] as FuelType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFuelType(type)}
                                className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${fuelType === type
                                    ? `border-transparent text-white`
                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                    }`}
                                style={fuelType === type ? { backgroundColor: fuelTypeColors[type] } : {}}
                            >
                                {fuelTypeLabels[type]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Liters and Rate */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {fuelType === 'cng' ? 'Quantity (kg)' : 'Liters'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={liters || ''}
                            onChange={(e) => setLiters(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-3 text-lg font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rate/{fuelType === 'cng' ? 'kg' : 'L'} (₹)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={ratePerLiter || ''}
                            onChange={(e) => setRatePerLiter(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-3 text-lg font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Total Calculation */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Fuel className="w-5 h-5 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Total Amount</span>
                        </div>
                        <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Vehicle Selection */}
                <VehicleSelector
                    selectedVehicleId={selectedVehicleId}
                    onSelect={handleVehicleSelect}
                    fuelTypeFilter={fuelType}
                />

                {/* Odometer Reading */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Odometer Reading (Optional)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="Current km reading"
                            value={odometerReading || ''}
                            onChange={(e) => setOdometerReading(parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">km</span>
                    </div>

                    {distanceSinceLastFill && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            💡 Distance since last fill: {distanceSinceLastFill.toLocaleString('en-IN')} km
                            {calculatedMileage && ` • Mileage: ${calculatedMileage.toFixed(1)} km/L`}
                        </p>
                    )}
                </div>

                {/* Full Tank Toggle */}
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Tank?</span>
                    <button
                        type="button"
                        onClick={() => setIsFullTank(!isFullTank)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${isFullTank ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                    >
                        <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isFullTank ? 'translate-x-6' : ''
                                }`}
                        />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

export default FuelForm;
