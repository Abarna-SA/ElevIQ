import { getAdminDb } from '../../../lib/firebase-admin';
import { Expense } from '../../../domain/models';
import { ExpenseRepository } from '../../../domain/repositories';

export class FirebaseExpenseRepository implements ExpenseRepository {
  private get collection() { return getAdminDb().collection('expenses'); }

  async findById(id: string): Promise<Expense | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Expense;
  }

  async findByUserId(userId: string): Promise<Expense[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .orderBy('date', 'desc')
      .get();
      
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Expense));
  }

  async create(expense: Expense): Promise<void> {
    const { id, ...data } = expense;
    // If ID is provided use it, otherwise let firestore generate it
    const ref = id ? this.collection.doc(id) : this.collection.doc();
    await ref.set({
      ...data,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async update(id: string, updates: Partial<Expense>): Promise<void> {
    await this.collection.doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}
