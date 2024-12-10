import { Component, effect, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { CourseService } from '../../../course/services/course.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Course } from '../../../../core/models/course.model';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface StudentCourseStatus {
  course: Course;
  completionPercentage: number;
  averageGrade: number;
  totalExams: number;
  completedExams: number;
  isCompleted: boolean;
}

const positions = {
  studentName: { x: 120, y: 40 },
  coursesList: { x: 100, y: 300 },
  date: { x: 150, y: 200 }
};

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
                  @if (status.totalExams === 0) {
                    <p>Curso sem avaliações</p>
                    <p>Progresso: 100%</p>
                    <p>Status: Completo</p>
                  } @else {
                    <p>Progresso: {{ status.completionPercentage }}%</p>
                    <p>Média: {{ status.averageGrade.toFixed(1) }}</p>
                    <p>Provas: {{ status.completedExams }}/{{ status.totalExams }}</p>
                  }
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
      const student = await this.studentService.selectStudent(studentId);
      if (this.studentService.selectedStudentCourses().length === 0) {
        this.courseStatus.set([]);
        return;
      }

      const statusPromises = this.studentService.selectedStudentCourses().map(async courseId => {
        const course = await this.courseService.getById(courseId);
        const exams = await this.courseService.getCourseExams(courseId);
        const studentExams = await this.studentService.getStudentExams(studentId, courseId);

        // Verifica se o curso tem exames configurados
        if (exams.length === 0) {
          return {
            course,
            completionPercentage: 100,
            averageGrade: 10,
            totalExams: 0,
            completedExams: 0,
            isCompleted: true
          };
        }

        const totalExams = exams.length;
        const completedExams = studentExams.length;

        // Correção no cálculo da média
        let averageGrade = 0;
        if (completedExams > 0) {
          const totalGrades = studentExams.reduce((acc, exam) => {
            // Verifica se exam.grade é um número válido
            const grade = Number(exam.grade);
            return acc + (isNaN(grade) ? 0 : grade);
          }, 0);

          averageGrade = Number((totalGrades / completedExams).toFixed(1));

          // Garante que a média seja um número válido
          if (isNaN(averageGrade)) {
            averageGrade = 0;
          }
        }

        const completionPercentage = Math.round((completedExams / totalExams) * 100);
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
      console.error('Erro ao carregar cursos:', error);
      this.notificationService.error('Erro ao carregar cursos do estudante');
    } finally {
      this.loading.set(false);
    }
  }

  // Função auxiliar para formatar a data por extenso
  private formatDateExtensive(): string {
    const date = new Date();
    const day = date.getDate();
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} de ${year}`;
  }

  async generateDocument(status: StudentCourseStatus) {
    try {
      this.loadingService.show();
      const student = await this.studentService.selectStudent(this.studentId());

      if (!student()) {
        throw new Error('Estudante não encontrado');
      }

      // 1. Criar novo PDF
      const pdfDoc = await PDFDocument.create();

      // 2. Registrar fontkit para suporte a fontes personalizadas
      pdfDoc.registerFontkit(fontkit);

      // 3. Carregar as imagens do template
      let page1ImageBytes, page2ImageBytes;
      try {
        const [page1Response, page2Response] = await Promise.all([
          fetch('assets/certificate-template-img1.png'),
          fetch('assets/certificate-template-img2.png')
        ]);

        if (!page1Response.ok || !page2Response.ok) {
          throw new Error('Templates não encontrados');
        }

        page1ImageBytes = await page1Response.arrayBuffer();
        page2ImageBytes = await page2Response.arrayBuffer();
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
        throw new Error('Não foi possível carregar os templates');
      }

      // 4. Incorporar as imagens
      const [page1Image, page2Image] = await Promise.all([
        pdfDoc.embedPng(page1ImageBytes),
        pdfDoc.embedPng(page2ImageBytes)
      ]);

      // 5. Configurar fontes
      let customFont;
      try {
        const fontResponse = await fetch('assets/fonts/GreatVibes-Regular.ttf');
        if (!fontResponse.ok) {
          throw new Error('Fonte personalizada não encontrada');
        }
        const fontBytes = await fontResponse.arrayBuffer();
        customFont = await pdfDoc.embedFont(fontBytes);
      } catch (error) {
        console.error('Erro ao carregar fonte personalizada:', error);
        // Fallback para fonte padrão em caso de erro
        customFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      }

      const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      // 6. Criar primeira página com a imagem de fundo
      const page1 = pdfDoc.addPage([842, 595]); // A4 paisagem
      page1.drawImage(page1Image, {
        x: 0,
        y: 0,
        width: page1.getWidth(),
        height: page1.getHeight(),
      });

      // 7. Adicionar nome do aluno e curso na primeira página
      const studentName = student()?.name;
      if (studentName) {
        // Nome do estudante centralizado
        page1.drawText(studentName, {
          x: page1.getWidth() / 2 - customFont.widthOfTextAtSize(studentName, 48) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 + 50 - positions.studentName.y, // Ajustado para cima para dar espaço ao texto do curso
          size: 48,
          font: customFont,
          color: rgb(0, 0, 0)
        });

        // Texto do curso concluído
        const courseText1 = `concluiu com êxito o curso de ${status.course.name} oferecido.`;
        page1.drawText(courseText1, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText1, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - positions.studentName.y, // Posicionado abaixo do nome
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        // Nome do curso em negrito
        const courseText2 = `por Master Key - Centro de Treinamento e Desenvolvimento`
        page1.drawText(courseText2, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText2, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 15 - positions.studentName.y, // Posicionado abaixo do texto anterior
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText3 =  `Profissional, com carga horária de ${status.course.workHours} horas. Durante sua`;
        page1.drawText(courseText3, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText3, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 30 - positions.studentName.y, // Posicionado abaixo do texto anterior
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText4 =  `participação no curso, demonstrou um notável`;
        page1.drawText(courseText4, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText4, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 45 - positions.studentName.y, // Posicionado abaixo do texto anterior
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText5 =  `comprometimento e dedicação, destacando-se pelo empenho`;
        page1.drawText(courseText5, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText5, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 60 - positions.studentName.y, // Posicionado abaixo do texto anterior
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText6 =  `exemplar em todas as atividades propostas, obtendo média`;
        page1.drawText(courseText6, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText6, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 75 - positions.studentName.y, // Posicionado abaixo do texto anterior
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText7 =  `final ${status.averageGrade.toFixed(1)}.`;
        page1.drawText(courseText7, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText7, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 90 - positions.studentName.y, // Posicionado abaixo do texto anterior
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText8 = `${student()?.city}, ${this.formatDateExtensive()}.`;
        page1.drawText(courseText8, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText8, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 120 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
      }

      // 8. Criar segunda página com a imagem de fundo
      const page2 = pdfDoc.addPage([842, 595]);
      page2.drawImage(page2Image, {
        x: 0,
        y: 0,
        width: page2.getWidth(),
        height: page2.getHeight(),
      });

      // Lista de cursos (mantém o código existente para a lista)
      let yPosition = page2.getHeight() - 150;
      const lineSpacing = 40;
      const bulletRadius = 6;
      const bulletX = 100;

      this.courseStatus().forEach((courseStatus) => {
        // Bullet point
        page2.drawCircle({
          x: bulletX,
          y: yPosition + 6,
          size: bulletRadius,
          color: rgb(0.5, 0, 0),
          opacity: 1,
        });

        // Nome do curso
        const courseName = courseStatus.course.name;
        const textWidth = regularFont.widthOfTextAtSize(courseName, 29);

        page2.drawText(courseName, {
          x: page2.getWidth() - textWidth - 100,
          y: yPosition,
          size: 29,
          font: regularFont,
          color: rgb(0.5, 0, 0),
        });

        yPosition -= lineSpacing;
      });

      // 10. Gerar e baixar PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = `certificado_${student()?.name}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase() + '.pdf';

      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);
      this.notificationService.success('Certificado gerado com sucesso!');

    } catch (error) {
      console.error('Erro na geração do documento:', error);
      this.notificationService.error(
        error instanceof Error
          ? error.message
          : 'Erro ao gerar o documento'
      );
    } finally {
      this.loadingService.hide();
    }
  }
}
