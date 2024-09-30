import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Role } from '../../../core/models/role.model';
import { Package } from '../../../core/models/package.model';
import { Class } from '../../../core/models/class.model';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ClassManagementService {
  constructor(private firestore: FirestoreService) {}

  create(newClass: Class) {
    this.firestore
      .getDocumentsByAttribute('classes', 'name', newClass.name)
      .then((packageList) => {
        if (packageList.length == 0) {
          this.firestore.addToCollection('classes', newClass);
        }
      });
  }

  async update(id: string, newClass: Class): Promise<void> {
    const oldStudent = (await this.firestore.getDocument(
      'classes',
      id
    )) as Class;

    if (oldStudent) {
      this.firestore.updateDocument('classes', id, newClass);
    }
  }

  async updateStudentClasses(studentId: string, classIds: string[]): Promise<string> {
    try {
      await this.firestore.addToCollectionWithId('student_packages', studentId, { classIds });
      return 'Pacotes atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const classItem = (await this.firestore.getDocument(
      'class_students',
      classId
    )) as Class;
    console.log(classItem);
    if (classItem) {
    classItem.students.includes(studentId)
      ? null
      : classItem.students.push(studentId);

      classItem.students.push(studentId);
      await this.firestore.updateDocument('class_students', classId, classItem);
    }
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const classItem = (await this.firestore.getDocument(
      'class_students',
      classId
    )) as Class;

    if (classItem) {
      classItem.students = classItem.students.filter((id) => id !== studentId);

      await this.firestore.updateDocument('class_students', classId, classItem);
    }
  }

  async updateClassStudents(classId: string, studentIds: string[]): Promise<void> {
    await this.firestore.updateDocument('class_students', classId, studentIds);
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido');
  }
}
