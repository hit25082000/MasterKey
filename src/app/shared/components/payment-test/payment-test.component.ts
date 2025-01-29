import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsaasService } from '../../../core/services/asaas.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentStateService } from '../../../core/services/payment-state.service';
import { WebhookService } from '../../../core/services/webhook.service';
import { PaymentComponent } from '../payment/payment.component';
import { PaymentHistoryComponent } from '../payment-history/payment-history.component';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { PaymentTransaction } from '../../../core/interfaces/payment.interface';

@Component({
  selector: 'app-payment-test',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    PaymentComponent,
    PaymentHistoryComponent
  ],
  template: `
    <div class="test-container">
      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>Teste de Integração de Pagamentos</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Status do Teste -->
          <div class="status-section">
            <h3>Status do Sistema</h3>
            <div class="status-item" [class.active]="isWebhookActive$ | async">
              <mat-icon>{{ (isWebhookActive$ | async) ? 'check_circle' : 'error' }}</mat-icon>
              <span>Webhook Asaas</span>
            </div>
            <div class="status-item" [class.active]="isFirestoreConnected$ | async">
              <mat-icon>{{ (isFirestoreConnected$ | async) ? 'check_circle' : 'error' }}</mat-icon>
              <span>Conexão Firestore</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Componente de Pagamento -->
          <div class="payment-section">
            <h3>Teste de Pagamento</h3>
            <app-payment 
              [courseId]="'TEST_COURSE'"
              [courseValue]="99.90"
              [isRecurring]="false">
            </app-payment>
          </div>

          <mat-divider></mat-divider>

          <!-- Monitor de Eventos -->
          <div class="events-section">
            <h3>Monitor de Eventos</h3>
            <div class="event-list">
              <div *ngFor="let event of paymentEvents$ | async" class="event-item">
                <mat-icon [ngClass]="event.status">{{ getEventIcon(event.type) }}</mat-icon>
                <div class="event-details">
                  <strong>{{ event.type }}</strong>
                  <span>{{ event.message }}</span>
                  <small>{{ event.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</small>
                </div>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Histórico de Pagamentos -->
          <div class="history-section">
            <h3>Histórico de Pagamentos</h3>
            <app-payment-history></app-payment-history>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="runIntegrationTest()">
            Executar Teste de Integração
          </button>
          <button mat-button color="warn" (click)="clearTestData()">
            Limpar Dados de Teste
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .test-card {
      margin-bottom: 20px;
    }

    .status-section {
      margin: 20px 0;
      
      .status-item {
        display: flex;
        align-items: center;
        margin: 10px 0;
        color: #666;

        &.active {
          color: #4CAF50;
        }

        mat-icon {
          margin-right: 10px;
        }
      }
    }

    .event-list {
      max-height: 300px;
      overflow-y: auto;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;

      .event-item {
        display: flex;
        align-items: flex-start;
        padding: 10px;
        border-bottom: 1px solid #ddd;
        
        &:last-child {
          border-bottom: none;
        }

        mat-icon {
          margin-right: 10px;
          
          &.success { color: #4CAF50; }
          &.warning { color: #FFA726; }
          &.error { color: #f44336; }
        }

        .event-details {
          display: flex;
          flex-direction: column;

          strong {
            color: #333;
          }

          span {
            color: #666;
            font-size: 0.9em;
          }

          small {
            color: #999;
            font-size: 0.8em;
          }
        }
      }
    }

    mat-divider {
      margin: 20px 0;
    }

    .payment-section, .history-section {
      margin: 20px 0;
    }
  `]
})
export class PaymentTestComponent implements OnInit, OnDestroy {
  private eventsSubject = new BehaviorSubject<any[]>([]);
  private subscriptions: Subscription[] = [];

  // Observáveis do estado do sistema
  paymentEvents$ = this.eventsSubject.asObservable();
  isWebhookActive$ = new BehaviorSubject<boolean>(false);
  isFirestoreConnected$ = new BehaviorSubject<boolean>(false);

  // Observáveis do estado dos pagamentos
  transactions$ = this.paymentState.transactions$;
  activeSubscriptions$ = this.paymentState.getActiveSubscriptions();
  pendingPayments$ = this.paymentState.getPendingPayments();
  monthlyRecurringRevenue$ = this.paymentState.getMonthlyRecurringRevenue();
  paymentStateError$ = this.paymentState.error$;

  constructor(
    private asaasService: AsaasService,
    private paymentService: PaymentService,
    private paymentState: PaymentStateService,
    private webhookService: WebhookService,
    private firestore: AngularFirestore,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.checkSystemStatus();
  }

  private async checkSystemStatus() {
    // Verifica conexão com Firestore
    try {
      await this.firestore.collection('test').doc('connection').set({ timestamp: new Date() });
      this.isFirestoreConnected$.next(true);
      this.addEvent('SYSTEM', 'Conexão com Firestore estabelecida', 'success');
    } catch (error) {
      this.isFirestoreConnected$.next(false);
      this.addEvent('SYSTEM', 'Erro na conexão com Firestore', 'error');
    }

    // Verifica status do webhook
    try {
      const lastWebhookEvent = await this.firestore
        .collection('payment_events')
        .ref
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (lastWebhookEvent && !lastWebhookEvent.empty) {
        this.isWebhookActive$.next(true);
        this.addEvent('SYSTEM', 'Webhook Asaas ativo', 'success');
      } else {
        this.isWebhookActive$.next(false);
        this.addEvent('SYSTEM', 'Sem eventos recentes do webhook', 'warning');
      }
    } catch (error) {
      this.isWebhookActive$.next(false);
      this.addEvent('SYSTEM', 'Erro ao verificar status do webhook', 'error');
    }
  }

