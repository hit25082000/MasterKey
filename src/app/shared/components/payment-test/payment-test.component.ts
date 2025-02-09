import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsaasService } from '../../../core/services/asaas.service';
import { PaymentStateService } from '../../../core/services/payment-state.service';
import { WebhookService } from '../../../core/services/webhook.service';
import { PaymentComponent } from '../payment/payment.component';
import { PaymentHistoryComponent } from '../payment-history/payment-history.component';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { PaymentTransaction } from '../../../core/interfaces/payment.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { PaymentService } from '../../services/payment.service';

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
    PaymentHistoryComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule
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
              [courseValue]="99.90">
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

          <mat-divider></mat-divider>

          <div class="test-section">
            <h3>1. Teste de Webhook</h3>
            <div class="test-item">
              <button mat-raised-button color="primary" 
                      [disabled]="testingWebhook"
                      (click)="testWebhook()">
                <mat-icon>send</mat-icon>
                Testar Webhook
              </button>
              <mat-progress-bar *ngIf="testingWebhook" mode="indeterminate"></mat-progress-bar>
              <div class="test-result" *ngIf="webhookResult">
                <mat-icon [color]="webhookResult.success ? 'primary' : 'warn'">
                  {{webhookResult.success ? 'check_circle' : 'error'}}
                </mat-icon>
                <span>{{webhookResult.message}}</span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="test-section">
            <h3>2. Teste de Pagamento</h3>
            <div class="test-item">
              <button mat-raised-button color="primary" 
                      [disabled]="testingPayment"
                      (click)="testPayment()">
                <mat-icon>payment</mat-icon>
                Testar Pagamento
              </button>
              <mat-progress-bar *ngIf="testingPayment" mode="indeterminate"></mat-progress-bar>
              <div class="test-result" *ngIf="paymentResult">
                <mat-icon [color]="paymentResult.success ? 'primary' : 'warn'">
                  {{paymentResult.success ? 'check_circle' : 'error'}}
                </mat-icon>
                <span>{{paymentResult.message}}</span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="subscription-section">
            <h3>Teste de Assinaturas</h3>
            <form [formGroup]="subscriptionForm" (ngSubmit)="createSubscription()">
              <mat-form-field>
                <mat-label>ID da Assinatura</mat-label>
                <input matInput formControlName="subscriptionId">
              </mat-form-field>

              <mat-form-field>
                <mat-label>Valor</mat-label>
                <input matInput type="number" formControlName="value">
              </mat-form-field>

              <mat-form-field>
                <mat-label>Ciclo</mat-label>
                <mat-select formControlName="cycle">
                  <mat-option value="MONTHLY">Mensal</mat-option>
                  <mat-option value="QUARTERLY">Trimestral</mat-option>
                  <mat-option value="YEARLY">Anual</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" [disabled]="!subscriptionForm.valid || loading">
                {{ loading ? 'Processando...' : 'Criar Assinatura' }}
              </button>
            </form>

            <div class="actions" *ngIf="currentSubscriptionId">
              <h3>Ações para Assinatura: {{currentSubscriptionId}}</h3>
              
              <button mat-raised-button color="accent" (click)="simulatePayment()" [disabled]="loading">
                {{ loading ? 'Processando...' : 'Simular Pagamento' }}
              </button>
              
              <button mat-raised-button color="warn" (click)="cancelSubscription()" [disabled]="loading">
                {{ loading ? 'Processando...' : 'Cancelar Assinatura' }}
              </button>
            </div>

            <div class="webhook-events" *ngIf="webhookEvents.length">
              <h3>Eventos do Webhook</h3>
              <div *ngFor="let event of webhookEvents" class="event-item">
                <p><strong>Evento:</strong> {{event.event}}</p>
                <p><strong>Status:</strong> {{event.status}}</p>
                <p><strong>Data:</strong> {{event.createdAt | date:'short'}}</p>
              </div>
            </div>
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

    .test-section {
      margin: 20px 0;

      h3 {
        margin-bottom: 15px;
        color: #333;
      }
    }

    .test-item {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 15px;

      button {
        margin-bottom: 10px;
      }

      .mat-icon {
        margin-right: 8px;
      }
    }

    .test-result {
      display: flex;
      align-items: center;
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      .mat-icon {
        margin-right: 8px;
      }
    }

    .subscription-section {
      margin-top: 20px;
    }

    .actions {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .actions button {
      margin-right: 16px;
      margin-bottom: 16px;
    }
    
    .webhook-events {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .event-item {
      padding: 12px;
      margin-bottom: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .event-item p {
      margin: 4px 0;
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

  testingWebhook = false;
  testingPayment = false;
  webhookResult: any = null;
  paymentResult: any = null;

  subscriptionForm: FormGroup;
  currentSubscriptionId: string = '';
  webhookEvents: any[] = [];
  loading: boolean = false;

  constructor(
    private asaasService: AsaasService,
    private paymentState: PaymentStateService,
    private webhookService: WebhookService,
    private firestore: AngularFirestore,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.subscriptionForm = this.fb.group({
      subscriptionId: ['', Validators.required],
      value: [99.90, [Validators.required, Validators.min(1)]],
      cycle: ['MONTHLY', Validators.required]
    });
  }

  ngOnInit() {
    this.checkSystemStatus();
    this.loadWebhookEvents();
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

      const paymentResponse = await this.asaasService.createPayment({...payment, courseId: 'TEST_COURSE'},).toPromise();
      
      if (!paymentResponse?.id) {
        throw new Error('Falha ao criar pagamento de teste');
      }

      this.addEvent('PAYMENT', `Pagamento criado com ID: ${paymentResponse.id}`, 'success');

    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido no teste';
      this.addEvent('ERROR', `Erro no teste: ${errorMessage}`, 'error');
    }
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

  async testWebhook() {
    this.testingWebhook = true;
    this.webhookResult = null;

    try {
      // Simular um evento de pagamento do Asaas
      const mockWebhookEvent = {
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_test_' + Date.now(),
          customer: 'cus_test_123',
          value: 99.90,
          netValue: 96.90,
          billingType: 'PIX',
          status: 'RECEIVED',
          dueDate: new Date().toISOString().split('T')[0],
          paymentDate: new Date().toISOString(),
          invoiceUrl: 'https://sandbox.asaas.com/i/123456',
          bankSlipUrl: null
        }
      };

      // Enviar evento para o endpoint do webhook
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/asaasWebhook`, mockWebhookEvent)
      );

      this.webhookResult = {
        success: true,
        message: 'Webhook processado com sucesso!'
      };

    } catch (error: any) {
      console.error('Erro no teste do webhook:', error);
      this.webhookResult = {
        success: false,
        message: `Erro no webhook: ${error.message || 'Erro desconhecido'}`
      };
    } finally {
      this.testingWebhook = false;
    }
  }

  async testPayment() {
    this.testingPayment = true;
    this.paymentResult = null;

    try {
      // Dados de teste para criar um pagamento
      const paymentData = {
        amount: 99.90,
        courseId: 'TEST_COURSE',
        paymentMethod: 'PIX',
        customer: {
          name: 'Usuário Teste',
          email: 'teste@teste.com',
          cpfCnpj: '02878420101',
          phone: '67992745012'
        }
      };

      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/createAsaasPayment`, paymentData)
      );

      this.paymentResult = {
        success: true,
        message: 'Pagamento criado com sucesso!'
      };

    } catch (error: any) {
      console.error('Erro no teste de pagamento:', error);
      this.paymentResult = {
        success: false,
        message: `Erro no pagamento: ${error.message || 'Erro desconhecido'}`
      };
    } finally {
      this.testingPayment = false;
    }
  }

  async createSubscription() {
    if (!this.subscriptionForm.valid) {
      this.snackBar.open('Por favor, preencha todos os campos', 'OK', { duration: 3000 });
      return;
    }

    try {
      this.loading = true;
      const formData = this.subscriptionForm.value;
      
      // Criar cliente de teste
      const customerData = {
        name: 'Cliente Teste',
        email: `teste_${new Date().getTime()}@teste.com`,
        cpfCnpj: '02878420101',
        phone: '6792745012',
        mobilePhone: '6792745012',
        postalCode: '79005160',
        addressNumber: '123'
      };
      console.log(customerData)
      // Primeiro, verificar se o cliente já existe
      const customerResponse = await firstValueFrom(this.asaasService.createCustomer(customerData))
        .catch(error => {
          console.error('Erro ao criar cliente:', error);
          if (error.status === 0) {
            throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando e acessível.');
          }
          throw error;
        });

      if (!customerResponse || !customerResponse.customerId) {
        throw new Error('Falha ao criar cliente de teste');
      }

      // Criar assinatura
      const subscriptionData = {
        customer: customerResponse.customerId,
        billingType: 'BOLETO',
        value: formData.value,
        nextDueDate: new Date().toISOString().split('T')[0],
        cycle: formData.cycle,
        description: `Assinatura de teste - ${formData.subscriptionId}`,
        maxInstallments: formData.maxInstallments || 1
      };
      console.log(subscriptionData)
      console.log(formData)
      const subscriptionResponse = await firstValueFrom(
        this.asaasService.createSubscription(subscriptionData, formData.subscriptionId)
      ).catch(error => {
        console.error('Erro ao criar assinatura:', error);
        if (error.status === 0) {
          throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando e acessível.');
        } else if (error.status === 403) {
          throw new Error('Erro de permissão. Verifique as configurações de CORS no backend.');
        }
        throw error;
      });

      if (subscriptionResponse) {
        this.currentSubscriptionId = subscriptionResponse.id;
        this.snackBar.open('Assinatura criada com sucesso!', 'OK', { duration: 3000 });
        
        // Adicionar evento de criação ao histórico
        this.addWebhookEvent({
          event: 'SUBSCRIPTION_CREATED',
          subscription: {
            id: subscriptionResponse.id,
            status: 'ACTIVE',
            value: formData.value,
            cycle: formData.cycle
          },
          createdAt: new Date(),
          status: 'PROCESSED'
        });
      }

    } catch (error) {
      console.error('Erro ao processar operação:', error);
      this.snackBar.open(
        error instanceof Error ? error.message : 'Erro ao criar assinatura. Verifique o console para mais detalhes.',
        'OK',
        { duration: 5000 }
      );
    } finally {
      this.loading = false;
    }
  }

  async simulatePayment() {
    if (!this.currentSubscriptionId) {
      this.snackBar.open('Nenhuma assinatura selecionada', 'OK', { duration: 3000 });
      return;
    }

    try {
      // Simular evento de pagamento recebido
      const webhookEvent = {
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: `pmt_${new Date().getTime()}`,
          subscription: this.currentSubscriptionId,
          status: 'RECEIVED',
          value: this.subscriptionForm.get('value')?.value,
          netValue: this.subscriptionForm.get('value')?.value,
          billingType: 'BOLETO',
          paymentDate: new Date().toISOString(),
          invoiceUrl: 'https://example.com/invoice'
        }
      };

      // Adicionar evento à lista
      this.addWebhookEvent({
        ...webhookEvent,
        createdAt: new Date(),
        status: 'PROCESSED'
      });

      this.snackBar.open('Pagamento simulado com sucesso!', 'OK', { duration: 3000 });

    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      this.snackBar.open('Erro ao simular pagamento', 'OK', { duration: 5000 });
    }
  }

  async cancelSubscription() {
    if (!this.currentSubscriptionId) {
      this.snackBar.open('Nenhuma assinatura selecionada', 'OK', { duration: 3000 });
      return;
    }

    try {
      // Simular evento de cancelamento
      const webhookEvent = {
        event: 'SUBSCRIPTION_DELETED',
        subscription: {
          id: this.currentSubscriptionId,
          status: 'CANCELLED',
          deletedAt: new Date().toISOString()
        }
      };

      // Adicionar evento à lista
      this.addWebhookEvent({
        ...webhookEvent,
        createdAt: new Date(),
        status: 'PROCESSED'
      });

      this.currentSubscriptionId = '';
      this.snackBar.open('Assinatura cancelada com sucesso!', 'OK', { duration: 3000 });

    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      this.snackBar.open('Erro ao cancelar assinatura', 'OK', { duration: 5000 });
    }
  }

  private addWebhookEvent(event: any) {
    this.webhookEvents.unshift(event);
    // Manter apenas os últimos 10 eventos
    if (this.webhookEvents.length > 10) {
      this.webhookEvents = this.webhookEvents.slice(0, 10);
    }
    // Salvar no localStorage
    localStorage.setItem('webhookEvents', JSON.stringify(this.webhookEvents));
  }

  loadWebhookEvents() {
    // Carregar eventos do localStorage se existirem
    const savedEvents = localStorage.getItem('webhookEvents');
    if (savedEvents) {
      this.webhookEvents = JSON.parse(savedEvents);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
} 
