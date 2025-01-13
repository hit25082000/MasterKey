import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../course/services/course.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaymentService } from '../../../../pages/ecommerce/products/services/payment.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { firstValueFrom } from 'rxjs';
import { Course } from '../../../../core/models/course.model';

@Component({
  selector: 'app-course-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="checkout-page">
      <div class="checkout-container" *ngIf="course()">
        <h2>Checkout do Curso</h2>
        
        <div class="course-info">
          <div class="course-image">
            <img [src]="course()!.image" [alt]="course()!.name">
          </div>
          <div class="course-details">
            <h3>{{ course()!.name }}</h3>
            <p class="description">{{ course()!.description }}</p>
            <div class="price-tag">
              <span class="label">Valor Total:</span>
              <span class="price">R$ {{ course()!.price | number:'1.2-2' }}</span>
              <span class="installments" *ngIf="course()!.portionCount > 1">
                ou {{ course()!.portionCount }}x de R$ {{ (course()!.price / course()!.portionCount) | number:'1.2-2' }}
              </span>
            </div>
          </div>
        </div>

        <div class="payment-methods">
          <h3>Escolha a forma de pagamento:</h3>
          
          <button (click)="processPayment('PIX')" class="payment-button pix">
            <div class="button-content">
              <i class="fas fa-qrcode"></i>
              <div class="button-text">
                <span class="main-text">Pagar com PIX</span>
                <span class="sub-text">Aprovação instantânea</span>
              </div>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </button>

          <button (click)="processPayment('CREDIT_CARD')" class="payment-button credit-card">
            <div class="button-content">
              <i class="fas fa-credit-card"></i>
              <div class="button-text">
                <span class="main-text">Cartão de Crédito</span>
                <span class="sub-text">Até {{ course()!.portionCount }}x sem juros</span>
              </div>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </button>

          <button (click)="processPayment('BOLETO')" class="payment-button boleto">
            <div class="button-content">
              <i class="fas fa-barcode"></i>
              <div class="button-text">
                <span class="main-text">Boleto Bancário</span>
                <span class="sub-text">Vencimento em 3 dias úteis</span>
              </div>
            </div>
            <i class="fas fa-chevron-right arrow"></i>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    $color-primary: #384A87;
    $color-secondary: #ee3c48;

    :host {
      display: block;
      min-height: calc(100vh - 80px);
    }

    .checkout-page {
      min-height: calc(100vh - 80px);
      padding: 4rem 0;
      background: linear-gradient(90deg, rgba(238, 60, 72, 0.2) 0%, rgba(56, 74, 135, 0.2) 100%), #000000;
    }

    .checkout-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 4px 4px 25px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(20px);
      border-radius: 8px;

      h2 {
        color: #fff;
        font-size: 2rem;
        margin-bottom: 2rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        
        &:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 3px;
          background: $color-secondary;
          border-radius: 2px;
        }
      }

      .course-info {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        .course-image {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          
          &:before {
            content: '';
            display: block;
            padding-top: 66.67%;
          }

          img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;

            &:hover {
              transform: scale(1.05);
            }
          }
        }

        .course-details {
          h3 {
            color: #fff;
            font-size: 1.8rem;
            margin-bottom: 1rem;
            line-height: 1.3;
          }

          .description {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }

          .price-tag {
            background: rgba(56, 74, 135, 0.3);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid rgba(56, 74, 135, 0.5);

            .label {
              display: block;
              color: rgba(255, 255, 255, 0.8);
              font-size: 0.9rem;
              margin-bottom: 0.5rem;
            }

            .price {
              display: block;
              color: #fff;
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }

            .installments {
              display: block;
              color: rgba(255, 255, 255, 0.8);
              font-size: 0.9rem;
            }
          }
        }
      }

      .payment-methods {
        h3 {
          color: #fff;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
          text-align: center;
        }

        .payment-button {
          width: 100%;
          padding: 1.2rem;
          margin-bottom: 1rem;
          border: none;
          border-radius: 12px;
          background: rgba(56, 74, 135, 0.3);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          border: 1px solid rgba(56, 74, 135, 0.5);

          .button-content {
            display: flex;
            align-items: center;
            gap: 1rem;

            i {
              font-size: 1.5rem;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
            }

            .button-text {
              text-align: left;

              .main-text {
                display: block;
                font-weight: 500;
                margin-bottom: 0.2rem;
              }

              .sub-text {
                display: block;
                font-size: 0.8rem;
                opacity: 0.8;
              }
            }
          }

          .arrow {
            font-size: 1rem;
            opacity: 0.5;
            transition: transform 0.3s ease;
          }

          &:hover {
            background: rgba(56, 74, 135, 0.5);
            transform: translateY(-2px);

            .arrow {
              transform: translateX(5px);
              opacity: 1;
            }
          }

          &:active {
            transform: translateY(0);
          }

          &.pix {
            border-color: rgba(0, 255, 0, 0.3);
            i:first-child {
              color: #32BCAD;
            }
          }

          &.credit-card {
            border-color: rgba(255, 255, 255, 0.3);
            i:first-child {
              color: #FFD700;
            }
          }

          &.boleto {
            border-color: rgba(238, 60, 72, 0.3);
            i:first-child {
              color: #ee3c48;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .checkout-container {
        margin: 1rem;
        padding: 1.5rem;

        .course-info {
          grid-template-columns: 1fr;

          .course-image {
            max-width: 100%;
            margin: 0 auto;
          }
        }

        .payment-button {
          padding: 1rem;

          .button-content {
            i {
              width: 30px;
              height: 30px;
              font-size: 1.2rem;
            }
          }
        }
      }
    }
  `]
})
export class CourseCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private loadingService = inject(LoadingService);

  course = signal<Course | null>(null);
  isLoading = signal(false);

  async ngOnInit() {
    const courseId = this.route.snapshot.params['id'];
    if (!courseId) {
      this.notificationService.error('Curso não encontrado');
      this.router.navigate(['/courses']);
      return;
    }

    try {
      this.course.set(await this.courseService.getById(courseId));
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
