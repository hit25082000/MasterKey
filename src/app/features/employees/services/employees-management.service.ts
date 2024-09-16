import { QuerySnapshot } from '@angular/fire/firestore';
import Employee from '../../../core/models/employee.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { EmployeesService } from './employees.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeesManagementService {
  constructor(private firestore: FirestoreService, private storage : StorageService, private auth : AuthService, private admin : AdminService,private employeesService : EmployeesService) {}

  async create(employees: Employee, icon: File | null): Promise<Employee> {
    try {
      const emailAlreadyUsed = await this.firestore.getDocumentsByAttribute('users', 'email', employees.email);

      if (emailAlreadyUsed.length > 0) {
        throw new Error('Email já utilizado!');
      }

      if (icon != null) {
        employees.profilePic = await this.storage.uploadFile(icon, employees.id);
      }

      const querySnapshot = await this.firestore.addToCollection('users', employees);
      employees.id = querySnapshot.id;

      try {
        await this.admin.createUser(employees).toPromise();
      } catch (adminError) {
        // Se falhar ao criar o usuário no Admin SDK, exclua o documento do Firestore
        await this.firestore.deleteDocument('users', employees.id);
        throw adminError;
      }

      return employees;
    } catch (error) {
      console.error('Erro ao criar estudante:', error);
      throw error;
    }
  }

  async update(id: string, newEmployee: Employee,icon? : File | null): Promise<void> {
    const oldEmployees = await this.employeesService.getById(id);

    if (oldEmployees) {

        if(icon != null){
          newEmployee.profilePic = await this.storage.uploadFile(icon, newEmployee.id)
        }

        this.admin.updateUser(newEmployee).subscribe(()=>{
          this.firestore.updateDocument('users', id, newEmployee)
        })
      }else {
      }
  }
}
