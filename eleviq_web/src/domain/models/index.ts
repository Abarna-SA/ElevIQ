export type Role = 'admin' | 'user';

export interface BaseEntity {
  id: string;
  createdAt: string; 
  updatedAt: string;
  deletedAt?: string | null;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  photoURL?: string;
  role: Role;
  onboardingCompleted: boolean;
}

export interface Expense extends BaseEntity {
  userId: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  receiptUrl?: string;
  type: 'expense' | 'income';
}

export interface Vehicle extends BaseEntity {
  userId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  status: 'active' | 'sold' | 'parked';
  mileage: number;
  purchasePrice: number;
}
