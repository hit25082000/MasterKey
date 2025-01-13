import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AsaasService } from '../../../../shared/services/asaas.service';
import { AsaasPaymentResponse } from '../../../../shared/models/asaas.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-student-financial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="financial-container">
      <h2>Financeiro</h2>

      @if (loading()) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando pagamentos...</p>
        </div>
      } @else {
        <div class="summary">
          <div class="summary-card">
            <i class="fas fa-clock"></i>
            <div>
              <h3>Pagamentos Pendentes</h3>
              <p>{{ pendingCount() }}</p>
            </div>
          </div>
          <div class="summary-card">
            <i class="fas fa-check-circle"></i>
            <div>
              <h3>Pagamentos Confirmados</h3>
              <p>{{ paidCount() }}</p>
            </div>
          </div>
        </div>

        <div class="payments-list">
          @for (payment of payments(); track payment.id) {
            <div class="payment-card" [class]="getStatusClass(payment.status)">
              <div class="payment-info">
                <h4>{{ payment.description }}</h4>
                <p class="date">Vencimento: {{ payment.dueDate | date:'dd/MM/yyyy' }}</p>
                @if (payment.paymentDate) {
                  <p class="paid-date">Pago em: {{ payment.paymentDate | date:'dd/MM/yyyy' }}</p>
                }
              </div>
              <div class="payment-status">
                <span class="status-badge">{{ getStatusLabel(payment.status) }}</span>
                <p class="amount">R$ {{ payment.value | number:'1.2-2' }}</p>
              </div>
              @if (payment.status === 'PENDING') {
                <div class="payment-actions">
                  @if (payment.pixQrCodeUrl) {
                    <button class="btn-pay" (click)="openPaymentLink(payment.pixQrCodeUrl)">
                      <i class="fas fa-qrcode"></i>
                      Pagar com PIX
                    </button>
                  }
                  @if (payment.bankSlipUrl) {
                    <button class="btn-pay" (click)="openPaymentLink(payment.bankSlipUrl)">
                      <i class="fas fa-barcode"></i>
                      Ver Boleto
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .financial-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;

      h2 {
        color: #384A87;
        margin-bottom: 2rem;
      }
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;

      i {
        font-size: 2rem;
        margin-bottom: 1rem;
      }
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;

      .summary-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 1rem;

        i {
          font-size: 2rem;
          color: #384A87;
        }

        h3 {
          margin: 0;
          font-size: 1rem;
          color: #666;
        }

        p {
          margin: 0.5rem 0 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #384A87;
        }
      }
    }

    .payments-list {
      .payment-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;

        &.status-pending {
          border-left: 4px solid #ffc107;
        }

        &.status-confirmed {
          border-left: 4px solid #28a745;
        }

        &.status-overdue {
          border-left: 4px solid #dc3545;
        }

        .payment-info {
          flex: 1;

          h4 {
            margin: 0;
            color: #333;
          }

          .date {
            margin: 0.5rem 0 0;
            color: #666;
            font-size: 0.9rem;
          }

          .paid-date {
            color: #28a745;
            font-size: 0.9rem;
            margin: 0.25rem 0 0;
          }
        }

        .payment-status {
          text-align: right;

          .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }

          .amount {
            margin: 0;
            font-weight: bold;
            color: #384A87;
            font-size: 1.2rem;
          }
        }

        .payment-actions {
          .btn-pay {
            background: #384A87;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;

            &:hover {
              background: darken(#384A87, 10%);
              transform: translateY(-2px);
            }

            i {
              font-size: 1rem;
            }
          }
        }
      }
    }

    .status-badge {
      &.PENDING {
        background: #fff3cd;
        color: #856404;
      }

      &.CONFIRMED, &.RECEIVED {
        background: #d4edda;
        color: #155724;
      }

      &.OVERDUE {
        background: #f8d7da;
        color: #721c24;
      }

      &.REFUNDED {
        background: #cce5ff;
        color: #004085;
      }
    }

    @media (max-width: 768px) {
      .payment-card {
        flex-direction: column;
        align-items: flex-start !important;

        .payment-status {
          text-align: left !important;
          width: 100%;
          margin: 1rem 0;
        }

        .payment-actions {
          width: 100%;
          
          .btn-pay {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }
  `]
})
export class StudentFinancialComponent {
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private asaasService = inject(AsaasService);

  loading = signal<boolean>(false);
  payments = signal<AsaasPaymentResponse[]>([]);

  pendingCount = computed(() => 
    this.payments().filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').length
  );

  paidCount = computed(() => 
    this.payments().filter(p => p.status === 'CONFIRMED' || p.status === 'RECEIVED').length
  );

  constructor() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loadPayments(user.id);
    }
  }

  private async loadPayments(userId: string) {
    this.loading.set(true);
    try {
      // TODO: Implementar método no AsaasService para buscar pagamentos por customer
      const payments = await firstValueFrom(this.asaasService.getCustomerPayments(userId));
      this.payments.set(payments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      this.notificationService.error('Erro ao carregar informações financeiras');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'RECEIVED': 'Recebido',
      'OVERDUE': 'Vencido',
      'REFUNDED': 'Reembolsado',
      'RECEIVED_IN_CASH': 'Recebido em Dinheiro'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  openPaymentLink(url?: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
