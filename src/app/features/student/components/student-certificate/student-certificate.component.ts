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
  modules: {
    name: string;
    description: string;
    completionPercentage: number;
    averageGrade: number;
  }[];
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
                  <div class="modules-list">
                    <h4>Módulos:</h4>
                    @for (module of status.modules; track module.name) {
                      <div class="module-item">
                        <span>{{ module.name }}</span>
                        <span>Progresso: {{ module.completionPercentage }}%</span>
                        @if (module.averageGrade > 0) {
                          <span>Média: {{ module.averageGrade.toFixed(1) }}</span>
                        }
                      </div>
                    }
                  </div>
                  <div class="course-summary">
                    <p>Progresso Total: {{ status.completionPercentage }}%</p>
                    @if (status.totalExams > 0) {
                      <p>Média Geral: {{ status.averageGrade.toFixed(1) }}</p>
                      <p>Provas: {{ status.completedExams }}/{{ status.totalExams }}</p>
                    }
                  </div>
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
    effect(() => {
      const id = this.studentId();
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
        const watchedVideos = await this.studentService.getWatchedVideos(studentId, courseId);

        const modules = course.modules.map(module => {
          const moduleVideos = module.videos.filter(video => video.active);
          const moduleWatchedVideos = moduleVideos.filter(video => 
            watchedVideos.includes(video.videoId)
          );
          
          const totalVideos = moduleVideos.length;
          const watchedCount = moduleWatchedVideos.length;
          
          const moduleExams = exams.filter(exam => exam.moduleId === module.name);
          const moduleStudentExams = moduleExams.flatMap(exam => 
            studentExams.filter(studentExam => studentExam.examId === exam.id)
          );
          
          const totalModuleExams = moduleExams.length;
          const completedModuleExams = moduleStudentExams.length;
          
          let moduleAverageGrade = 0;
          if (completedModuleExams > 0) {
            const totalGrades = moduleStudentExams.reduce((acc, exam) => {
              const grade = Number(exam.score);
              return acc + (isNaN(grade) ? 0 : grade);
            }, 0);
            moduleAverageGrade = Number((totalGrades / completedModuleExams).toFixed(1));
          }

          const videosProgress = totalVideos === 0 ? 100 : 
            Math.round((watchedCount / totalVideos) * 100);
          
          const examsProgress = totalModuleExams === 0 ? 100 : 
            Math.round((completedModuleExams / totalModuleExams) * 100);
          
          const moduleCompletionPercentage = Math.round((videosProgress + examsProgress) / 2);

          return {
            name: module.name,
            description: module.description,
            completionPercentage: moduleCompletionPercentage,
            averageGrade: moduleAverageGrade
          };
        });

        const totalExams = exams.length;
        const completedExams = studentExams.length;

        let averageGrade = 0;
        if (completedExams > 0) {
          const totalGrades = studentExams.reduce((acc, exam) => {
            const grade = Number(exam.score);
            return acc + (isNaN(grade) ? 0 : grade);
          }, 0);
          averageGrade = Number((totalGrades / completedExams).toFixed(1));
        }

        const completionPercentage = modules.length === 0 ? 0 : 
          Math.round(
            modules.reduce((acc, module) => acc + module.completionPercentage, 0) / modules.length
          );

        const isCompleted = averageGrade >= 7 && completionPercentage === 100;

        return {
          course,
          modules,
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

      const pdfDoc = await PDFDocument.create();

      pdfDoc.registerFontkit(fontkit);

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

      const [page1Image, page2Image] = await Promise.all([
        pdfDoc.embedPng(page1ImageBytes),
        pdfDoc.embedPng(page2ImageBytes)
      ]);

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
        customFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      }

      const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      const page1 = pdfDoc.addPage([842, 595]);
      page1.drawImage(page1Image, {
        x: 0,
        y: 0,
        width: page1.getWidth(),
        height: page1.getHeight(),
      });

      const studentName = student()?.name;
      if (studentName) {
        page1.drawText(studentName, {
          x: page1.getWidth() / 2 - customFont.widthOfTextAtSize(studentName, 48) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 + 50 - positions.studentName.y,
          size: 48,
          font: customFont,
          color: rgb(0, 0, 0)
        });

        const courseText1 = `concluiu com êxito o curso de ${status.course.name} oferecido`;
        page1.drawText(courseText1, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText1, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText2 = `por Master Key - Centro de Treinamento e Desenvolvimento`;
        page1.drawText(courseText2, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText2, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 15 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText3 = `Profissional, com carga horária de ${status.course.workHours} horas. Durante sua`;
        page1.drawText(courseText3, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText3, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 30 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText4 = `participação no curso, demonstrou um notável`;
        page1.drawText(courseText4, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText4, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 45 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText5 = `comprometimento e dedicação, destacando-se pelo empenho`;
        page1.drawText(courseText5, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText5, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 60 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText6 = `exemplar em todas as atividades propostas, obtendo média`;
        page1.drawText(courseText6, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText6, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 75 - positions.studentName.y,
          size: 14,
          font: regularFont,
          color: rgb(0, 0, 0)
        });

        const courseText7 = `final ${status.averageGrade.toFixed(1)}.`;
        page1.drawText(courseText7, {
          x: page1.getWidth() / 2 - regularFont.widthOfTextAtSize(courseText7, 14) / 2 + positions.studentName.x,
          y: page1.getHeight() / 2 - 90 - positions.studentName.y,
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

      const page2 = pdfDoc.addPage([842, 595]);
      page2.drawImage(page2Image, {
        x: 0,
        y: 0,
        width: page2.getWidth(),
        height: page2.getHeight(),
      });

      let yPosition = page2.getHeight() - 150;
      const lineSpacing = 40;
      const bulletRadius = 6;
      const bulletX = 100;

      const modulesTitle = 'Módulos Concluídos';
      page2.drawText(modulesTitle, {
        x: page2.getWidth() / 2 - regularFont.widthOfTextAtSize(modulesTitle, 24) / 2,
        y: yPosition + 40,
        size: 24,
        font: regularFont,
        color: rgb(0.5, 0, 0),
      });

      yPosition -= 20;

      status.modules.forEach((module) => {
        page2.drawCircle({
          x: bulletX,
          y: yPosition + 6,
          size: bulletRadius,
          color: rgb(0.5, 0, 0),
          opacity: 1,
        });

        const moduleName = module.name;
        page2.drawText(moduleName, {
          x: bulletX + 20,
          y: yPosition,
          size: 16,
          font: regularFont,
          color: rgb(0.5, 0, 0),
        });

        if (module.averageGrade > 0) {
          const gradeText = `Média: ${module.averageGrade.toFixed(1)}`;
          page2.drawText(gradeText, {
            x: page2.getWidth() - regularFont.widthOfTextAtSize(gradeText, 14) - 100,
            y: yPosition,
            size: 14,
            font: regularFont,
            color: rgb(0.5, 0, 0),
          });
        }

        yPosition -= lineSpacing;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = `certificado_${student()?.name}_${status.course.name}`
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
