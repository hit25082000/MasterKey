import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ExamService } from '../../../../core/services/exam.service';
import { StudentExam, Exam } from '../../../../core/models/exam.model';
import { AuthService } from '../../../../core/services/auth.service';
import { IndexToLetterPipe } from '../../../../shared/pipes/index-to-letter.pipe';
import { TimestampPipe } from '../../../../shared/pipes/timestamp.pipe';

@Component({
  selector: 'app-exam-details',
  standalone: true,
  imports: [CommonModule, IndexToLetterPipe, TimestampPipe],
  templateUrl: './exam-details.component.html',
  styleUrls: ['./exam-details.component.scss']
})
export class ExamDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private examService = inject(ExamService);
  private authService = inject(AuthService)

  studentExam = signal<StudentExam | null>(null);
  exam = signal<Exam | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    const examId = this.route.snapshot.paramMap.get('id');
    if (examId) {
      this.loadExamDetails(examId);
    } else {
      console.error('ID do exame não fornecido');
      this.isLoading.set(false);
    }
  }

  private loadExamDetails(examId: string) {
    var studentId = this.authService.getCurrentUserId()
    this.examService.getStudentExam(examId,studentId).subscribe({
      next: (studentExam) => {
        this.studentExam.set(studentExam);
        this.loadExam(examId);
      },
      error: (error) => {
        console.error('Erro ao carregar detalhes do exame do estudante', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadExam(examId: string) {
    this.examService.getExamById(examId).subscribe({
      next: (exam) => {
        this.exam.set(exam);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar detalhes do exame', error);
        this.isLoading.set(false);
      }
    });
  }
}
