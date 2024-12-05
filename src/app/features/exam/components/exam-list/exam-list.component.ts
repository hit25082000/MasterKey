import { Component, OnInit, inject, ViewChild, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { Exam } from '../../../../core/models/exam.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExamService } from '../../../../core/services/exam.service';
import { ExamFormComponent } from '../exam-form/exam-form.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ExamFormComponent, ModalComponent],
  template: `
    <div class="exam-list-container">
      <div class="header">
        <div class="title-section">
          <h2>Exames</h2>
          <p class="subtitle">Gerencie os exames do curso</p>
        </div>
        <button class="btn-add" (click)="modalExam.toggle()">
          <i class="fas fa-plus"></i>
          Novo Exame
        </button>
      </div>

      <div class="exams-grid">
        @if (exams$ | async; as exams) {
          @if (exams.length === 0) {
            <div class="no-exams">
              <i class="fas fa-book-open"></i>
              <p>Nenhum exame cadastrado para este curso.</p>
              <button class="btn-add" (click)="modalExam.toggle()">
                Criar Primeiro Exame
              </button>
            </div>
          } @else {
            @for (exam of exams; track exam.id) {
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
        } @else {
          <div class="loading">
            <div class="loading-spinner"></div>
            <p>Carregando exames...</p>
          </div>
        }
      </div>

      <app-modal #modalExam>
        <app-exam-form
          [exam]="selectedExam()"
          (formSubmit)="onFormSuccess($event)"
          (formCancel)="onFormCancel()"
        ></app-exam-form>
      </app-modal>
    </div>
  `,
  styles: [`
    .exam-list-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      .title-section {
        h2 {
          font-size: 2rem;
          color: #2d3748;
          margin: 0;
          font-weight: 600;
        }

        .subtitle {
          color: #718096;
          margin-top: 0.5rem;
        }
      }
    }

    .exams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      animation: fadeIn 0.5s ease-out;
    }

    .exam-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s ease;
      animation: slideUp 0.5s ease-out;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
      }

      .exam-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;

        h3 {
          font-size: 1.25rem;
          color: #2d3748;
          margin: 0;
          font-weight: 600;
        }

        .exam-meta {
          display: flex;
          gap: 1rem;
          margin-top: 0.75rem;
          color: #718096;
          font-size: 0.875rem;

          span {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            i {
              font-size: 1rem;
              color: #4a90e2;
            }
          }
        }
      }

      .exam-content {
        padding: 1.5rem;
        color: #4a5568;

        p {
          margin: 0;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .exam-actions {
        padding: 1rem 1.5rem;
        background: #f8fafc;
        display: flex;
        gap: 1rem;
        border-top: 1px solid #e2e8f0;

        button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;

          &.btn-edit {
            background: #4a90e2;
            color: white;

            &:hover {
              background: #357abd;
              transform: translateY(-2px);
            }
          }

          &.btn-delete {
            background: #ef4444;
            color: white;

            &:hover {
              background: #dc2626;
              transform: translateY(-2px);
            }
          }
        }
      }
    }

    .btn-add {
      padding: 0.75rem 1.5rem;
      background: #48bb78;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover {
        background: #38a169;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(56, 161, 105, 0.2);
      }

      i {
        font-size: 1rem;
      }
    }

    .no-exams {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: #f8fafc;
      border-radius: 12px;
      color: #718096;

      i {
        font-size: 3rem;
        color: #a0aec0;
        margin-bottom: 1rem;
      }

      p {
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
      }
    }

    .loading {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      color: #718096;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #4a90e2;
        border-radius: 50%;
        margin: 0 auto 1rem;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .exam-list-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;

        .btn-add {
          width: 100%;
          justify-content: center;
        }
      }

      .exam-card {
        .exam-actions {
          flex-direction: column;

          button {
            width: 100%;
          }
        }
      }
    }
  `]
})
export class ExamListComponent implements OnInit {
  exams$!: Observable<Exam[]>;
  courseId: string | null = null;
  selectedExam = signal<Exam | undefined>(undefined);

  examModal = viewChild.required<ModalComponent>('examModal');
  examForm = viewChild.required<ExamFormComponent>('examForm');

  private examService = inject(ExamService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private examsSubject = new BehaviorSubject<Exam[]>([]);

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.loadExams();
    }
  }

  loadExams() {
    this.examService.getExamsByCourse(this.courseId!).subscribe({
      next: (exams) => {
        this.examsSubject.next(exams);
      },
      error: (error) => {
        console.error('Erro ao carregar exames:', error);
        this.notificationService.error('Erro ao carregar exames');
      }
    });
    this.exams$ = this.examsSubject.asObservable();
  }

  openExamForm() {
    this.selectedExam.set(undefined);
  }

  editExam(exam: Exam) {
    this.selectedExam.set(exam);
    this.examModal().toggle();
  }

  onFormSuccess(exam: Exam) {
    const isUpdate = !!exam.id;

    const operation = isUpdate ?
      this.examService.updateExam(exam) :
      this.examService.createExam(exam);

    operation.subscribe({
      next: () => {
        this.notificationService.success(
          isUpdate ? 'Exame atualizado com sucesso' : 'Exame criado com sucesso'
        );
        this.loadExams();
        this.examModal().toggle();
      },
      error: (error) => {
        console.error('Erro ao salvar exame:', error);
        this.notificationService.error(
          isUpdate ? 'Erro ao atualizar exame' : 'Erro ao criar exame'
        );
      }
    });
  }

  onFormCancel() {
    this.selectedExam.set(undefined);
    this.examModal().toggle();
  }

  deleteExam(exam: Exam) {
    if (confirm(`Tem certeza que deseja apagar o exame "${exam.title}"?`)) {
      this.examService.deleteExam(exam.id).subscribe({
        next: () => {
          this.notificationService.success('Exame excluído com sucesso');
          this.loadExams();
        },
        error: (error) => {
          console.error('Erro ao apagar exame:', error);
          this.notificationService.error('Erro ao excluir exame');
        }
      });
    }
  }
}
