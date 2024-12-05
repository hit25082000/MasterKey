import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Class } from '../../../core/models/class.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ClassManagementService {
  constructor(private firestore: FirestoreService) {}

  create(newClass: Class, students: string[]): Observable<void> {
    return from(this.createClass(newClass, students)).pipe(
      catchError(this.handleError)
    );
  }

  private async createClass(newClass: any, classStudents: string[]): Promise<void> {
    const existingClasses = await this.firestore.getDocumentsByAttribute('classes', 'name', newClass.name);
    if (existingClasses.length > 0) {
      throw new Error('Já existe uma turma com este nome.');
    }
    const classe = await this.firestore.addToCollection('classes', newClass);
    await this.firestore.addToCollectionWithId('class_students', classe.id, { students: classStudents});
  }

  async update(newClass: any, students: string[]): Promise<void> {
    try {
      const oldClass = await this.firestore.getDocument('classes', newClass.id) as Class;
      if (!oldClass) {
        throw new Error('Turma não encontrada.');
      }

      const classItem = this.prepareClassItem(newClass);
      await this.firestore.updateDocument('classes', newClass.id, classItem);
      await this.firestore.updateDocument('class_students', newClass.id, { students: students });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private prepareClassItem(classData: any): Class {
    return {
      id: classData.id,
      name: classData.name,
      daysWeek: classData.daysWeek,
      startDate: classData.startDate,
      finishDate: classData.finishDate,
      time: classData.time,
      status: classData.status,
      room: classData.room,
      teacher: classData.teacher,
    };
  }

  async updateStudentClasses(
    studentId: string,
    classIds: string[]
  ): Promise<string> {
    try {
      await Promise.all(
        classIds.map((classId) => this.addStudentToClass(classId, studentId))
      );

      return 'Pacotes atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    let classItem = await this.firestore.getDocument('class_students', classId);

    if (!classItem) {
      // Cria um novo item de classe se não existir
      classItem = { students: [] };
    }

    if (!classItem.students.includes(studentId)) {
      classItem.students.push(studentId);
    }

    await this.firestore.updateDocument('class_students', classId, classItem);
  }

  async removeStudentFromClass(
    classId: string,
    studentId: string
  ): Promise<void> {
    const classItem = (await this.firestore.getDocument(
      'class_students',
      classId
    )) as any;

    if (classItem) {
      classItem.students = classItem.students.filter((id : any) => id !== studentId);

      await this.firestore.updateDocument('class_students', classId, classItem);
    }
  }

  async updateClassStudents(
    classId: string,
    studentIds: string[]
  ): Promise<void> {
    await this.firestore.updateDocument('class_students', classId, studentIds);
  }

  private handleError(error: unknown): Observable<never> {
    let errorMessage: string;
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Erro desconhecido';
    }
    console.error('Erro no ClassManagementService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
