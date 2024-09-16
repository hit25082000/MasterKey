import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable, from } from 'rxjs';

export enum LogCategory {
  STUDENT_LOGIN = 'student_login',
  USER_REGISTRATION = 'user_registration',
  USER_EDIT = 'user_edit',
  USER_DELETE = 'user_delete',
  // Adicione outras categorias conforme necessário
}

@Injectable({
  providedIn: 'root',
})
export class SystemLogService {
  private logCollection = 'system_logs';

  constructor(private firestoreService: FirestoreService) {}

  logAction(
    category: LogCategory,
    action: string,
    details: any
  ): Observable<any> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
    };

    return from(
      this.firestoreService.addToCollection(this.logCollection, logEntry)
    );
  }

  logStudentLogin(studentId: string): Observable<any> {
    return this.logAction(LogCategory.STUDENT_LOGIN, 'Login', { studentId });
  }

  logUserRegistration(userId: string, logDetails: string): Observable<any> {
    return this.logAction(LogCategory.USER_REGISTRATION, 'Registro', {
      userId,
      logDetails,
    });
  }

  logUserEdit(userId: string, logDetails: string): Observable<any> {
    return this.logAction(LogCategory.USER_EDIT, 'Edição', {
      userId,
      logDetails,
    });
  }

  logUserDelete(userId: string, logDetails: string): Observable<any> {
    return this.logAction(LogCategory.USER_DELETE, 'Remoção', {
      userId,
      logDetails,
    });
  }

  async registerStudentAbsence(studentId: string): Promise<void> {
    await this.logStudentLogin(studentId).toPromise();

    // Aqui você pode adicionar a lógica para registrar a falta do estudante
    // Por exemplo, atualizando um documento de presença no Firestore
    const attendanceData = {
      studentId,
      date: new Date().toISOString(),
      status: 'absent',
    };

    await this.firestoreService.addToCollection(
      'student_attendance',
      attendanceData
    );
  }

  // Método para obter logs de login de estudantes
  getStudentLoginLogs(): Observable<any[]> {
    return from(
      this.firestoreService.getDocumentsByAttribute(
        this.logCollection,
        'category',
        LogCategory.STUDENT_LOGIN
      )
    );
  }
}