  async runIntegrationTest() {
    this.addEvent('TEST', 'Iniciando teste de integração', 'success');

    try {
      // 1. Criar cliente de teste
      const customer = {
        name: 'Cliente Teste',
        email: 'teste@teste.com',
        cpfCnpj: '02878420101',
        phone: '67992745012',
        mobilePhone: '67992745012',
        postalCode: '01234567',
        addressNumber: '123'
      };

      const customerResponse = await this.asaasService.createCustomer(customer).toPromise();
      
      if (!customerResponse?.customerId) {
        throw new Error('Falha ao criar cliente de teste');
      }

      this.addEvent('CUSTOMER', `Cliente criado com ID: ${customerResponse.customerId}`, 'success');

      // 2. Criar pagamento de teste
      const payment = {
        amount: 99.90,
        courseId: 'TEST_COURSE',
        paymentMethod: 'CREDIT_CARD',
        customer: {
          asaasId: customerResponse.customerId,
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
          phone: customer.phone,
          postalCode: customer.postalCode,
          addressNumber: customer.addressNumber
        },
        creditCardInfo: {
          holderName: 'Cliente Teste',
          number: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          ccv: '123',
          cep: '79005160'
        }
      };

      const paymentResponse = await this.asaasService.createPayment(payment, 'TEST_COURSE').toPromise();
      
      if (!paymentResponse?.id) {
        throw new Error('Falha ao criar pagamento de teste');
      }

      this.addEvent('PAYMENT', `Pagamento criado com ID: ${paymentResponse.id}`, 'success');

      // 3. Monitorar status do pagamento
      this.monitorPaymentStatus(paymentResponse.id);

    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido no teste';
      this.addEvent('ERROR', `Erro no teste: ${errorMessage}`, 'error');
    }
  }

  private monitorPaymentStatus(paymentId: string) {
    const subscription = interval(10000) // A cada 10 segundos
      .pipe(
        take(30), // 30 tentativas = 5 minutos
        switchMap(() => this.paymentService.getPaymentStatus(paymentId))
      )
      .subscribe({
        next: (status) => {
          this.addEvent('STATUS', `Status do pagamento atualizado: ${status}`, 'success');
          if (['RECEIVED', 'CONFIRMED', 'REFUNDED'].includes(status)) {
            this.addEvent('COMPLETE', 'Processamento do pagamento finalizado', 'success');
            subscription.unsubscribe();
          }
        },
        error: (error: any) => {
          const errorMessage = error?.message || 'Erro desconhecido ao monitorar pagamento';
          this.addEvent('ERROR', `Erro ao monitorar pagamento: ${errorMessage}`, 'error');
        }
      });

    this.subscriptions.push(subscription);
  }

  async clearTestData() {
    try {
      // Limpar dados de teste do Firestore
      const batch = this.firestore.firestore.batch();
      
      // Limpar transações de teste
      const transactionsCollection = this.firestore
        .collection<PaymentTransaction>('transactions');

      const transactions = await transactionsCollection
        .ref.where('courseId', '==', 'TEST_COURSE')
        .get();
      
      transactions.docs.forEach(doc => batch.delete(doc.ref));

      // Limpar eventos de teste apenas se houver transações
      const transactionIds = transactions.docs.map(doc => doc.id);
      if (transactionIds.length > 0) {
        const eventsCollection = this.firestore
          .collection<{ paymentId: string }>('payment_events');

        const events = await eventsCollection
          .ref.where('paymentId', 'in', transactionIds)
          .get();
        
        events.docs.forEach(doc => batch.delete(doc.ref));
      }

      await batch.commit();
      this.addEvent('CLEANUP', 'Dados de teste removidos com sucesso', 'success');
      this.snackBar.open('Dados de teste limpos com sucesso', 'OK', { duration: 3000 });

      // Atualizar estado
      await this.paymentState.refreshTransactions();
      await this.paymentState.refreshSubscriptions();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao limpar dados';
      this.addEvent('ERROR', `Erro ao limpar dados: ${errorMessage}`, 'error');
      this.snackBar.open('Erro ao limpar dados de teste', 'OK', { duration: 3000 });
    }
  }

  private addEvent(type: string, message: string, status: 'success' | 'warning' | 'error') {
    const currentEvents = this.eventsSubject.value;
    const newEvent = {
      type,
      message,
      status,
      timestamp: new Date()
    };
    this.eventsSubject.next([newEvent, ...currentEvents]);
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'SYSTEM': return 'settings';
      case 'TEST': return 'science';
      case 'CUSTOMER': return 'person';
      case 'PAYMENT': return 'payment';
      case 'STATUS': return 'update';
      case 'COMPLETE': return 'check_circle';
      case 'CLEANUP': return 'cleaning_services';
      case 'ERROR': return 'error';
      default: return 'info';
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
} 
