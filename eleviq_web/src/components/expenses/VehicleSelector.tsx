'use client';

import React, { useState } from 'react';
import { Plus, Car, Bike, Truck, X } from 'lucide-react';
import { useVehicleStore } from '@/store/vehicle-store';
import { Vehicle, CreateVehicleInput, FuelType, fuelTypeLabels } from '@/types/expense';

interface AddVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (vehicle: Vehicle) => void;
    defaultFuelType?: FuelType;
}

export function AddVehicleModal({ isOpen, onClose, onAdd, defaultFuelType = 'petrol' }: AddVehicleModalProps) {
    const { addVehicle, vehicles } = useVehicleStore();
    const [formData, setFormData] = useState<CreateVehicleInput>({
        name: '',
        registrationNumber: '',
        vehicleType: 'car',
        fuelType: defaultFuelType,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        const id = await addVehicle(formData);
        const newVehicle = vehicles.find((v) => v.id === id);
        if (newVehicle) {
            onAdd(newVehicle);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Vehicle</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Vehicle Name *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Honda City, Activa 6G"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Registration Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., KA-01-AB-1234"
                            value={formData.registrationNumber}
                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Vehicle Type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { type: 'car', icon: Car, label: 'Car' },
                                { type: 'bike', icon: Bike, label: 'Bike' },
                                { type: 'scooter', icon: Bike, label: 'Scooter' },
                                { type: 'auto', icon: Truck, label: 'Auto' },
                            ].map(({ type, icon: Icon, label }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, vehicleType: type as any })}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${formData.vehicleType === type
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fuel Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['petrol', 'diesel', 'cng'] as FuelType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, fuelType: type })}
                                    className={`py-2 px-4 rounded-lg border-2 transition-colors text-sm font-medium ${formData.fuelType === type
                                        ? type === 'petrol'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600'
                                            : type === 'diesel'
                                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                                                : 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {fuelTypeLabels[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Add Vehicle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface VehicleSelectorProps {
    selectedVehicleId?: string;
    onSelect: (vehicle: Vehicle | null) => void;
    fuelTypeFilter?: FuelType;
}

export function VehicleSelector({ selectedVehicleId, onSelect, fuelTypeFilter }: VehicleSelectorProps) {
    const { vehicles } = useVehicleStore();
    const [showAddModal, setShowAddModal] = useState(false);

    const filteredVehicles = fuelTypeFilter
        ? vehicles.filter((v) => v.fuelType === fuelTypeFilter)
        : vehicles;

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vehicle
            </label>

            {filteredVehicles.length === 0 ? (
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add Your First Vehicle</span>
                </button>
            ) : (
                <div className="space-y-2">
                    <select
                        value={selectedVehicleId || ''}
                        onChange={(e) => {
                            const vehicle = vehicles.find((v) => v.id === e.target.value);
                            onSelect(vehicle || null);
                        }}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">Select a vehicle</option>
                        {filteredVehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} {vehicle.registrationNumber && `(${vehicle.registrationNumber})`}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add new vehicle
                    </button>
                </div>
            )}

            {selectedVehicle && selectedVehicle.lastOdometer && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Last odometer: {selectedVehicle.lastOdometer.toLocaleString('en-IN')} km
                    {selectedVehicle.averageMileage && ` • Avg mileage: ${selectedVehicle.averageMileage.toFixed(1)} km/L`}
                </p>
            )}

            <AddVehicleModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={(vehicle) => {
                    onSelect(vehicle);
                    setShowAddModal(false);
                }}
                defaultFuelType={fuelTypeFilter}
            />
        </div>
    );
}

export default VehicleSelector;
