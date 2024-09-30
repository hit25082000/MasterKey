import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import Employee from '../../../core/models/employee.model';
import { AdminService } from '../../../core/services/admin.service';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  constructor(
    private firestore: FirestoreService,
    private admin: AdminService,
    private storage: StorageService
  ) {}

  getAll(): Promise<Employee[]> {
    return this.firestore.getDocumentsByAttribute<Employee>(
      'users',
      'role',
      'employee'
    );
  }

  getAllTeachers(): Promise<Employee[]> {
    return this.firestore.getDocumentsByAttribute<Employee>(
      'users',
      'role',
      'teacher'
    );
  }

  async getById(id: string): Promise<Employee> {
    return await this.firestore.getDocument<Employee>('users', id);
  }
}
