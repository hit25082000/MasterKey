import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../features/course/services/course.service';
import { Course } from '../../../core/models/course.model';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-course-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preview-container" *ngIf="course()">
      <div class="course-header">
        <img [src]="course()!.image" [alt]="course()!.name">
        <div class="course-info">
          <h1>{{ course()!.name }}</h1>
          <p class="description">{{ course()!.description }}</p>
          <div class="price">R$ {{ course()!.price | number:'1.2-2' }}</div>
        </div>
      </div>

      <div class="course-content">    
        <div class="payment-section">
          <h2>Escolha a forma de pagamento</h2>
          <div class="payment-buttons">
            <button (click)="processPayment('PIX')" class="payment-button pix">
              <i class="fas fa-qrcode"></i>
              Pagar com PIX
            </button>
            <button (click)="processPayment('CREDIT_CARD')" class="payment-button credit-card">
              <i class="fas fa-credit-card"></i>
              Pagar com Cartão
            </button>
            <button (click)="processPayment('BOLETO')" class="payment-button boleto">
              <i class="fas fa-barcode"></i>
              Pagar com Boleto
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .course-header {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
      margin-bottom: 2rem;

      img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 8px;
      }

      .course-info {
        h1 {
          margin: 0 0 1rem;
          color: #333;
        }

        .description {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .price {
          font-size: 2rem;
          font-weight: bold;
          color: #384A87;
        }
      }
    }

    .course-content {
      .content-section,
      .requirements-section {
        margin-bottom: 2rem;

        h2 {
          color: #333;
          margin-bottom: 1rem;
        }

        ul {
          list-style: none;
          padding: 0;

          li {
            padding: 0.5rem 0;
            color: #666;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            &:before {
              content: "✓";
              color: #384A87;
            }
          }
        }
      }

      .payment-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #eee;

        h2 {
          text-align: center;
          margin-bottom: 2rem;
        }

        .payment-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;

          .payment-button {
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.1rem;
            transition: all 0.3s ease;

            &.pix {
              background: #32BCAD;
              color: white;
              &:hover { background: #2a9d91; }
            }

            &.credit-card {
              background: #384A87;
              color: white;
              &:hover { background: #2d3a6d; }
            }

            &.boleto {
              background: #6C757D;
              color: white;
              &:hover { background: #5a6268; }
            }

            i {
              font-size: 1.2rem;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .course-header {
        grid-template-columns: 1fr;
      }

      .payment-section .payment-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class CoursePreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);

  course = signal<Course | null>(null);

  async ngOnInit() {
    const courseId = this.route.snapshot.params['id'];
    if (!courseId) {
      this.notificationService.error('Curso não encontrado');
      this.router.navigate(['/courses']);
      return;
    }

    try {
      const course = await this.courseService.getById(courseId);
      this.course.set(course);
    } catch (error) {
      this.notificationService.error('Erro ao carregar o curso');
      this.router.navigate(['/courses']);
    }
  }

  async processPayment(paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO') {
    if (!this.course()) {
      this.notificationService.error('Curso não encontrado');
      return;
    }

    this.loadingService.show();

    try {
      const response = await firstValueFrom(this.paymentService.processPayment(
        this.course()!.price,
        this.course()!.id!,
        paymentMethod
      ));

      if (response.status === 'CONFIRMED') {
        this.notificationService.success('Pagamento confirmado com sucesso!');
        this.router.navigate(['/admin/courses', this.course()!.id]);
      } else if (response.billingType === 'PIX') {
        this.notificationService.info('QR Code PIX gerado. Escaneie para pagar.');
        window.open(response.pixQrCodeUrl, '_blank');
      } else if (response.billingType === 'BOLETO') {
        this.notificationService.info('Boleto gerado. Clique para visualizar.');
        window.open(response.bankSlipUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      this.notificationService.error('Erro ao processar pagamento');
    } finally {
      this.loadingService.hide();
    }
  }
}
