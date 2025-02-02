import { Component, inject, OnInit } from '@angular/core';
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
import { LoadingService } from '../../services/loading.service';

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
  private loadingService = inject(LoadingService)
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
      this.loadingService.show()
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
        transactions
          .filter(transaction => !transaction.subscriptionId) // Filtrar apenas pagamentos sem assinatura
          .map(async (transaction) => {
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
      this.loadingService.hide();
    }
  }

  convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    
    if (timestamp.seconds) {
      // É um Timestamp do Firestore
      return new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      // É uma string ISO
      return new Date(timestamp);
    }
    
    return new Date(timestamp);
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

  async gerarPagamentoFatura(
    subscription: Subscription, 
    paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD',
    dataFatura: Date
  ) {
    this.loadingService.show()
    try {

      // Validações de data
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 40);
      
      if (dataFatura > dataLimite) {
        this.snackBar.open('Não é possível gerar pagamentos com mais de 40 dias de antecedência', 'OK', {
          duration: 5000
        });
        return;
      }

      if (dataFatura < hoje) {
        const diasAtraso = Math.floor((hoje.getTime() - dataFatura.getTime()) / (1000 * 60 * 60 * 24));
        if (diasAtraso > 60) {
          this.snackBar.open('Não é possível gerar pagamentos para faturas com mais de 60 dias de atraso', 'OK', {
            duration: 5000
          });
          return;
        }
      }

      const paymentData = {
        customer: subscription.customerId,
        billingType: paymentMethod,
        value: subscription.value,
        dueDate: dataFatura.toISOString().split('T')[0], // Formato YYYY-MM-DD
        description: `Pagamento da assinatura - ${subscription.courseName}`,
        externalReference: subscription.courseId,
        postalService: false // Desabilita envio de correspondência física
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
        if (response['invoiceUrl']) {
          window.location.href = response['invoiceUrl'];
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar pagamento:', error);
      
      // Tratamento específico para erros do Asaas
      if (error.response?.data?.errors) {
        const errorMessage = error.response.data.errors
          .map((err: any) => err.description)
          .join(', ');
        this.snackBar.open(`Erro ao gerar pagamento: ${errorMessage}`, 'OK', {
          duration: 5000
        });
      } else {
        this.snackBar.open('Erro ao gerar pagamento. Tente novamente.', 'OK', {
          duration: 3000
        });
      }
    }finally{
      this.loadingService.hide()
    }
  }

  getProximasFaturas(subscription: Subscription): Date[] {
    const faturas: Date[] = [];
    const dataAtual = new Date();
    let dataFatura = new Date(subscription.createdAt); // Começa da data de criação
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() + 12); // Limite de 12 meses para frente
    
    // Ajustar para o primeiro vencimento
    while (dataFatura < new Date(subscription.nextDueDate)) {
      switch (subscription.cycle) {
        case 'WEEKLY':
          dataFatura.setDate(dataFatura.getDate() + 7);
          break;
        case 'BIWEEKLY':
          dataFatura.setDate(dataFatura.getDate() + 14);
          break;
        case 'MONTHLY':
          dataFatura.setMonth(dataFatura.getMonth() + 1);
          break;
        case 'QUARTERLY':
          dataFatura.setMonth(dataFatura.getMonth() + 3);
          break;
        case 'SEMIANNUALLY':
          dataFatura.setMonth(dataFatura.getMonth() + 6);
          break;
        case 'YEARLY':
          dataFatura.setFullYear(dataFatura.getFullYear() + 1);
          break;
      }
    }

    // Voltar algumas faturas para mostrar histórico
    for (let i = 0; i < 6; i++) { // Mostra até 6 faturas passadas
      switch (subscription.cycle) {
        case 'WEEKLY':
          dataFatura.setDate(dataFatura.getDate() - 7);
          break;
        case 'BIWEEKLY':
          dataFatura.setDate(dataFatura.getDate() - 14);
          break;
        case 'MONTHLY':
          dataFatura.setMonth(dataFatura.getMonth() - 1);
          break;
        case 'QUARTERLY':
          dataFatura.setMonth(dataFatura.getMonth() - 3);
          break;
        case 'SEMIANNUALLY':
          dataFatura.setMonth(dataFatura.getMonth() - 6);
          break;
        case 'YEARLY':
          dataFatura.setFullYear(dataFatura.getFullYear() - 1);
          break;
      }
      
      if (dataFatura >= new Date(subscription.createdAt)) {
        faturas.unshift(new Date(dataFatura));
      }
    }

    // Adicionar faturas futuras
    dataFatura = new Date(subscription.nextDueDate);
    while (dataFatura <= dataLimite) {
      faturas.push(new Date(dataFatura));
      
      switch (subscription.cycle) {
        case 'WEEKLY':
          dataFatura.setDate(dataFatura.getDate() + 7);
          break;
        case 'BIWEEKLY':
          dataFatura.setDate(dataFatura.getDate() + 14);
          break;
        case 'MONTHLY':
          dataFatura.setMonth(dataFatura.getMonth() + 1);
          break;
        case 'QUARTERLY':
          dataFatura.setMonth(dataFatura.getMonth() + 3);
          break;
        case 'SEMIANNUALLY':
          dataFatura.setMonth(dataFatura.getMonth() + 6);
          break;
        case 'YEARLY':
          dataFatura.setFullYear(dataFatura.getFullYear() + 1);
          break;
      }
    }

    return faturas;
  }

  getFaturaStatus(dataFatura: Date, subscription: Subscription): 'pendente' | 'atrasada' | 'futura' | 'paga' {
    const hoje = new Date();
    const fatura = new Date(dataFatura);
    
    // Verifica se a fatura já foi paga
    const pagamento = subscription.subscriptionDetails?.paymentHistory?.find(
      p => new Date(p.date).toDateString() === fatura.toDateString()
    );
    
    if (pagamento) {
      return 'paga';
    }
    
    if (fatura < hoje) {
      return 'atrasada';
    } else if (fatura.getTime() - hoje.getTime() <= 7 * 24 * 60 * 60 * 1000) { // 7 dias
      return 'pendente';
    } else {
      return 'futura';
    }
  }

  isProximaFatura(dataFatura: Date, subscription: Subscription): boolean {
    const hoje = new Date();
    const fatura = new Date(dataFatura);
    const status = this.getFaturaStatus(dataFatura, subscription);
    
    // A próxima fatura é a primeira não paga a partir de hoje
    if (status !== 'paga' && fatura >= hoje) {
      const todasFaturas = this.getProximasFaturas(subscription);
      const proximasFaturas = todasFaturas.filter(d => 
        this.getFaturaStatus(d, subscription) !== 'paga' && new Date(d) >= hoje
      );
      
      return proximasFaturas[0]?.getTime() === fatura.getTime();
    }
    
    return false;
  }

  getFaturaPagamento(dataFatura: Date, subscription: Subscription): { status: string; method?: string } {
    const pagamento = subscription.subscriptionDetails?.paymentHistory?.find(
      p => new Date(p.date).toDateString() === new Date(dataFatura).toDateString()
    );
    
    if (pagamento) {
      return {
        status: pagamento.status,
        method: pagamento.paymentMethod
      };
    }
    
    return {
      status: this.getFaturaStatus(dataFatura, subscription)
    };
  }

  isPagamentoAntecipado(dataFatura: Date, subscription: Subscription): boolean {
    return dataFatura > new Date(subscription.nextDueDate);
  }
} 