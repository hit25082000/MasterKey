import { Injectable, inject } from '@angular/core';
import { CarrosselCourse } from '../../../core/models/carrossel-course.model';
import { FirestoreService } from '../../../core/services/firestore.service';

@Injectable({
  providedIn: 'root',
})
export class EcommerceService {
  firestore = inject(FirestoreService);

  constructor() {}

  getAll(): Promise<CarrosselCourse[]> {
    return this.firestore.getCollection<CarrosselCourse>('carrossel_courses');
  }

  async getById(id: string): Promise<CarrosselCourse> {
    return await this.firestore.getDocument<CarrosselCourse>(
      'carrossel_courses',
      id
    );
  }

  async delete(id: string) {
    this.firestore.deleteDocument('carrossel_courses', id);
  }
}
