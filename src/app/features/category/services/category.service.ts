import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Student } from '../../../core/models/student.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';
import { Category } from '../../../core/models/category.model';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CategoryManagementService } from './category-management.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(
    private firestore: FirestoreService,
    private categoryManagementService: CategoryManagementService
  ) {}

  getAll(): Promise<Category[]> {
    try {
      return this.firestore.getCollection<Category>('categorys');
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return Promise.resolve([]);
    }
  }

  async getById(id: string): Promise<Category> {
    try {
      return await this.firestore.getDocument<Category>('categorys', id);
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      throw error;
    }
  }

  async getCourses(id: string) {
    try {
      const category = await this.firestore.getDocument('categorys', id);
      return category?.courses || [];
    } catch (error) {
      console.error('Erro ao carregar cursos da categoria:', error);
      return [];
    }
  }

  async getPackages(id: string) {
    try {
      const category = await this.firestore.getDocument('categorys', id);
      return category?.packages || [];
    } catch (error) {
      console.error('Erro ao carregar pacotes da categoria:', error);
      return [];
    }
  }

  async addCourseToCategory(categoryId: string, courseId: string) {
    try {
      const courses = await this.getCourses(categoryId);
      if (courses.includes(courseId)) {
        return;
      }
      return this.firestore.updateDocument('categorys', categoryId, {
        courses: [...courses, courseId],
      });
    } catch (error) {
      console.error('Erro ao adicionar curso à categoria:', error);
      throw error;
    }
  }

  delete(id: string): Observable<void> {
    return from(this.categoryManagementService.delete(id));
  }
}
