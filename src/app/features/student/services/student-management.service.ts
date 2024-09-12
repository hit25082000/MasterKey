import { QuerySnapshot } from '@angular/fire/firestore';
import { Student } from './../../../core/models/student.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { StudentService } from './student.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StudentManagementService {
  constructor(
    private firestore: FirestoreService,
    private authService: AuthService,
    private systemLog: SystemLogService,
    private storage: StorageService,
    private auth: AuthService,
    private admin: AdminService,
    private studentService: StudentService
  ) {}

  async create(student: Student, icon: File | null): Promise<string> {
    try {
      const emailAlreadyUsed = await this.firestore.getDocumentsByAttribute(
        'users',
        'email',
        student.email
      );

      if (emailAlreadyUsed.length > 0) {
        throw new Error('Email já utilizado!');
      }

      const adminUser = await firstValueFrom(this.admin.createUser(student));
      student.id = adminUser.uid;

      if (icon != null) {
        student.profilePic = await this.storage.uploadIcon(icon, student.id);
      }

      await this.firestore.addToCollectionWithId('users', student.id, student);
      this.logSuccessfulRegistration(student);
      return 'Estudante criado com sucesso!';
    } catch (error) {
      if (student.id) {
        await this.admin.deleteUser(student.id).toPromise();
      }
      if (student.profilePic) {
        await this.storage.deleteIcon(student.id);
      }
      throw this.handleError(error);
    }
  }

  async update(
    id: string,
    newStudent: Student,
    icon?: File | null
  ): Promise<string> {
    try {
      const oldStudent = await this.studentService.getById(id);
      if (!oldStudent) {
        throw new Error('Estudante não encontrado');
      }

      if (icon != null) {
        newStudent.profilePic = await this.storage.uploadIcon(
          icon,
          newStudent.id
        );
      }

      await firstValueFrom(this.admin.updateUser(newStudent));
      await this.firestore.updateDocument('users', id, newStudent);

      return 'Estudante atualizado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(userId: string): Promise<string> {
    try {
      const student = await this.studentService.getById(userId);
      if (!student) {
        throw new Error('Usuário não encontrado');
      }

      await Promise.all([
        this.firestore.deleteDocument('users', userId),
        this.admin.deleteUser(userId).toPromise(),
        student.profilePic
          ? this.storage.deleteIcon(student.id)
          : Promise.resolve(),
      ]);

      this.logSuccessfulDelete(student);
      return 'Estudante deletado com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido ao deletar estudante');
  }

  private logSuccessfulRegistration(student: Student) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) cadastrou o estudante ${student.name} (ID: ${
      student.id
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserRegistration(student.id, logDetails);
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
}
