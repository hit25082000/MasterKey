import { QuerySnapshot, Firestore } from '@angular/fire/firestore';
import { Student } from './../../../core/models/student.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { StudentService } from './student.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StudentManagementService {
  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private adminService: AdminService,
    private systemLog: SystemLogService,
    private firestoreService: FirestoreService
  ) {}

  async create(newStudent: Student, icon: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;
      return new Promise((resolve, reject) => {
        this.adminService.createUser(newStudent, iconBase64).subscribe(
          (student) => {
            console.log(student);
            this.logSuccessfulRegistration(student);
            resolve('Estudante criado com sucesso!');
          },
          (response) => {
            reject(this.handleError(response.error));
          }
        );
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(newStudent: Student, icon?: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;
      const oldStudent = await this.studentService.selectStudent(newStudent.id);

      if(oldStudent() === undefined)
        throw new Error('Estudante não encontrado')

      var logDetails = this.getDifferences(newStudent, oldStudent()!);

      return new Promise((resolve, reject) => {
        this.adminService.updateUser(newStudent, iconBase64).subscribe(
          () => {
            this.logSuccessfulUpdate(newStudent, logDetails);
            resolve('Estudante atualizado com sucesso!');
          },
          (response) => {
            reject(this.handleError(response.error));
          }
        );
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(userId: string): Promise<any> {
    try {
      const student = await this.studentService.selectStudent(userId);

      if(student() === undefined)
        throw new Error('Estudante não encontrado')

        this.adminService.deleteUser(userId).subscribe(() => {
          this.logSuccessfulDelete(student()!);

          return 'Estudante deletado com sucesso!';
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
    return new Error('Erro desconhecido');
  }

  private logSuccessfulRegistration(student: any) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) cadastrou o estudante ${student.name} (ID: ${
      student.uid
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserRegistration(student.uid, logDetails);
  }

  private logSuccessfulUpdate(student: Student, chagedData: Partial<Student>) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) alterou os dados ${JSON.stringify(chagedData)} do funcionario ${
      student.name
    } (ID: ${student.id}) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserEdit(student.id, logDetails);
  }

  private logSuccessfulDelete(student: Student) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) removeu o estudante ${student.name} (ID: ${
      student.id
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserDelete(student.id, logDetails);
  }

  async updateStudentCourses(studentId: string, courses: string[]): Promise<string> {
    try {
      await this.firestoreService.addToCollectionWithId('student_courses', studentId, { courses });
      return 'Cursos atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStudentPackages(studentId: string, packages: string[]): Promise<string> {
    try {
      await this.firestoreService.addToCollectionWithId('student_packages', studentId, { packages });
      return 'Pacotes atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
