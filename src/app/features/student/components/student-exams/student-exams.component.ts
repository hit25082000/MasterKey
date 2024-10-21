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
  templateUrl: './student-exams.component.html',
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
