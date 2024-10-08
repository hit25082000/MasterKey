import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Exam, StudentExam, Answer } from '../../../../core/models/exam.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { CommonModule } from '@angular/common';
import { ExamService } from '../../../../core/services/exam.service';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { switchMap, take } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { from } from 'rxjs';

@Component({
  selector: 'app-exam-take',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-take.component.html',
  styleUrls: ['./exam-take.component.scss'],
})
export class ExamTakeComponent implements OnInit {
  exam!: Exam;
  examForm!: FormGroup;
  studentId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private examService: ExamService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.authService
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((user: User) => {
          if (!user) {
            throw new Error('Usuário não autenticado');
          }
          this.studentId = user.uid;
          const examId = this.route.snapshot.paramMap.get('examId');
          if (!examId) {
            throw new Error('ID do exame não fornecido');
          }
          return this.examService.getExamById(examId);
        })
      )
      .subscribe(
        (exam: Exam) => {
          if (exam) {
            this.exam = exam;
            this.initForm();
          } else {
            this.notificationService.showNotification(
              'Exame não encontrado',
              NotificationType.ERROR
            );
            this.router.navigate(['/']);
          }
        },
        (error: Error) => {
          console.error('Erro ao carregar o exame:', error);
          this.notificationService.showNotification(
            'Erro ao carregar o exame',
            NotificationType.ERROR
          );
          this.router.navigate(['/']);
        }
      );
  }

  initForm() {
    const group: { [key: string]: any } = {};
    this.exam.questions.forEach((question) => {
      group[question.id] = ['', Validators.required];
    });
    this.examForm = this.fb.group(group);
  }

  onSubmit() {
    if (this.examForm.valid) {
      const answers: Answer[] = Object.keys(this.examForm.value).map(
        (questionId) => ({
          questionId,
          selectedOption: this.examForm.value[questionId],
        })
      );

      const score = this.calculateScore(answers);

      from(this.firestoreService.generateId('student_exam'))
        .pipe(
          switchMap((docRef) => {
            const studentExam: StudentExam = {
              id: docRef.id,
              examId: this.exam.id,
              studentId: this.studentId,
              answers,
              score,
              submittedAt: new Date(),
            };
            return this.examService.submitStudentExam(studentExam);
          })
        )
        .subscribe(
          () => {
            this.notificationService.showNotification(
              'Prova enviada com sucesso!',
              NotificationType.SUCCESS
            );
            this.router.navigate(['/course', this.exam.courseId]);
          },
          (error) => {
            console.error('Erro ao enviar a prova:', error);
            this.notificationService.showNotification(
              'Erro ao enviar a prova. Tente novamente.',
              NotificationType.ERROR
            );
          }
        );
    }
  }

  calculateScore(answers: Answer[]): number {
    let correctAnswers = 0;
    answers.forEach((answer) => {
      const question = this.exam.questions.find(
        (q) => q.id === answer.questionId
      );
      if (question && question.correctAnswer === answer.selectedOption) {
        correctAnswers++;
      }
    });
    return (correctAnswers / this.exam.questions.length) * 100;
  }
}
