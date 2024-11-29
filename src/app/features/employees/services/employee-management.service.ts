import { QuerySnapshot, Firestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { EmployeeService } from './employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Employee } from '../../../core/models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeManagementService {
  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private adminService: AdminService,
    private systemLog: SystemLogService  ) {}

  async create(employee: Employee, icon: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;
      return new Promise((resolve, reject) => {
        this.adminService.createUser(employee, iconBase64).subscribe(
          () => {
            this.logSuccessfulRegistration(employee);
            resolve('Funcionario criado com sucesso!');
          },
          (error) => {
            console.log(error);
            reject(this.handleError(error));
          }
        );
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(newEmployee: Employee, icon?: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;
      const oldEmployee = await this.employeeService.getById(newEmployee.id);
      var logDetails = this.getDifferences(newEmployee, oldEmployee);

      return new Promise((resolve, reject) => {
        this.adminService.updateUser(newEmployee, iconBase64).subscribe(
          () => {
            this.logSuccessfulUpdate(newEmployee, logDetails);
            resolve('Funcionario atualizado com sucesso!');
          },
          (error) => {
            reject(this.handleError(error));
          }
        );
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(userId: string): Promise<any> {
    try {
      const employee = await this.employeeService.getById(userId);

      this.adminService.deleteUser(userId).subscribe(() => {
        this.logSuccessfulDelete(employee);

        return 'Funcionario deletado com sucesso!';
      });
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

  private handleError(error: any): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    if(error.message != null){
      return new Error(error.message);
    }
    if(error.error != null){
      return new Error(error.error);
    }
    console.log(error);
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

  private logSuccessfulUpdate(employee: Employee, chagedData: Partial<Employee>) {
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
