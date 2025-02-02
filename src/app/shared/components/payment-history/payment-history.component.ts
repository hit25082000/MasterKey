import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
      console.log(transactions)
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
            const payments = await firstValueFrom(this.asaasService.getSubscriptionPayments(subscription.id || ''));
            
            // Ordenar pagamentos por data
            const sortedPayments = payments.sort((a, b) => {
              const dateA = new Date(a.dueDate);
              const dateB = new Date(b.dueDate);
              return dateA.getTime() - dateB.getTime();
            });

            // Calcular próximas faturas baseado no ciclo e quantidade de parcelas
            const nextPaymentDates = this.calculateNextPaymentDates(
              subscription.nextDueDate,
              subscription.cycle,
              subscription.maxInstallments || 1,
              sortedPayments.length
            );

            return {
              ...subscription,
              courseName: course.name || 'Curso não encontrado',
              subscriptionDetails: {
                paymentHistory: sortedPayments.map(payment => ({
                  id: payment.id,
                  status: payment.status,
                  dueDate: payment.dueDate,
                  value: payment.amount,
                  installmentNumber: payment.installmentNumber,
                  paymentMethod: payment.billingType || subscription.paymentMethod,
                  invoiceUrl: payment.invoiceUrl,
                  bankSlipUrl: payment.bankSlipUrl,
                  pixQrCodeUrl: payment.pixQrCodeUrl
                })),
                nextPayments: nextPaymentDates.map((date, index) => ({
                  dueDate: date,
                  installmentNumber: (sortedPayments.length || 0) + index + 1
                }))
              }
            };
          } catch (error) {
            console.error(`Erro ao carregar detalhes da assinatura ${subscription.id}:`, error);
            return subscription;
          }
        })
      );

      this.payments$ = of(transactionsWithDetails || []);
      this.subscriptions$ = of(subscriptionsWithDetails || []);
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
    if (!subscription.maxInstallments) return 0;
    
    const completed = this.getCompletedInstallments(subscription);
    const total = subscription.maxInstallments;
    
    return Math.round((completed / total) * 100);
  }

  sortPaymentsByDate(payments: any[]): any[] {
    return payments.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async gerarPagamentoFatura(
    subscription: Subscription, 
    paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD',
    dataFatura: Date | string
  ) {
    this.loadingService.show();
    try {
      const paymentData = {
        customer: subscription.customerId,
        billingType: paymentMethod,
        value: subscription.value,
        dueDate: new Date(dataFatura).toISOString().split('T')[0],
        description: `Pagamento da assinatura - ${subscription.courseName}`,
        externalReference: subscription.courseId,
        postalService: false
      };

      const response = await firstValueFrom(this.asaasService.createPayment(paymentData));

      if (response) {
        await this.loadUserData();
        this.snackBar.open('Pagamento gerado com sucesso!', 'OK', { duration: 3000 });

        if (response['invoiceUrl']) {
          window.location.href = response['invoiceUrl'];
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar pagamento:', error);
      this.snackBar.open(
        error instanceof Error ? error.message : 'Erro ao gerar pagamento. Tente novamente.',
        'OK',
        { duration: 3000 }
      );
    } finally {
      this.loadingService.hide();
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
      p => new Date(p.dueDate).toDateString() === fatura.toDateString()
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
      p => new Date(p.dueDate).toDateString() === new Date(dataFatura).toDateString()
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

  private calculateNextPaymentDates(
    nextDueDate: string,
    cycle: string,
    maxInstallments: number,
    currentInstallments: number
  ): Date[] {
    const dates: Date[] = [];
    if (currentInstallments >= maxInstallments) return dates;

    let currentDate = new Date(nextDueDate);
    const remainingInstallments = maxInstallments - currentInstallments;

    for (let i = 0; i < remainingInstallments; i++) {
      dates.push(new Date(currentDate));
      
      switch (cycle) {
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'QUARTERLY':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'SEMIANNUALLY':
          currentDate.setMonth(currentDate.getMonth() + 6);
          break;
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    return dates;
  }

  getPaymentDate(payment: any): Date {
    return new Date(payment.dueDate);
  }

  getPaymentMethod(payment: any): string {
    return payment.billingType || 'Não informado';
  }

  getInstallmentInfo(subscription: Subscription): { current: number; total: number } {
    const paidPayments = subscription.subscriptionDetails?.paymentHistory?.filter(
      payment => payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
    ).length || 0;

    return {
      current: paidPayments,
      total: subscription.maxInstallments
    };
  }

  calculateProgress(subscription: Subscription): number {
    const info = this.getInstallmentInfo(subscription);
    return Math.round((info.current / info.total) * 100);
  }
} 