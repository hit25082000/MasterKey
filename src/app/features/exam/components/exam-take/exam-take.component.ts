import { Component, OnInit, input, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Answer, Exam, Options, Question, StudentExam } from '../../../../core/models/exam.model';
import { ExamService } from '../../../../core/services/exam.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Observable, switchMap, tap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-exam-take',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-take.component.html',
  styleUrls: ['./exam-take.component.scss']
})
export class ExamTakeComponent implements OnInit {
  private examService = inject(ExamService);
  private authService = inject(AuthService);

  examId = input.required<string>();
  exam = signal<Exam | null>(null);
  studentExam = signal<StudentExam | null>(null);
  answers = signal<Answer[]>([]);
  isExamSubmitted = computed(() => !!this.studentExam());
  isLoading = signal(true);

  constructor() {}

  ngOnInit() {
    this.loadExam();
    this.authService.user$.pipe(
      switchMap(user => user ? this.loadStudentExam(user.uid) : of(null))
    ).subscribe();
  }

  private loadExam() {
    this.isLoading.set(true);
    this.examService.getExamById(this.examId()).pipe(
      tap(exam => this.exam.set(exam)),
      catchError(error => {
        console.error('Erro ao carregar o exame', error);
        return of(null);
      }),
      tap(() => this.isLoading.set(false))
    ).subscribe();
  }

  private loadStudentExam(studentId: string): Observable<StudentExam | null> {
    return this.examService.getStudentExam(this.examId(), studentId).pipe(
      tap(studentExam => {
        if (studentExam) {
          this.studentExam.set(studentExam);
          this.answers.set(studentExam.answers);
        }
      }),
      catchError(error => {
        console.error('Erro ao carregar o exame do estudante', error);
        return of(null);
      })
    );
  }

  indexToLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  selectAnswer(question: Question, optionIndex: number) {
    if (this.isExamSubmitted()) return;

    const option = this.indexToLetter(optionIndex) as Options;
    this.answers.update(currentAnswers =>
      this.updateAnswers(currentAnswers, question, option)
    );
  }

  private updateAnswers(answers: Answer[], question: Question, option: Options): Answer[] {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === question.id);
    if (existingAnswerIndex !== -1) {
      return answers.map((answer, index) =>
        index === existingAnswerIndex ? { ...answer, selectedOption: option } : answer
      );
    } else {
      return [...answers, { questionId: question.id, selectedOption: option }];
    }
  }

  isCorrectAnswer(question: Question, optionIndex: number): boolean {
    return this.isExamSubmitted() &&
           this.studentExam() !== null &&
           question.correctAnswer === this.indexToLetter(optionIndex);
  }

  isSelectedAnswer(question: Question, optionIndex: number): boolean {
    const answer = this.answers().find(a => a.questionId === question.id);
    return answer?.selectedOption === this.indexToLetter(optionIndex);
  }

  submitExam() {
    if (this.isExamSubmitted()) {
      console.error('Exame já submetido');
      return;
    }

    const studentId = this.authService.getCurrentUserId();
    if (!studentId) {
      console.error('Usuário não autenticado');
      return;
    }

    this.examService.calculateScoreAndSaveStudentExam(this.examId(), studentId, this.answers())
      .pipe(
        tap(studentExam => {
          this.studentExam.set(studentExam);
          console.log('Exame submetido com sucesso', studentExam);
        }),
        catchError(error => {
          console.error('Erro ao submeter o exame', error);
          return of(null);
        })
      )
      .subscribe();
  }
}
