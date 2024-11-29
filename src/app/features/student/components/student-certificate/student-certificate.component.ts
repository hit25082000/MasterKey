import { Component, effect, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { CourseService } from '../../../course/services/course.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Course } from '../../../../core/models/course.model';
import jsPDF from 'jspdf';

interface StudentCourseStatus {
  course: Course;
  completionPercentage: number;
  averageGrade: number;
  totalExams: number;
  completedExams: number;
  isCompleted: boolean;
}

@Component({
  selector: 'app-student-certificate',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="certificate-container">
      <h2>Certificados e Declarações</h2>

      @if (loading()) {
        <div class="loading">Carregando cursos...</div>
      } @else if (courseStatus().length === 0) {
        <div class="no-courses">
          <p>Nenhum curso encontrado para este estudante.</p>
        </div>
      } @else {
        <div class="courses-list">
          @for (status of courseStatus(); track status.course.id) {
            <div class="course-item">
              <div class="course-info">
                <h3>{{ status.course.name }}</h3>
                <div class="status-details">
                  <p>Progresso: {{ status.completionPercentage }}%</p>
                  <p>Média: {{ status.averageGrade.toFixed(1) }}</p>
                  <p>Provas: {{ status.completedExams }}/{{ status.totalExams }}</p>
                </div>
              </div>
              <button
                [class]="status.isCompleted ? 'btn-certificate' : 'btn-declaration'"
                (click)="generateDocument(status)"
              >
                <i [class]="status.isCompleted ? 'fas fa-certificate' : 'fas fa-file-alt'"></i>
                {{ status.isCompleted ? 'Emitir Certificado' : 'Emitir Declaração' }}
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./student-certificate.component.scss']
})
export class StudentCertificateComponent {
  studentId = input.required<string>();
  private studentService = inject(StudentService);
  private courseService = inject(CourseService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  loading = signal<boolean>(false);
  courseStatus = signal<StudentCourseStatus[]>([]);

  constructor() {
    // Effect que observa mudanças no studentId
    effect(() => {
      const id = this.studentId();
      // Só carrega os cursos se houver um studentId válido
      if (id) {
        queueMicrotask(() => this.loadStudentCourses(id));
      }
    }, { allowSignalWrites: true });
  }

  private async loadStudentCourses(studentId: string) {
    this.loading.set(true);

    try {
      // Carregar estudante e seus cursos
      const student = await this.studentService.selectStudent(studentId);
      if (this.studentService.selectedStudentCourses().length === 0) {
        this.courseStatus.set([]);
        return;
      }

      // Para cada curso, carregar detalhes e calcular status
      const statusPromises = this.studentService.selectedStudentCourses().map(async courseId => {
        console.log("XD"+courseId);
        const course = await this.courseService.getById(courseId);
        const exams = await this.courseService.getCourseExams(courseId);
        const studentExams = await this.studentService.getStudentExams(studentId, courseId);

        const totalExams = exams.length;
        const completedExams = studentExams.length;
        const averageGrade = studentExams.reduce((acc, exam) => acc + exam.grade, 0) / completedExams || 0;
        const completionPercentage = (completedExams / totalExams) * 100;
        console.log(completionPercentage);
        // Consideramos completo se tiver média >= 7 e 100% das provas feitas
        const isCompleted = averageGrade >= 7 && completionPercentage === 100;

        return {
          course,
          completionPercentage,
          averageGrade,
          totalExams,
          completedExams,
          isCompleted
        };
      }) || [];

      const statuses = await Promise.all(statusPromises);
      this.courseStatus.set(statuses);

    } catch (error) {
      this.notificationService.error('Erro ao carregar cursos do estudante');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  async generateDocument(status: StudentCourseStatus) {
    try {
      this.loadingService.show();

      const student = await this.studentService.selectStudent(this.studentId());
      const documentType = status.isCompleted ? 'certificate' : 'declaration';

      // Gerar PDF usando jsPDF
      const doc = new jsPDF();

      // Configurar fonte e tamanho
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);

      // Título
      const title = status.isCompleted ? 'CERTIFICADO' : 'DECLARAÇÃO';
      doc.text(title, 105, 20, { align: 'center' });

      // Conteúdo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

      const text = status.isCompleted
        ? `Certificamos que ${student()?.name} concluiu com êxito o curso "${status.course.name}" com média ${status.averageGrade.toFixed(1)}.`
        : `Declaramos que ${student()?.name} está cursando "${status.course.name}" com ${status.completionPercentage.toFixed(0)}% de progresso.`;

      doc.text(text, 20, 40, {
        maxWidth: 170,
        align: 'justify'
      });

      // Data
      const date = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data: ${date}`, 20, 80);

      // Salvar o documento
      doc.save(`${documentType}_${student()?.name}_${status.course.name}.pdf`);

      this.notificationService.success(
        `${documentType === 'certificate' ? 'Certificado' : 'Declaração'} gerado com sucesso!`
      );
    } catch (error) {
      this.notificationService.error('Erro ao gerar documento');
      console.error(error);
    } finally {
      this.loadingService.hide();
    }
  }
}
