import { User, Expense, Vehicle } from '../models';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
  update(id: string, updates: Partial<User>): Promise<void>;
}

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findByUserId(userId: string): Promise<Expense[]>;
  create(expense: Expense): Promise<void>;
  update(id: string, updates: Partial<Expense>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByUserId(userId: string): Promise<Vehicle[]>;
  create(vehicle: Vehicle): Promise<void>;
  update(id: string, updates: Partial<Vehicle>): Promise<void>;
  delete(id: string): Promise<void>;
}
