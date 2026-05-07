import { getAdminDb } from '../../../lib/firebase-admin';
import { Vehicle } from '../../../domain/models';
import { VehicleRepository } from '../../../domain/repositories';

export class FirebaseVehicleRepository implements VehicleRepository {
  private get collection() { return getAdminDb().collection('vehicles'); }

  async findById(id: string): Promise<Vehicle | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Vehicle;
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();
      
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Vehicle));
  }

  async create(vehicle: Vehicle): Promise<void> {
    const { id, ...data } = vehicle;
    const ref = id ? this.collection.doc(id) : this.collection.doc();
    await ref.set({
      ...data,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async update(id: string, updates: Partial<Vehicle>): Promise<void> {
    await this.collection.doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).update({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}
