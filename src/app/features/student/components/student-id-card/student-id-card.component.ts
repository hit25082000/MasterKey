import { Component, effect, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Student } from '../../../../core/models/student.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminService } from '../../../../core/services/admin.service';

const positions = {
  studentName: { x: 240, y: 645 },
  courses: { x: 243, y: 623 },
  RA: {x: 208, y: 600},
  validUntil: { x: 255, y: 557 },
  photo: { x: 45, y: 553, width: 114, height: 195 }
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
              <img #studentPhoto [src]="student()?.profilePic" alt="Foto do estudante" />
            } @else {
              <div class="no-photo">
                <i class="fas fa-user"></i>
              </div>
            }
          </div>
          <div class="info-details">
            <h3>{{ student()?.name }}</h3>
            <p>RA: {{ student()?.ra }}</p>
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
  @ViewChild('studentPhoto') studentPhoto?: ElementRef<HTMLImageElement>;
  
  private studentService = inject(StudentService);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);

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
    const validUntil = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    return validUntil.toLocaleDateString('pt-BR');
  }

  private async waitForImageLoad(img: HTMLImageElement): Promise<void> {
    if (img.complete) return;
    
    return new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    });
  }

  private async imageToBytes(img: HTMLImageElement): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
    canvas.width = positions.photo.width;
    canvas.height = positions.photo.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter contexto 2d do canvas');
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    const base64Data = imageData.split(',')[1];
    
    return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  }

  async generateIdCard() {
    if (!this.student()) return;

    this.loadingService.show();
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      // Criar página A4 em modo retrato
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Carregar imagens de fundo
      const frontResponse = await fetch('assets/carteirinha frente.png');
      const backResponse = await fetch('assets/carteirinha verso.png');
      const frontBytes = await frontResponse.arrayBuffer();
      const backBytes = await backResponse.arrayBuffer();
      
      const frontImage = await pdfDoc.embedPng(frontBytes);
      const backImage = await pdfDoc.embedPng(backBytes);

      // Dimensões para as imagens de fundo
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const cardHeight = pageHeight / 2;

      // Desenhar frente da carteirinha
      page.drawImage(frontImage, {
        x: 0,
        y: cardHeight,
        width: pageWidth,
        height: cardHeight
      });

      // Desenhar verso da carteirinha
      page.drawImage(backImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: cardHeight
      });

      const studentData = this.student()!;

      // Adicionar foto do estudante se disponível
      if (studentData.id) {
        try {
          // Fazer download da imagem através do AdminService
          const imageBytes = await new Promise<Uint8Array>((resolve, reject) => {
            this.adminService.downloadImage(studentData.id).subscribe({
              next: (arrayBuffer) => {
                resolve(new Uint8Array(arrayBuffer));
              },
              error: (error) => {
                console.error('Erro ao baixar imagem:', error);
                reject(error);
              }
            });
          });
          
          // Incorporar a imagem no PDF
          const image = await pdfDoc.embedJpg(imageBytes);
          
          page.drawImage(image, {
            x: positions.photo.x,
            y: positions.photo.y,
            width: positions.photo.width,
            height: positions.photo.height,
          });
        } catch (error) {
          console.error('Erro ao processar foto do estudante:', error);
          this.notificationService.error('Não foi possível incluir a foto na carteirinha');
        }
      }

      // Adicionar informações do estudante com fonte ajustada
      page.drawText(studentData.name.toUpperCase(), {
        x: positions.studentName.x,
        y: positions.studentName.y,
        size: 20,
        font: font,
        color: rgb(1, 1, 1),
        maxWidth: 300,
        lineHeight: 22
      });

      page.drawText(studentData.ra || studentData.id, {
        x: positions.RA.x,
        y: positions.RA.y,
        size: 20,
        font: font,
        color: rgb(1, 1, 1),
        maxWidth: 300
      });

      page.drawText(studentData.courses?.[0].toUpperCase() || 'CURSO NÃO INFORMADO', {
        x: positions.courses.x,
        y: positions.courses.y,
        size: 20,
        font: font,
        color: rgb(1, 1, 1),
        maxWidth: 300,
        lineHeight: 18
      });

      page.drawText(`${this.getValidityDate()}`, {
        x: positions.validUntil.x,
        y: positions.validUntil.y,
        size: 20,
        font: font,
        color: rgb(1, 1, 1),
        maxWidth: 300
      });

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
