import { QuerySnapshot } from '@angular/fire/firestore';
import Employee from '../../../core/models/employee.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { EmployeeService } from './employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmployeeManagementService {
  constructor(
    private firestore: FirestoreService,
    private authService: AuthService,
    private systemLog: SystemLogService,
    private storage: StorageService,
    private admin: AdminService,
    private employeeService: EmployeeService
  ) {}

  async create(employee: Employee, icon: File | null): Promise<string> {
    try {
      const emailAlreadyUsed = await this.firestore.getDocumentsByAttribute(
        'users',
        'email',
        employee.email
      );

      if (emailAlreadyUsed.length > 0) {
        throw new Error('Email já utilizado!');
      }

      const adminUser = await firstValueFrom(this.admin.createUser(employee));
      employee.id = adminUser.uid;

      if (icon != null) {
        employee.profilePic = await this.storage.uploadIcon(icon, employee.id);
      }

      await this.firestore.addToCollectionWithId(
        'users',
        employee.id,
        employee
      );
      this.logSuccessfulRegistration(employee);
      return 'Estudante criado com sucesso!';
    } catch (error) {
      if (employee.id) {
        await this.admin.deleteUser(employee.id).toPromise();
      }
      if (employee.profilePic) {
        await this.storage.deleteIcon(employee.id);
      }
      throw this.handleError(error);
    }
  }

  async update(
    id: string,
    newEmployee: Employee,
    icon?: File | null
  ): Promise<string> {
    try {
      const oldEmployee = await this.employeeService.getById(id);
      if (!oldEmployee) {
        throw new Error('Estudante não encontrado');
      }

      if (icon != null) {
        newEmployee.profilePic = await this.storage.uploadIcon(
          icon,
          newEmployee.id
        );
      }

      await firstValueFrom(this.admin.updateUser(newEmployee));
      await this.firestore.updateDocument('users', id, newEmployee);

      var changes = this.getDifferences(newEmployee, oldEmployee);

      this.logSuccessfulUpdate(newEmployee, changes);
      return 'Estudante atualizado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(userId: string): Promise<string> {
    try {
      const employee = await this.employeeService.getById(userId);
      if (!employee) {
        throw new Error('Usuário não encontrado');
      }

      await Promise.all([
        this.firestore.deleteDocument('users', userId),
        this.admin.deleteUser(userId).toPromise(),
        employee.profilePic
          ? this.storage.deleteIcon(employee.id)
          : Promise.resolve(),
      ]);

      this.logSuccessfulDelete(employee);
      return 'Estudante deletado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  getDifferences(oldEmp: Employee, newEmp: Employee) {
    const differences: Partial<Employee> = {};
    for (const key in newEmp) {
      if (newEmp[key as keyof Employee] !== oldEmp[key as keyof Employee]) {
        differences[key as keyof Employee] = newEmp[
          key as keyof Employee
        ] as any; // {{ edit_1 }}
      }
    }
    return differences;
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido');
  }

  private logSuccessfulRegistration(employee: Employee) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) cadastrou o funcionario ${employee.name} (ID: ${
      employee.id
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserRegistration(employee.id, logDetails);
  }

  private logSuccessfulUpdate(
    employee: Employee,
    chagedData: Partial<Employee>
  ) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) alterou os dados ${JSON.stringify(chagedData)} do funcionario ${
      employee.name
    } (ID: ${employee.id}) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserEdit(employee.id, logDetails);
  }

  private logSuccessfulDelete(employee: Employee) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) removeu o funcionario ${employee.name} (ID: ${
      employee.id
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserDelete(employee.id, logDetails);
  }
}
