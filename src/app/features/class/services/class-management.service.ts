import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap, catchError, throwError, forkJoin } from 'rxjs';
import { Class } from '../../../core/models/class.model';
import { Student } from '../../../core/models/student.model';
import { FirestoreService } from '../../../core/services/firestore.service';
import { LogCategory, SystemLogService } from '../../../core/services/system-log.service';
import { Attendance } from '../../../core/models/attendance.model';
import { where, doc, getDoc, setDoc, Firestore, DocumentReference } from '@angular/fire/firestore';

const CLASSES_PATH = 'classes';
const CLASS_STUDENTS_PATH = 'class_students';
const STUDENT_CLASSES_PATH = 'student_classes';

@Injectable({
  providedIn: 'root'
})
export class ClassManagementService {
  private firestoreService = inject(FirestoreService);
  private systemLogService = inject(SystemLogService);
  private firestore = inject(Firestore);

  loadClasses(): Observable<Class[]> {
    return from(
      this.firestoreService.getCollection<Class>(CLASSES_PATH)
    ).pipe(
      catchError(error => {
        console.error('Erro ao carregar turmas:', error);
        return throwError(() => error);
      })
    );
  }

  getClass(id: string): Observable<Class | null> {
    return from(
      this.firestoreService.getDocument<Class>(CLASSES_PATH, id)
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
            STUDENT_CLASSES_PATH,
            where('classId', 'in', classData.studentIds)
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
        STUDENT_CLASSES_PATH,
        where('studentId', 'in', studentIds)
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

  private async updateClassStudentsRelation(classId: string, studentIds: string[]): Promise<void> {
    const classStudentsRef = doc(this.firestore, CLASS_STUDENTS_PATH, classId) as DocumentReference<{ students: string[] }>;
    await setDoc(classStudentsRef, { students: studentIds });
    const promises = studentIds.map(async (studentId) => {
      const studentClassesRef = doc(this.firestore, STUDENT_CLASSES_PATH, studentId) as DocumentReference<{ classes: string[] }>;
      const docSnap = await getDoc(studentClassesRef);
      const currentClasses = docSnap.exists() ? docSnap.data().classes : [];
      
      if (!currentClasses.includes(classId)) {
        await setDoc(studentClassesRef, {
          classes: [...currentClasses, classId]
        });
      }
    });

    await Promise.all(promises);
  }

  private async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    // Remove o aluno da lista de alunos da turma
    const classStudentsRef = doc(this.firestore, CLASS_STUDENTS_PATH, classId) as DocumentReference<{ students: string[] }>;
    const classDocSnap = await getDoc(classStudentsRef);
    const currentStudents = classDocSnap.exists() ? classDocSnap.data().students : [];
    await setDoc(classStudentsRef, {
      students: currentStudents.filter(id => id !== studentId)
    });

    // Remove a turma da lista de turmas do aluno
    const studentClassesRef = doc(this.firestore, STUDENT_CLASSES_PATH, studentId) as DocumentReference<{ classes: string[] }>;
    const studentDocSnap = await getDoc(studentClassesRef);
    const currentClasses = studentDocSnap.exists() ? studentDocSnap.data().classes : [];
    await setDoc(studentClassesRef, {
      classes: currentClasses.filter(id => id !== classId)
    });
  }

  async createClass(classData: Class, studentIds?: string[]): Promise<void> {
    try {
      // Cria a turma
      const docRef = await this.firestoreService.addToCollection(CLASSES_PATH, classData);
      const classId = docRef.id;

      // Atualiza relações se houver studentIds
      if (studentIds?.length) {
        await this.updateClassStudentsRelation(classId, studentIds);
      }

      // Log da ação
      await this.systemLogService.logAction(
        LogCategory.SYSTEM_ACTION,
        'create_class',
        { classId, ...classData }
      ).toPromise();

    } catch (error) {
      console.error('Erro ao criar turma:', error);
      throw error;
    }
  }

  async updateClass(id: string, classData: Partial<Class>, studentIds?: string[]): Promise<void> {
    try {
      // Atualiza os dados da turma
      await this.firestoreService.updateDocument(CLASSES_PATH, id, classData);

      // Atualiza relações se studentIds foi fornecido
      if (studentIds !== undefined) {
        await this.updateClassStudentsRelation(id, studentIds);
      }

      // Log da ação
      await this.systemLogService.logAction(
        LogCategory.SYSTEM_ACTION,
        'update_class',
        { classId: id, ...classData }
      ).toPromise();

    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      throw error;
    }
  }

  delete(id: string): Observable<void> {
    return from(
      this.firestoreService.deleteDocument(CLASSES_PATH, id)
    ).pipe(
      switchMap(async () => {
        // Remove todas as relações com alunos
        const classStudentsRef = doc(this.firestore, CLASS_STUDENTS_PATH, id) as DocumentReference<{ students: string[] }>;
        const docSnap = await getDoc(classStudentsRef);
        const currentStudents = docSnap.exists() ? docSnap.data().students : [];
        
        const promises = currentStudents.map(studentId => 
          this.removeStudentFromClass(id, studentId)
        );
        await Promise.all(promises);

        await this.systemLogService.logAction(
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
}
