import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { Exam } from '../../../../core/models/exam.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExamService } from '../../../../core/services/exam.service';
import { ExamFormComponent } from '../exam-form/exam-form.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ExamFormComponent, ModalComponent],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss'],
})
export class ExamListComponent implements OnInit {
  exams$!: Observable<Exam[]>;
  courseId: string | null = null;
  showForm = false;
  selectedExam: Exam | null = null;

  private examsSubject = new BehaviorSubject<Exam[]>([]);

  constructor(
    private route: ActivatedRoute,
    private examService: ExamService
  ) {}

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('id');

    if (this.courseId) {
      this.loadExams();
    }
  }

  loadExams() {
    this.examService.getExamsByCourse(this.courseId!).subscribe(
      (exams) => {
        this.examsSubject.next(exams);
      },
      (error) => {
        console.error('Erro ao carregar exames:', error);
        // Adicione tratamento de erro adequado aqui
      }
    );
    this.exams$ = this.examsSubject.asObservable();
  }

  openExamForm() {
    this.selectedExam = {courseId: this.courseId} as Exam;
    this.showForm = true;
  }

  editExam(exam: Exam) {
    this.selectedExam = exam;
    this.showForm = true;
  }

  onFormSubmit(exam: Exam) {
    if (exam.updatedAt && exam.updatedAt > exam.createdAt) {
      this.examService.updateExam(exam).subscribe(
        (updatedExam) => {
          const currentExams = this.examsSubject.value;
          const index = currentExams.findIndex((e) => e.id === updatedExam.id);
          if (index !== -1) {
            currentExams[index] = updatedExam;
            this.examsSubject.next([...currentExams]);
          }
          this.showForm = false;
        },
        (error) => {
          console.error('Erro ao atualizar exame:', error);
        }
      );
    } else {
      this.examService.createExam(exam).subscribe(
        (newExam) => {
          this.showForm = false;
        },
        (error) => {
          console.error('Erro ao criar exame:', error);
          // Adicione tratamento de erro adequado aqui
        }
      );
    }
  }

  onFormCancel() {
    this.showForm = false;
    this.selectedExam = null;
  }

  deleteExam(exam: Exam) {
    console.log(exam)
    if (confirm(`Tem certeza que deseja apagar o exame "${exam.title}"?`)) {
      this.examService.deleteExam(exam.id).subscribe(
        () => {
          // Atualiza a lista de exames após a exclusão
          this.loadExams();
        },
        (error) => {
          console.error('Erro ao apagar exame:', error);
          // Adicione tratamento de erro adequado aqui
        }
      );
    }
  }
}
