import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ExamService } from '../../../../core/services/exam.service';
import { StudentExam } from '../../../../core/models/exam.model';
import { TimestampPipe } from '../../../../shared/pipes/timestamp.pipe';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, RouterModule, TimestampPipe],
  template: `
    <div class="exams-container">
      <div class="exams-header">
        <h2>Meus Exames</h2>
      </div>

      @if (!isLoading()) {
        <div class="exams-grid">
          @for (exam of studentExams(); track exam.examId) {
            <div class="exam-card">
              <div class="exam-header">
                <span class="semester-badge">{{ getSemester(exam.submittedAt) }}</span>
                <span class="score-badge" [class.high-score]="exam.score >= 70">
                  {{ exam.score.toFixed(0) }}%
                </span>
              </div>

              <div class="exam-content">
                <h3>{{ exam.examName || 'Carregando...' }}</h3>
                <div class="exam-info">
                  <span class="info-item">
                    <i class="fas fa-calendar"></i>
                    {{ exam.submittedAt | timestamp:'dd/MM/yyyy' }}
                  </span>
                  <span class="info-item">
                    <i class="fas fa-clock"></i>
                    {{ exam.submittedAt | timestamp:'HH:mm' }}
                  </span>
                </div>
              </div>

              <div class="exam-actions">
                <a [routerLink]="['/classroom/exam-details', exam.examId]" class="btn-details">
                  <i class="fas fa-eye"></i>
                  Ver Detalhes
                </a>
              </div>
            </div>
          } @empty {
            <div class="no-exams">
              <i class="fas fa-file-alt"></i>
              <p>Nenhum exame realizado ainda</p>
            </div>
          }
        </div>
      } @else {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando exames...</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./student-exams.component.scss']
})
export class StudentExamsComponent implements OnInit {
  private authService = inject(AuthService);
  private examService = inject(ExamService);

  studentExams = signal<(StudentExam & { examName: string })[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    const studentId = this.authService.getCurrentUserId();
    if (studentId) {
      this.loadStudentExams(studentId);
    } else {
      console.error('Usuário não autenticado');
      this.isLoading.set(false);
    }
  }

  private loadStudentExams(studentId: string) {
    this.examService.getStudentExams(studentId).subscribe({
      next: (exams) => {
        const examsWithNames = exams.map(exam => ({
          ...exam,
          examName: ''
        }));
        this.studentExams.set(examsWithNames);
        this.loadExamNames(examsWithNames);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar exames do estudante', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadExamNames(exams: (StudentExam & { examName: string })[]) {
    exams.forEach((exam, index) => {
      this.examService.getExamById(exam.examId).subscribe({
        next: (fullExam) => {
          const updatedExams = [...this.studentExams()];
          updatedExams[index].examName = fullExam.title;
          this.studentExams.set(updatedExams);
        },
        error: (error) => {
          console.error(`Erro ao carregar o nome do exame ${exam.examId}`, error);
        }
      });
    });
  }

  getSemester(date: any): string {
    const jsDate = date.toDate();
    const month = jsDate.getMonth();
    const year = jsDate.getFullYear();
    return month < 6 ? `1º Semestre ${year}` : `2º Semestre ${year}`;
  }
}
