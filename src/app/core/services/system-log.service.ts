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
  USER_LOGIN = 'user_login',
  MEETING_CREATION = 'meeting_creation',
  COURSE_PROGRESS = 'course_progress',
  VIDEO_WATCHED = 'video_watched',
  VIDEO_PROGRESS_REMOVED = 'video_progress_removed',
  COURSE_PROGRESS_RESET = 'course_progress_reset',
  STUDENT_ACTION = 'student_action',
  NOTIFICATION = 'notification'
}

export interface LogEntry {
  timestamp: string;
  category: LogCategory;
  action: string;
  details: any;
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
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
    };

    return from(
      this.firestoreService.addToCollection(this.logCollection, logEntry)
    );
  }

  logVideoProgress(studentId: string, courseId: string, videoId: string, action: 'watched' | 'removed'): Observable<any> {
    const category = action === 'watched' ? LogCategory.VIDEO_WATCHED : LogCategory.VIDEO_PROGRESS_REMOVED;
    return this.logAction(category, `Video ${action}`, {
      studentId,
      courseId,
      videoId,
      timestamp: new Date().toISOString()
    });
  }

  logCourseProgressReset(studentId: string, courseId: string): Observable<any> {
    return this.logAction(LogCategory.COURSE_PROGRESS_RESET, 'Progress reset', {
      studentId,
      courseId,
      timestamp: new Date().toISOString()
    });
  }

  logStudentAction(studentId: string, action: string, details: any): Observable<any> {
    return this.logAction(LogCategory.STUDENT_ACTION, action, {
      studentId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  logStudentLogin(studentId: string): Observable<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return from(
      this.firestoreService.getDocumentsByQuery<LogEntry>(
        this.logCollection,
        where('category', '==', LogCategory.STUDENT_LOGIN),
        where('details.studentId', '==', studentId),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString())
      )
    ).pipe(
      switchMap((logs) => {
        if (logs.length > 0) {
          return of(null);
        } else {
          return this.logAction(LogCategory.STUDENT_LOGIN, 'Login', {
            studentId,
            timestamp: new Date().toISOString()
          });
        }
      })
    );
  }

  logUserRegistration(userId: string, logDetails: string): Observable<any> {
    return this.logAction(LogCategory.USER_REGISTRATION, 'Registro', {
      userId,
      logDetails,
      timestamp: new Date().toISOString()
    });
  }

  logUserEdit(userId: string, logDetails: string): Observable<any> {
    return this.logAction(LogCategory.USER_EDIT, 'Edição', {
      userId,
      logDetails,
      timestamp: new Date().toISOString()
    });
  }

  logUserDelete(userId: string, logDetails: string): Observable<any> {
    return this.logAction(LogCategory.USER_DELETE, 'Remoção', {
      userId,
      logDetails,
      timestamp: new Date().toISOString()
    });
  }

  logUserLogin(userId: string, userName: string): Observable<any> {
    return this.logAction(LogCategory.USER_LOGIN, 'Login', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
  }

  getStudentLoginLogs(): Observable<LogEntry[]> {
    return from(
      this.firestoreService.getDocumentsByAttribute<LogEntry>(
        this.logCollection,
        'category',
        LogCategory.STUDENT_LOGIN
      )
    );
  }

  getStudentProgressLogs(studentId: string): Observable<LogEntry[]> {
    return from(
      this.firestoreService.getDocumentsByQuery<LogEntry>(
        this.logCollection,
        where('details.studentId', '==', studentId),
        where('category', 'in', [
          LogCategory.VIDEO_WATCHED,
          LogCategory.VIDEO_PROGRESS_REMOVED,
          LogCategory.COURSE_PROGRESS_RESET
        ])
      )
    );
  }

  getCourseProgressLogs(courseId: string): Observable<LogEntry[]> {
    return from(
      this.firestoreService.getDocumentsByQuery<LogEntry>(
        this.logCollection,
        where('details.courseId', '==', courseId),
        where('category', 'in', [
          LogCategory.VIDEO_WATCHED,
          LogCategory.VIDEO_PROGRESS_REMOVED,
          LogCategory.COURSE_PROGRESS_RESET
        ])
      )
    );
  }
}
