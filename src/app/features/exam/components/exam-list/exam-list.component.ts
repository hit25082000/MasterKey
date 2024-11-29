import { Component, OnInit, inject, ViewChild, signal } from '@angular/core';
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
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.scss',
})
export class ExamListComponent implements OnInit {
  // Signals
  readonly selectedExam = signal<Exam | null>(null);
  readonly courseId = signal<string | null>(null);

  // Injeções
  private readonly examService = inject(ExamService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  // ViewChild
  @ViewChild('modalExam') private readonly modalExam!: ModalComponent;

  // Observables
  private readonly examsSubject = new BehaviorSubject<Exam[]>([]);
  readonly exams$ = this.examsSubject.asObservable();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('courseId');
    this.courseId.set(id);
    if (id) this.loadExams();
  }

  onFormSuccess(): void {
    this.loadExams();
    this.modalExam.toggle();
    this.selectedExam.set(null);
  }

  onFormCancel(): void {
    this.modalExam.toggle();
    this.selectedExam.set(null);
  }

  editExam(exam: Exam): void {
    this.selectedExam.set(exam);
    this.modalExam.toggle();
  }

  async deleteExam(exam: Exam): Promise<void> {
    if (!confirm(`Deseja realmente excluir o exame "${exam.title}"?`)) return;

    try {
      await this.examService.deleteExam(exam.id).toPromise();
      this.notificationService.success('Exame excluído com sucesso');
      this.loadExams();
    } catch (error) {
      console.error('Erro ao excluir exame:', error);
      this.notificationService.error('Erro ao excluir exame');
    }
  }

  private loadExams(): void {
    if (!this.courseId()) return;

    this.examService.getExamsByCourse(this.courseId()!).subscribe({
      next: (exams) => this.examsSubject.next(exams),
      error: (error) => {
        console.error('Erro ao carregar exames:', error);
        this.notificationService.error('Erro ao carregar exames');
      }
    });
  }
}
