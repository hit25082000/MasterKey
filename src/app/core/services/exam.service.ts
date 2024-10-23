import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { Exam, ExamTake, StudentExam, Answer } from '../models/exam.model';
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

  getExamsTakeByCourse(courseId: string): Observable<ExamTake[]> {
    return this.firestore.getCollectionWithQuery<ExamTake>('exams', [
      where('courseId', '==', courseId),
    ]);
  }

  getExamById(examId: string): Observable<Exam> {
    return from(this.firestore.getDocument<Exam>('exams', examId));
  }

  createExam(exam: Exam): Observable<Exam> {
    return from(this.firestore.addToCollection('exams', exam).then(() => exam));
  }

  updateExam(exam: Exam): Observable<Exam> {
    return from(
      this.firestore.updateDocument('exams', exam.id, exam).then(() => exam)
    );
  }

  deleteExam(examId: string): Observable<void> {
    return from(this.firestore.deleteDocument('exams', examId));
  }

  submitStudentExam(studentExam: StudentExam): Observable<void> {
    return from(this.firestore.addToCollection('student_exams', studentExam));
  }



  calculateScoreAndSaveStudentExam(examId: string, studentId: string, answers: Answer[]): Observable<StudentExam> {
    return this.getExamById(examId).pipe(
      switchMap((exam) => {
        if (!exam) {
          throw new Error('Exame não encontrado');
        }

        const score = this.calculateScore(exam, answers);
        const studentExam: StudentExam = {
          examId,
          studentId,
          answers,
          score,
          submittedAt: new Date()
        };

        return this.submitStudentExam(studentExam).pipe(
          map(() => studentExam)
        );
      })
    );
  }

  private calculateScore(exam: Exam, answers: Answer[]): number {
    let correctAnswers = 0;
    const totalQuestions = exam.questions.length;

    exam.questions.forEach((question) => {
      const studentAnswer = answers.find(a => a.questionId === question.id);
      if (studentAnswer && studentAnswer.selectedOption === question.correctAnswer) {
        correctAnswers++;
      }
    });

    return (correctAnswers / totalQuestions) * 100;
  }

  getStudentExam(examId: string, studentId: string): Observable<StudentExam | null> {
    return from(this.firestore.getDocumentsByQuery<StudentExam>('student_exams',[
      where('examId', '==', examId),
      where('studentId', '==', studentId)
    ]).then(exams => exams.length > 0 ? exams[0] : null));
  }

  getStudentExams(studentId: string): Observable<StudentExam[]> {
    return this.firestore.getCollectionWithQuery<StudentExam>('student_exams', [
      where('studentId', '==', studentId),
    ]);
  }
}