import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Exam } from '../../../../core/models/exam.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExamService } from '../../../../core/services/exam.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="exam-list-container">
      <div class="header">
        <div class="title-section">
          <h2>Exames</h2>
          <p class="subtitle">Gerencie os exames do curso</p>
        </div>
        <button class="btn-add" (click)="createExam()">
          <i class="fas fa-plus"></i>
          Novo Exame
        </button>
      </div>

      <div class="exams-grid">
        @if (isLoading()) {
          <div class="loading">
            <div class="loading-spinner"></div>
            <p>Carregando exames...</p>
          </div>
        } @else if (exams().length === 0) {
          <div class="no-exams">
            <i class="fas fa-book-open"></i>
            <p>Nenhum exame cadastrado para este curso.</p>
          </div>
        } @else {
          @for (exam of exams(); track exam.id) {
            <div class="exam-card">
              <div class="exam-header">
                <h3>{{ exam.title }}</h3>
                <div class="exam-meta">
                  <span class="question-count">
                    <i class="fas fa-question-circle"></i>
                    {{ exam.questions?.length || 0 }} questões
                  </span>
                  <span class="date">
                    <i class="fas fa-calendar-alt"></i>
                    {{ exam.createdAt | date:'shortDate' }}
                  </span>
                </div>
              </div>

              <div class="exam-content">
                <p>{{ exam.description }}</p>
              </div>

              <div class="exam-actions">
                <button class="btn-edit" (click)="editExam(exam)">
                  <i class="fas fa-edit"></i>
                  <span>Editar</span>
                </button>
                <button class="btn-delete" (click)="deleteExam(exam)">
                  <i class="fas fa-trash"></i>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrls: ['./exam-list.component.scss']
})
export class ExamListComponent implements OnInit {
  private examService = inject(ExamService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  courseId = signal<string | null>(null);
  exams = signal<Exam[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.courseId.set(this.route.snapshot.paramMap.get('id'));
    if (this.courseId()) {
      this.loadExams();
    }
  }

  async loadExams() {
    try {
      if (!this.courseId()) return;

      this.examService.getExamsByCourse(this.courseId()!).subscribe({
        next: (exams) => {
          this.exams.set(exams);
          console.log(exams);
        },
        error: (error) => {
          console.error('Erro ao carregar exames:', error);
          this.notificationService.error('Erro ao carregar exames');
        }
      });
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
      this.notificationService.error('Erro ao carregar exames');
    } finally {
      this.isLoading.set(false);
    }
  }

  createExam() {
    if (!this.courseId()) return;
    this.router.navigate(['/admin/exams-form', this.courseId()]);
  }

  editExam(exam: Exam) {
    if (!this.courseId()) return;
    console.log(exam);
    this.router.navigate(['/admin/exams-form', this.courseId() + "_" + exam.id]);
  }

  async deleteExam(exam: Exam) {
    if (confirm(`Tem certeza que deseja apagar o exame "${exam.title}"?`)) {
      try {
        await this.examService.deleteExam(exam.id);
        this.notificationService.success('Exame excluído com sucesso');
        await this.loadExams();
      } catch (error) {
        console.error('Erro ao apagar exame:', error);
        this.notificationService.error('Erro ao excluir exame');
      }
    }
  }
}
