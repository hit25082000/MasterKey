import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap, catchError, throwError } from 'rxjs';
import { Class } from '../../../core/models/class.model';
import { Student } from '../../../core/models/student.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { LogCategory, SystemLogService } from '../../../core/services/system-log.service';
import { Attendance } from '../../../core/models/attendance.model';
import { where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ClassManagementService {
  private firestoreService = inject(FirestoreService);
  private systemLogService = inject(SystemLogService);
  private readonly classCollection = 'classes';
  private readonly studentCollection = 'students';

  loadClasses(): Observable<Class[]> {
    return from(
      this.firestoreService.getCollection<Class>(this.classCollection)
    ).pipe(
      catchError(error => {
        console.error('Erro ao carregar turmas:', error);
        return throwError(() => error);
      })
    );
  }

  getClass(id: string): Observable<Class | null> {
    return from(
      this.firestoreService.getDocument<Class>(this.classCollection, id)
    ).pipe(
      catchError(error => {
        console.error('Erro ao buscar turma:', error);
        return throwError(() => error);
      })
    );
  }

  getStudentsInClass(classId: string): Observable<Student[]> {
    return this.getClass(classId).pipe(
      switchMap(classData => {
        if (!classData?.studentIds?.length) {
          return from([]);
        }
        return from(
          this.firestoreService.getDocumentsByQuery<Student>(
            this.studentCollection,
            where('id', 'in', classData.studentIds)
          )
        );
      }),
      catchError(error => {
        console.error('Erro ao buscar alunos da turma:', error);
        return throwError(() => error);
      })
    );
  }

  getStudentsByIds(studentIds: string[]): Observable<Student[]> {
    if (!studentIds?.length) return from([]);

    return from(
      this.firestoreService.getDocumentsByQuery<Student>(
        this.studentCollection,
        where('id', 'in', studentIds)
      )
    ).pipe(
      catchError(error => {
        console.error('Erro ao buscar estudantes:', error);
        return throwError(() => error);
      })
    );
  }

  getClassAttendance(classId: string, startDate: Date, endDate: Date): Observable<Attendance[]> {
    return this.systemLogService.getLogsAttendanceByDate(
      LogCategory.STUDENT_ACTION,
      'attendance',
      startDate,
      endDate
    ).pipe(
      map(logs => {
        return logs
          .filter(log => log.details.classId === classId)
          .map(log => ({
            id: log.id || '',
            classId: log.details.classId,
            studentId: log.details.studentId,
            date: new Date(log.details.date), 
            present: log.details.present || false,
            createdAt: new Date(log.timestamp),
            updatedAt: new Date(log.timestamp)
          }));
      }),
      catchError(error => {
        console.error('Erro ao buscar presenças:', error);
        return throwError(() => error);
      })
    );
  }

  createClass(classData: Class, studentIds?: string[]): Observable<void> {
    const newClass: Class = {
      ...classData,
      studentIds: studentIds || []
    };

    return from(
      this.firestoreService.addToCollection(this.classCollection, newClass)
    ).pipe(
      switchMap(id => {
        return this.systemLogService.logAction(
          LogCategory.SYSTEM_ACTION,
          'create_class',
          { classId: id, ...newClass }
        );
      }),
      catchError(error => {
        console.error('Erro ao criar turma:', error);
        return throwError(() => error);
      })
    );
  }

  updateClass(id: string, classData: Partial<Class>, classStudents?: string[]): Observable<void> {
    const updateData: Partial<Class> = {
      ...classData,
      studentIds: classStudents || []
    };

    return from(
      this.firestoreService.updateDocument(this.classCollection, id, updateData)
    ).pipe(
      switchMap(() => {
        return this.systemLogService.logAction(
          LogCategory.SYSTEM_ACTION,
          'update_class',
          { classId: id, ...updateData }
        );
      }),
      catchError(error => {
        console.error('Erro ao atualizar turma:', error);
        return throwError(() => error);
      })
    );
  }

  updateAttendance(attendance: Attendance): Observable<void> {
    const date = new Date(attendance.date);
    date.setUTCHours(12, 0, 0, 0);
    return this.systemLogService.logAction(
      LogCategory.STUDENT_ACTION,
      'attendance',
      {
        classId: attendance.classId,
        studentId: attendance.studentId,
        present: attendance.present,
        date: date.toISOString() 
      }
    ).pipe(
      catchError(error => {
        console.error('Erro ao atualizar presença:', error);
        return throwError(() => error);
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(
      this.firestoreService.deleteDocument(this.classCollection, id)
    ).pipe(
      switchMap(() => {
        return this.systemLogService.logAction(
          LogCategory.SYSTEM_ACTION,
          'delete_class',
          { classId: id }
        );
      }),
      catchError(error => {
        console.error('Erro ao excluir turma:', error);
        return throwError(() => error);
      })
    );
  }
}
