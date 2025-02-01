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
import { CourseService } from '../../../features/course/services/course.service';
import { ActivatedRoute } from '@angular/router';
import { 
  PaymentTransaction, 
  Subscription,
  PaymentStatusTranslation,
  PaymentMethodTranslation,
  SubscriptionStatusTranslation,
  SubscriptionCycleTranslation
} from '../../../core/interfaces/payment.interface';
import { firstValueFrom, Observable, of } from 'rxjs';
import { getAuth } from '@angular/fire/auth';
import { environment } from '../../../../environments/environment';
import { StudentService } from '../../../features/student/services/student.service';
import { AsaasService } from '../../../core/services/asaas.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit {
  payments$!: Observable<PaymentTransaction[]>;
  subscriptions$!: Observable<Subscription[]>;
  userId: string = '';
  loading = true;
  error: string | null = null;

  constructor(
    private paymentService: PaymentService,
    private courseService: CourseService,
    private asaasService: AsaasService,
    private studentService: StudentService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Primeiro tenta pegar o ID da URL
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = params['id'];
        this.loadUserData();
      } else {
        const auth = getAuth();
        this.userId = auth.currentUser?.uid || '';
        if (this.userId) {
          this.loadUserData();
        }
      }
    });
  }

  private async loadUserData() {
    try {
      this.loading = true;
      const student = await this.studentService.selectStudent(this.userId);
      
      if (!student()) {
        throw new Error('Estudante não encontrado');
      }

      const customer = await firstValueFrom(this.asaasService.getCustomerByEmail(student()?.email!));
      
      if (!customer?.asaasId) {
        throw new Error('Cliente Asaas não encontrado');
      }

      // Carregar transações e complementar com dados do curso
      const transactions = await firstValueFrom(this.paymentService.getCustomerTransactions(customer.asaasId));
      const transactionsWithDetails = await Promise.all(
        transactions.map(async (transaction) => {
          try {
            const course = await this.courseService.getById(transaction.courseId);
            
            return {
              ...transaction,
              paymentDetails: {
                description: course.name || 'Curso não encontrado',
                invoiceUrl: transaction.invoiceUrl,
                bankSlipUrl: transaction.bankSlipUrl,
                pixQrCodeUrl: transaction.paymentMethod === 'PIX' ? transaction.pixQrCodeUrl : undefined,
                pixCopiaECola: transaction.paymentMethod === 'PIX' ? transaction.pixCopiaECola : undefined,
                installments: transaction.installments ? {
                  total: transaction.installments.total || 1,
                  current: transaction.installments.current || 1,
                  value: transaction.installments.value || transaction.amount
                } : undefined
              }
            } as PaymentTransaction;
          } catch (error) {
            console.error(`Erro ao carregar detalhes do curso ${transaction.courseId}:`, error);
            return transaction;
          }
        })
      );

      // Carregar assinaturas e complementar com dados do curso
      const subscriptions = await firstValueFrom(this.paymentService.getCustomerSubscriptions(customer.asaasId));
      const subscriptionsWithDetails = await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            const course = await this.courseService.getById(subscription.courseId);
            
            // Garantir que todos os campos obrigatórios estejam presentes
            const mappedSubscription: Subscription = {
              id: subscription.id,
              courseId: subscription.courseId,
              courseName: course.name || 'Curso não encontrado',
              customerId: subscription.customerId,
              customerEmail: student()?.email || '',
              asaasSubscriptionId: subscription.asaasSubscriptionId,
              value: subscription.value,
              cycle: subscription.cycle,
              paymentMethod: subscription.paymentMethod,
              status: subscription.status,
              nextDueDate: subscription.nextDueDate,
              createdAt: subscription.createdAt,
              updatedAt: subscription.updatedAt,
              subscriptionDetails: {
                description: course.name || 'Curso não encontrado',
                installments: subscription.subscriptionDetails?.installments,
                paymentHistory: subscription.subscriptionDetails?.paymentHistory || []
              }
            };
            
            return mappedSubscription;
          } catch (error) {
            console.error(`Erro ao carregar detalhes do curso ${subscription.courseId}:`, error);
            
            // Criar uma assinatura com dados mínimos em caso de erro
            const fallbackSubscription: Subscription = {
              ...subscription,
              courseName: 'Curso não encontrado',
              customerEmail: student()?.email || '',
              subscriptionDetails: {
                description: 'Curso não encontrado',
                installments: subscription.subscriptionDetails?.installments,
                paymentHistory: subscription.subscriptionDetails?.paymentHistory || []
              }
            };
            
            return fallbackSubscription;
          }
        })
      );

      this.payments$ = of(transactionsWithDetails);
      this.subscriptions$ = of(subscriptionsWithDetails);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      this.error = 'Erro ao carregar histórico de pagamentos';
    } finally {
      this.loading = false;
    }
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

  async gerarPagamentoFatura(subscription: Subscription, paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD') {
    try {
      const paymentData = {
        customer: subscription.asaasSubscriptionId,
        billingType: paymentMethod,
        value: subscription.value,
        dueDate: subscription.nextDueDate,
        description: `Pagamento da assinatura - ${subscription.courseName}`,
        externalReference: subscription.courseId
      };

      const response = await firstValueFrom(this.asaasService.createPayment(paymentData));

      if (response) {
        // Atualizar a lista de pagamentos
        await this.loadUserData();
        
        // Mostrar mensagem de sucesso
        this.snackBar.open('Pagamento gerado com sucesso!', 'OK', {
          duration: 3000
        });

        // Se for pagamento por cartão, redirecionar para a página de pagamento
        if (paymentMethod === 'CREDIT_CARD' && response.invoiceUrl) {
          window.location.href = response.invoiceUrl;
        }
      }
    } catch (error) {
      console.error('Erro ao gerar pagamento:', error);
      this.snackBar.open('Erro ao gerar pagamento. Tente novamente.', 'OK', {
        duration: 3000
      });
    }
  }

  getProximasFaturas(subscription: Subscription): Date[] {
    const faturas: Date[] = [];
    const dataAtual = new Date();
    const dataProximaFatura = new Date(subscription.nextDueDate);
    
    // Gerar próximas 3 faturas baseado no ciclo
    for (let i = 0; i < 3; i++) {
      if (dataProximaFatura > dataAtual) {
        faturas.push(new Date(dataProximaFatura));
      }
      
      // Adicionar intervalo baseado no ciclo
      switch (subscription.cycle) {
        case 'WEEKLY':
          dataProximaFatura.setDate(dataProximaFatura.getDate() + 7);
          break;
        case 'BIWEEKLY':
          dataProximaFatura.setDate(dataProximaFatura.getDate() + 14);
          break;
        case 'MONTHLY':
          dataProximaFatura.setMonth(dataProximaFatura.getMonth() + 1);
          break;
        case 'QUARTERLY':
          dataProximaFatura.setMonth(dataProximaFatura.getMonth() + 3);
          break;
        case 'SEMIANNUALLY':
          dataProximaFatura.setMonth(dataProximaFatura.getMonth() + 6);
          break;
        case 'YEARLY':
          dataProximaFatura.setFullYear(dataProximaFatura.getFullYear() + 1);
          break;
      }
    }

    return faturas;
  }

  getFaturaStatus(dataFatura: Date): 'pendente' | 'atrasada' | 'futura' {
    const hoje = new Date();
    const fatura = new Date(dataFatura);
    
    if (fatura < hoje) {
      return 'atrasada';
    } else if (fatura.getTime() - hoje.getTime() <= 7 * 24 * 60 * 60 * 1000) { // 7 dias
      return 'pendente';
    } else {
      return 'futura';
    }
  }
} 