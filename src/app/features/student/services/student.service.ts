import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Student } from '../../../core/models/student.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  constructor(
    private firestore: FirestoreService,
    private admin: AdminService,
    private storage: StorageService
  ) {}

  getAll(): Promise<Student[]> {
    return this.firestore.getDocumentsByAttribute<Student>(
      'users',
      'role',
      'student'
    );
  }

  async getById(id: string): Promise<Student> {
    return await this.firestore.getDocument<Student>('users', id);
  }

  async getPackages(id: string): Promise<string[]> {
    return await this.firestore.getDocument<string[]>('student_packages', id);
  }

  async getCourses(id: string): Promise<string[]> {
    return await this.firestore.getDocument<string[]>('student_courses', id);
  }
}
