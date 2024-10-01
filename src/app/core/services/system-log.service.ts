import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { where } from '@angular/fire/firestore';

export enum LogCategory {
  STUDENT_LOGIN = 'student_login',
  USER_REGISTRATION = 'user_registration',
  USER_EDIT = 'user_edit',
  USER_DELETE = 'user_delete',
  USER_LOGIN = 'user_login', // Adicione esta linha
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return from(
      this.firestoreService.getDocumentsByQuery<any>(
        this.logCollection,
        where('category', '==', LogCategory.STUDENT_LOGIN),
        where('details.studentId', '==', studentId),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString())
      )
    ).pipe(
      switchMap((logs) => {
        if (logs.length > 0) {
          // Já existe um log para hoje, não registre novamente
          return of(null);
        } else {
          // Não há log para hoje, registre um novo
          return this.logAction(LogCategory.STUDENT_LOGIN, 'Login', {
            studentId,
          });
        }
      })
    );
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

  logUserLogin(userId: string, userName: string): Observable<any> {
    return this.logAction(LogCategory.USER_LOGIN, 'Login', {
      userId,
      userName,
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
