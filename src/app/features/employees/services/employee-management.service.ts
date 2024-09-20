import { QuerySnapshot } from '@angular/fire/firestore';
import Employee from './../../../core/models/employee.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { EmployeeService } from './employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmployeeManagementService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private adminService: AdminService,
    private systemLog: SystemLogService
  ) {}

  async create(employee: Employee, icon: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;

      await this.adminService.createUser(employee, iconBase64);

      this.logSuccessfulRegistration(employee);
      return 'Estudante criado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(
    id: string,
    newEmployee: Employee,
    icon?: File | null
  ): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;

      const oldEmployee = await this.employeeService.getById(id);

      await this.adminService.updateUser(newEmployee, iconBase64);

      var logDetails = this.getDifferences(newEmployee, oldEmployee);

      this.logSuccessfulUpdate(newEmployee, logDetails);
      return 'Estudante atualizado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(userId: string): Promise<string> {
    try {
      await this.adminService.deleteUser(userId).subscribe(() => {
        this.employeeService.getById(userId).then((employee) => {
          this.logSuccessfulDelete(employee);
        });
      });
      return 'Estudante deletado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  getDifferences<T>(oldEmp: T, newEmp: T) {
    const differences: Partial<T> = {};
    for (const key in newEmp) {
      if (newEmp[key as keyof T] !== oldEmp[key as keyof T]) {
        differences[key as keyof T] = newEmp[key as keyof T] as any; // {{ edit_1 }}
      }
    }
    return differences;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
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
    }) cadastrou o estudante ${employee.name} (ID: ${
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
    }) removeu o estudante ${employee.name} (ID: ${
      employee.id
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserDelete(employee.id, logDetails);
  }
}
