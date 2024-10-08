import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { Exam, StudentExam } from '../models/exam.model';
import { where } from '@firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  constructor(private firestore: FirestoreService) {}

  getExamsByCourse(courseId: string): Observable<Exam[]> {
    return this.firestore.getCollectionWithQuery<Exam>('exams', [
      where('courseId', '==', courseId),
    ]);
  }

  getExamById(examId: string): Observable<Exam | undefined> {
    return from(this.firestore.getDocument<Exam>('exams', examId));
  }

  createExam(exam: Exam): Observable<Exam> {
    console.log('xd crate');

    return from(this.firestore.addToCollection('exams', exam).then(() => exam));
  }

  updateExam(exam: Exam): Observable<Exam> {
    console.log('xd');
    return from(
      this.firestore.updateDocument('exams', exam.id, exam).then(() => exam)
    );
  }

  deleteExam(examId: string): Observable<void> {
    return from(this.firestore.deleteDocument('exams', examId));
  }

  submitStudentExam(studentExam: StudentExam): Observable<void> {
    return from(this.firestore.addToCollection('studentExams', studentExam));
  }

  getStudentExams(studentId: string): Observable<StudentExam[]> {
    return this.firestore.getCollectionWithQuery<StudentExam>('studentExams', [
      where('studentId', '==', studentId),
    ]);
  }
}
