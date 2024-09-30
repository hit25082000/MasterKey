import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Student } from '../../../core/models/student.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';
import { Category } from '../../../core/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private firestore: FirestoreService) {}

  getAll(): Promise<Category[]> {
    return this.firestore.getCollection<Category>('categorys');
  }

  async getById(id: string): Promise<Category> {
    return await this.firestore.getDocument<Category>('categorys', id);
  }

  async getCourses(id: string) {
    const courses = (await this.firestore.getDocument('categorys', id)) as any;

    return courses.courses;
  }

  async getPackages(id: string) {
    const packages = (await this.firestore.getDocument('categorys', id)) as any;

    return packages.packages;
  }
}
