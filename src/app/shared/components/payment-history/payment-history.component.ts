import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipListbox } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService } from '../../../core/services/payment.service';
import { ActivatedRoute } from '@angular/router';
import { 
  PaymentTransaction, 
  Subscription,
  PaymentStatusTranslation,
  PaymentMethodTranslation,
  SubscriptionStatusTranslation,
  SubscriptionCycleTranslation
} from '../../../core/interfaces/payment.interface';
import { Observable, of } from 'rxjs';
import { getAuth } from '@angular/fire/auth';
import { environment } from '../../../../environments/environment';

// Dados mockados para teste
const MOCK_PAYMENTS: PaymentTransaction[] = [
  {
    id: '1',
    customerId: 'customer1',
    customerName: 'João Silva',
    customerEmail: 'joao@email.com',
    customerPhone: '11999999999',
    courseId: 'course1',
    paymentId: 'pay_123',
    amount: 199.90,
    status: 'CONFIRMED',
    paymentMethod: 'PIX',
    type: 'PAYMENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentDetails: {
      description: 'Curso de Angular Avançado',
      pixQrCodeUrl: 'https://via.placeholder.com/150',
      pixCopiaECola: '00020126580014br.gov.bcb.pix0136a629532e-7831-4c76-a88f-5e6919b67'
    }
  },
  {
    id: '2',
    customerId: 'customer1',
    customerName: 'João Silva',
    customerEmail: 'joao@email.com',
    customerPhone: '11999999999',
    courseId: 'course2',
    paymentId: 'pay_456',
    amount: 299.90,
    status: 'PENDING',
    paymentMethod: 'BOLETO',
    type: 'PAYMENT',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    paymentDetails: {
      description: 'Curso de React Native',
      bankSlipUrl: 'https://exemplo.com/boleto'
    }
  },
  {
    id: '3',
    customerId: 'customer1',
    customerName: 'João Silva',
    customerEmail: 'joao@email.com',
    customerPhone: '11999999999',
    courseId: 'course3',
    paymentId: 'pay_789',
    amount: 1499.90,
    status: 'CONFIRMED',
    paymentMethod: 'CREDIT_CARD',
    type: 'PAYMENT',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    paymentDetails: {
      description: 'Curso de Data Science (12x R$ 124,99)',
      invoiceUrl: 'https://exemplo.com/fatura',
      installments: {
        total: 12,
        current: 1,
        value: 124.99
      }
    }
  },
  {
    id: '4',
    customerId: 'customer1',
    customerName: 'João Silva',
    customerEmail: 'joao@email.com',
    customerPhone: '11999999999',
    courseId: 'course4',
    paymentId: 'pay_101',
    amount: 89.90,
    status: 'RECEIVED',
    paymentMethod: 'CREDIT_CARD',
    type: 'SUBSCRIPTION',
    subscriptionId: 'sub_123',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    paymentDetails: {
      description: 'Assinatura Premium - Pagamento Mensal',
      invoiceUrl: 'https://exemplo.com/fatura-recorrente'
    }
  }
];

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    courseId: 'course3',
    courseName: 'Assinatura Premium',
    customerId: 'customer1',
    customerEmail: 'joao@email.com',
    asaasSubscriptionId: 'sub_123',
    value: 89.90,
    cycle: 'MONTHLY',
    paymentMethod: 'CREDIT_CARD',
    status: 'ACTIVE',
    nextDueDate: new Date(Date.now() + 28 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionDetails: {
      description: 'Assinatura Premium - Acesso a todos os cursos',
      paymentHistory: [
        {
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          status: 'RECEIVED',
          value: 89.90
        },
        {
          date: new Date(Date.now() - 32 * 86400000).toISOString(),
          status: 'RECEIVED',
          value: 89.90
        },
        {
          date: new Date(Date.now() - 62 * 86400000).toISOString(),
          status: 'RECEIVED',
          value: 89.90
        }
      ]
    }
  },
  {
    id: '2',
    courseId: 'course4',
    courseName: 'Plano Anual Premium',
    customerId: 'customer1',
    customerEmail: 'joao@email.com',
    asaasSubscriptionId: 'sub_456',
    value: 899.90,
    cycle: 'YEARLY',
    paymentMethod: 'CREDIT_CARD',
    status: 'ACTIVE',
    nextDueDate: new Date(Date.now() + 335 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionDetails: {
      description: 'Plano Anual Premium - Economia de 50%',
      installments: {
        total: 12,
        current: 1,
        value: 74.99
      },
      paymentHistory: [
        {
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          status: 'RECEIVED',
          value: 74.99,
          installment: 1
        }
      ]
    }
  }
];

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatChipListbox,
    MatExpansionModule,
    MatSnackBarModule
  ],
  template: `
    <div class="history-container">
      <mat-tab-group animationDuration="500ms" class="custom-tabs">
        <!-- Aba de Pagamentos -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">receipt</mat-icon>
            <span>Pagamentos</span>
          </ng-template>
          
          <div class="payments-container">
            <mat-card *ngFor="let payment of payments$ | async" class="payment-card animate-in">
              <mat-card-header>
                <mat-icon mat-card-avatar [class]="'payment-icon ' + payment.paymentMethod.toLowerCase()">
                  {{ 
                    payment.paymentMethod === 'PIX' ? 'qr_code_2' :
                    payment.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'receipt_long'
                  }}
                </mat-icon>
                <mat-card-title>{{ payment.paymentDetails.description || 'Pagamento #' + payment.paymentId }}</mat-card-title>
                <mat-card-subtitle>
                  {{ payment.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="payment-info">
                  <div class="info-row">
                    <span class="label">Valor:</span>
                    <span class="value">R$ {{ payment.amount | number:'1.2-2' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Método:</span>
                    <span class="value method">{{ getPaymentMethodTranslation(payment.paymentMethod) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <mat-chip-set>
                      <mat-chip [class]="'status-chip ' + payment.status.toLowerCase()" 
                               [color]="getStatusColor(payment.status)" 
                               selected>
                        {{ getPaymentStatusTranslation(payment.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>

                <mat-expansion-panel class="custom-expansion">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>info</mat-icon>
                      Detalhes do Pagamento
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="payment-details">
                    <div *ngIf="payment.paymentDetails.bankSlipUrl" class="detail-item">
                      <mat-icon>description</mat-icon>
                      <a [href]="payment.paymentDetails.bankSlipUrl" target="_blank" mat-button color="primary">
                        Ver Boleto
                      </a>
                    </div>

                    <div *ngIf="payment.paymentDetails.pixQrCodeUrl" class="detail-item pix-details">
                      <div class="qr-container">
                        <img [src]="payment.paymentDetails.pixQrCodeUrl" alt="QR Code PIX">
                      </div>
                      <div class="pix-code">
                        <p>Código PIX:</p>
                        <pre>{{ payment.paymentDetails.pixCopiaECola }}</pre>
                        <button mat-button color="primary" (click)="copyToClipboard(payment.paymentDetails.pixCopiaECola)">
                          <mat-icon>content_copy</mat-icon> Copiar código
                        </button>
                      </div>
                    </div>

                    <div *ngIf="payment.paymentDetails.invoiceUrl" class="detail-item">
                      <mat-icon>receipt</mat-icon>
                      <a [href]="payment.paymentDetails.invoiceUrl" target="_blank" mat-button color="primary">
                        Ver Fatura
                      </a>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Aba de Assinaturas -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">subscriptions</mat-icon>
            <span>Assinaturas</span>
          </ng-template>
          
          <div class="subscriptions-container">
            <mat-card *ngFor="let subscription of subscriptions$ | async" class="subscription-card animate-in">
              <mat-card-header>
                <mat-icon mat-card-avatar class="subscription-icon">
                  {{ subscription.status === 'ACTIVE' ? 'auto_renew' : 'schedule' }}
                </mat-icon>
                <mat-card-title>{{ subscription.courseName }}</mat-card-title>
                <mat-card-subtitle>
                  Assinatura #{{ subscription.asaasSubscriptionId }}
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="subscription-info">
                  <div class="info-row">
                    <span class="label">Valor Mensal:</span>
                    <span class="value">R$ {{ subscription.value | number:'1.2-2' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Ciclo:</span>
                    <span class="value">{{ getSubscriptionCycleTranslation(subscription.cycle) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Próximo Vencimento:</span>
                    <span class="value">{{ subscription.nextDueDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Método:</span>
                    <span class="value method">{{ getPaymentMethodTranslation(subscription.paymentMethod) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <mat-chip-set>
                      <mat-chip [class]="'status-chip ' + subscription.status.toLowerCase()" 
                               [color]="getSubscriptionStatusColor(subscription.status)" 
                               selected>
                        {{ getSubscriptionStatusTranslation(subscription.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>

                  <!-- Novo: Progresso das Parcelas -->
                  <div class="installments-progress" *ngIf="subscription.subscriptionDetails?.installments">
                    <div class="progress-header">
                      <span class="label">Progresso das Parcelas:</span>
                      <span class="value">
                        {{ getCompletedInstallments(subscription) }}/{{ subscription.subscriptionDetails.installments!.total }}
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" 
                           [style.width.%]="getInstallmentsProgress(subscription)">
                      </div>
                    </div>
                    <div class="progress-info">
                      {{ getInstallmentsProgress(subscription) }}% concluído
                    </div>
                  </div>
                </div>

                <mat-expansion-panel class="custom-expansion">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon>history</mat-icon>
                      Histórico de Pagamentos
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  
                  <div class="payments-history">
                    <div class="payments-list">
                      <div *ngFor="let payment of subscription.subscriptionDetails?.paymentHistory" 
                           class="payment-history-item">
                        <div class="payment-history-info">
                          <div class="date">
                            <mat-icon>event</mat-icon>
                            {{ payment.date | date:'dd/MM/yyyy' }}
                          </div>
                          <div class="amount">
                            <mat-icon>attach_money</mat-icon>
                            R$ {{ payment.value | number:'1.2-2' }}
                          </div>
                          <div class="installment-info" *ngIf="payment.installment">
                            <mat-icon>payment</mat-icon>
                            Parcela {{ payment.installment }}
                          </div>
                          <mat-chip-set>
                            <mat-chip [class]="'status-chip ' + payment.status.toLowerCase()" 
                                     [color]="getStatusColor(payment.status)" 
                                     selected>
                              {{ getPaymentStatusTranslation(payment.status) }}
                            </mat-chip>
                          </mat-chip-set>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <!-- Template para lista de pagamentos -->
    <ng-template #paymentsList let-payments>
      <div class="payments-list">
        <div *ngFor="let payment of payments" class="payment-history-item">
          <div class="payment-history-info">
            <div class="date">
              <mat-icon>event</mat-icon>
              {{ payment.createdAt | date:'dd/MM/yyyy' }}
            </div>
            <div class="amount">
              <mat-icon>attach_money</mat-icon>
              R$ {{ payment.amount | number:'1.2-2' }}
            </div>
            <mat-chip-set>
              <mat-chip [class]="'status-chip ' + payment.status.toLowerCase()" 
                       [color]="getStatusColor(payment.status)" 
                       selected>
                {{ payment.status }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .history-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .custom-tabs {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tab-icon {
      margin-right: 8px;
    }

    .payments-container, .subscriptions-container {
      padding: 20px;
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .animate-in {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .payment-card, .subscription-card {
      border-radius: 8px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      }
    }

    .payment-icon, .subscription-icon {
      background-color: #f5f5f5;
      border-radius: 50%;
      padding: 8px;
      
      &.pix { color: #32BCAD; }
      &.credit_card { color: #5C6BC0; }
      &.boleto { color: #FFA726; }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;

      .label {
        color: #666;
        font-weight: 500;
      }

      .value {
        font-weight: 600;
        
        &.method {
          padding: 4px 8px;
          border-radius: 4px;
          background: #e9ecef;
          font-size: 0.9em;
        }
      }
    }

    .status-chip {
      min-width: 100px;
      justify-content: center;
      
      &.confirmed, &.received, &.active {
        background-color: #4CAF50 !important;
        color: white;
      }
      
      &.pending {
        background-color: #FFA726 !important;
        color: white;
      }
      
      &.overdue {
        background-color: #f44336 !important;
        color: white;
      }
      
      &.canceled, &.expired {
        background-color: #9E9E9E !important;
        color: white;
      }
    }

    .custom-expansion {
      margin-top: 16px;
      border-radius: 4px;
      
      ::ng-deep .mat-expansion-panel-header {
        padding: 16px;
        
        .mat-expansion-panel-header-title {
          color: #333;
          font-weight: 500;
          
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    }

    .payment-details {
      padding: 16px;

      .detail-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        
        mat-icon {
          margin-right: 8px;
          color: #666;
        }
      }

      .pix-details {
        flex-direction: column;
        align-items: center;
        
        .qr-container {
          margin: 16px 0;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          
          img {
            max-width: 200px;
            height: auto;
          }
        }
        
        .pix-code {
          width: 100%;
          text-align: center;
          
          pre {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            overflow-x: auto;
            margin: 8px 0;
          }
        }
      }
    }

    .payments-history {
      .payment-history-item {
        padding: 16px;
        border-bottom: 1px solid #eee;
        
        &:last-child {
          border-bottom: none;
        }
        
        .payment-history-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          
          .date, .amount {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #666;
            min-width: 150px;
            
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }

          mat-chip-set {
            min-width: 120px;
          }
        }
      }
    }

    .installments-progress {
      margin: 16px 0;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .label {
        color: #666;
        font-weight: 500;
      }

      .value {
        font-weight: 600;
        color: #2196F3;
      }
    }

    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }

    .progress-fill {
      height: 100%;
      background: #2196F3;
      transition: width 0.3s ease;
    }

    .progress-info {
      text-align: center;
      font-size: 0.9em;
      color: #666;
    }

    .installment-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-weight: 500;
    }

    @media (max-width: 600px) {
      .history-container {
        padding: 10px;
      }

      .payments-container, .subscriptions-container {
        grid-template-columns: 1fr;
      }

      .payment-history-info {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start !important;

        .date, .amount {
          min-width: 100% !important;
        }

        mat-chip-set {
          width: 100%;
          display: flex;
          justify-content: flex-start;
        }
      }
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  payments$!: Observable<PaymentTransaction[]>;
  subscriptions$!: Observable<Subscription[]>;
  userId: string = '';

  constructor(
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Primeiro tenta pegar o ID da URL
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = params['id'];
        this.loadUserData();
      } else {
        // Se não houver ID na URL, usa o usuário logado
        const auth = getAuth();
        this.userId = auth.currentUser?.uid || '';
        if (this.userId) {
          this.loadUserData();
        }
      }
    });
  }

  private loadUserData() {
    // Em ambiente de desenvolvimento, use dados mockados
    if (!environment.production) {
      this.payments$ = of(MOCK_PAYMENTS);
      this.subscriptions$ = of(MOCK_SUBSCRIPTIONS);
      return;
    }

    // Em produção, carrega dados reais
    this.payments$ = this.paymentService.getCustomerTransactions(this.userId);
    this.subscriptions$ = this.paymentService.getCustomerSubscriptions(this.userId);
  }

  getSubscriptionPayments(subscriptionId: string): Observable<PaymentTransaction[]> {
    // Retornar alguns pagamentos mockados para a assinatura
    return of(MOCK_PAYMENTS.map(p => ({
      ...p,
      type: 'SUBSCRIPTION' as const,
      subscriptionId: subscriptionId
    })));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'RECEIVED':
      case 'CONFIRMED':
        return 'primary';
      case 'PENDING':
        return 'accent';
      case 'OVERDUE':
        return 'warn';
      default:
        return 'default';
    }
  }

  getSubscriptionStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'primary';
      case 'OVERDUE':
        return 'warn';
      case 'INACTIVE':
      case 'EXPIRED':
      case 'CANCELED':
        return 'default';
      default:
        return 'default';
    }
  }

  copyToClipboard(text: string | undefined) {
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    this.snackBar.open('Código PIX copiado!', 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  getPaymentStatusTranslation(status: string): string {
    return PaymentStatusTranslation[status as keyof typeof PaymentStatusTranslation] || status;
  }

  getPaymentMethodTranslation(method: string): string {
    return PaymentMethodTranslation[method as keyof typeof PaymentMethodTranslation] || method;
  }

  getSubscriptionStatusTranslation(status: string): string {
    return SubscriptionStatusTranslation[status as keyof typeof SubscriptionStatusTranslation] || status;
  }

  getSubscriptionCycleTranslation(cycle: string): string {
    return SubscriptionCycleTranslation[cycle as keyof typeof SubscriptionCycleTranslation] || cycle;
  }

  getCompletedInstallments(subscription: Subscription): number {
    if (!subscription.subscriptionDetails?.paymentHistory) return 0;
    
    return subscription.subscriptionDetails.paymentHistory.filter(
      payment => payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
    ).length;
  }

  getInstallmentsProgress(subscription: Subscription): number {
    if (!subscription.subscriptionDetails?.installments?.total) return 0;
    
    const completed = this.getCompletedInstallments(subscription);
    const total = subscription.subscriptionDetails.installments.total;
    
    return Math.round((completed / total) * 100);
  }
} 