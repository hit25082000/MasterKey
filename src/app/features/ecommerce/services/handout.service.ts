import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Handout } from '../../../core/models/handout.model';

@Injectable({
  providedIn: 'root',
})
export class HandoutService {
  firestore = inject(FirestoreService);

  constructor() {}

  getAll(): Promise<Handout[]> {
    return this.firestore.getCollection<Handout>('handouts');
  }

  async getById(id: string): Promise<Handout> {
    return await this.firestore.getDocument<Handout>('handouts', id);
  }

  async delete(id: string) {
    this.firestore.deleteDocument('handouts', id);
  }
}
