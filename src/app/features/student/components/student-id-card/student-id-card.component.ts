import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Student } from '../../../../core/models/student.model';
import { AuthService } from '../../../../core/services/auth.service';

const positions = {
  name: { x: 343, y: 287 },
  course: { x: 343, y: 323 },
  ra: { x: 343, y: 359 },
  unit: { x: 468, y: 390 },
  validity: { x: 361, y: 422 },
  photo: { x: 71, y: 149, width: 171, height: 290 }
};

@Component({
  selector: 'app-student-id-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="id-card-container">
      <h2>Carteirinha do Estudante</h2>

      @if (loading()) {
        <div class="loading">Carregando dados do estudante...</div>
      } @else if (!student()) {
        <div class="no-student">
          <p>Dados do estudante não encontrados.</p>
        </div>
      } @else {
        <div class="student-info">
          <div class="photo-container">
            @if (student()?.profilePic) {
              <img [src]="student()?.profilePic" alt="Foto do estudante" />
            } @else {
              <div class="no-photo">
                <i class="fas fa-user"></i>
              </div>
            }
          </div>
          <div class="info-details">
            <h3>{{ student()?.name }}</h3>
            <p>Matrícula: {{ student()?.id }}</p>
            <p>Validade: {{ getValidityDate() }}</p>
          </div>
          <button class="btn-generate" (click)="generateIdCard()">
            <i class="fas fa-id-card"></i>
            Gerar Carteirinha
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./student-id-card.component.scss']
})
export class StudentIdCardComponent {
  private studentService = inject(StudentService);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  loading = signal<boolean>(false);
  student = signal<Student | null>(null);

  constructor() {
    effect(() => {
      const id = this.authService.getCurrentUserId();
      if (id) {
        queueMicrotask(() => this.loadStudentData(id));
      }
    }, { allowSignalWrites: true });
  }

  private async loadStudentData(studentId: string) {
    this.loading.set(true);
    try {
      const studentData = await this.studentService.selectStudent(studentId);
      this.student.set(studentData()!);
    } catch (error) {
      this.notificationService.error('Erro ao carregar dados do estudante');
      console.error('Erro ao carregar dados do estudante:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getValidityDate(): string {
    const today = new Date();
    // Se o estudante tiver data de término do curso, use-a, caso contrário use o final do ano atual
    const validUntil = this.student()?.courseEndDate 
      ? new Date(this.student()!.courseEndDate)
      : new Date(today.getFullYear(), 11, 31); // 31 de dezembro do ano atual
    return validUntil.toLocaleDateString('pt-BR');
  }

  async generateIdCard() {
    if (!this.student()) return;

    this.loadingService.show();
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      // Carregar as imagens da carteirinha
      const frontResponse = await fetch('assets/images/carteirinha frente.png');
      const backResponse = await fetch('assets/images/carteirinha verso.png');
      const frontBytes = await frontResponse.arrayBuffer();
      const backBytes = await backResponse.arrayBuffer();

      // Converter as imagens para o formato do PDF
      const frontImage = await pdfDoc.embedPng(frontBytes);
      const backImage = await pdfDoc.embedPng(backBytes);

      // Dimensões das páginas baseadas nas imagens
      const pageWidth = frontImage.width;
      const pageHeight = frontImage.height;

      // Criar páginas com o tamanho das imagens
      const frontPage = pdfDoc.addPage([pageWidth, pageHeight]);
      const backPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // Adicionar imagens de fundo
      frontPage.drawImage(frontImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
      backPage.drawImage(backImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      // Configurar fonte
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 20;
      const textColor = rgb(0, 0.05, 0.2); // Azul escuro

      // Adicionar dados do estudante
      const studentData = this.student()!;
      frontPage.drawText(studentData.name.toUpperCase(), {
        x: positions.name.x,
        y: positions.name.y,
        size: fontSize,
        font,
        color: textColor
      });

      frontPage.drawText(studentData.course.toUpperCase(), {
        x: positions.course.x,
        y: positions.course.y,
        size: fontSize,
        font,
        color: textColor
      });

      frontPage.drawText(studentData.id, {
        x: positions.ra.x,
        y: positions.ra.y,
        size: fontSize,
        font,
        color: textColor
      });

      frontPage.drawText('CAMPO GRANDE', {
        x: positions.unit.x,
        y: positions.unit.y,
        size: fontSize,
        font,
        color: textColor
      });

      frontPage.drawText(this.getValidityDate(), {
        x: positions.validity.x,
        y: positions.validity.y,
        size: fontSize,
        font,
        color: textColor
      });

      // Se houver foto, adicionar ao PDF
      if (studentData.profilePic) {
        try {
          const imageResponse = await fetch(studentData.profilePic);
          const imageBytes = await imageResponse.arrayBuffer();
          const image = await pdfDoc.embedJpg(imageBytes);
          
          frontPage.drawImage(image, {
            x: positions.photo.x,
            y: positions.photo.y,
            width: positions.photo.width,
            height: positions.photo.height
          });
        } catch (error) {
          console.error('Erro ao adicionar foto ao PDF:', error);
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `carteirinha_${studentData.name.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      link.click();

      this.notificationService.success('Carteirinha gerada com sucesso!');
    } catch (error) {
      this.notificationService.error('Erro ao gerar carteirinha');
      console.error('Erro ao gerar carteirinha:', error);
    } finally {
      this.loadingService.hide();
    }
  }
}
