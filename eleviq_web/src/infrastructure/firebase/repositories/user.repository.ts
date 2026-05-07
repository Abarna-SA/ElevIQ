import { getAdminDb } from '../../../lib/firebase-admin';
import { User } from '../../../domain/models';
import { UserRepository } from '../../../domain/repositories';

export class FirebaseUserRepository implements UserRepository {
  private get collection() { return getAdminDb().collection('users'); }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
  }

  async create(user: User): Promise<void> {
    const { id, ...data } = user;
    await this.collection.doc(id).set({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    await this.collection.doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}
