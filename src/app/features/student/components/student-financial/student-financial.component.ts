import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { PaymentService } from '../../../../shared/services/payment.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, map, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-student-financial',
  templateUrl: './student-financial.component.html',
  styleUrls: ['./student-financial.component.scss'],
  imports: [CommonModule, MatProgressSpinnerModule, ConfirmationDialogComponent],
  standalone: true
})
export class StudentFinancialComponent implements OnInit {
  private auth = inject(AuthService);
  private paymentService = inject(PaymentService);
  private courseService = inject(CourseService);
  protected loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private studentService = inject(StudentService)
  route = inject(ActivatedRoute)
  studentId = signal<string | null>(null);

  // Signals
  readonly payments = this.paymentService.payments;
  readonly subscriptionPayments = this.paymentService.subscriptionPayments;
  readonly subscription = this.paymentService.subscription;
  readonly courses = signal<Map<string, Course>>(new Map());

  // Computed Signal para filtrar pagamentos únicos
  readonly filteredPayments = computed(() => {
    const payments = this.payments();
    const latestPendingPaymentsByCourse = new Map();

    payments.forEach(payment => {
      if (payment.paymentDetails.status === 'PENDING') {
        const existingPayment = latestPendingPaymentsByCourse.get(payment.courseId);
        if (!existingPayment || new Date(payment.paymentDetails.dateCreated) > new Date(existingPayment.paymentDetails.dateCreated)) {
          latestPendingPaymentsByCourse.set(payment.courseId, payment);
        }
      }
    });

    // Combina os últimos pagamentos pendentes com os pagamentos não pendentes
    const nonPendingPayments = payments.filter(p => p.paymentDetails.status !== 'PENDING');
    return [...latestPendingPaymentsByCourse.values(), ...nonPendingPayments];
  });

  // Atualiza os computed signals para usar filteredPayments
  readonly pendingUniquePayments = computed(() => 
    this.filteredPayments().filter(p => p.paymentDetails.status === 'PENDING').length
  );

  readonly paidUniquePayments = computed(() => 
    this.filteredPayments().filter(p => p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED').length
  );

  readonly totalPendingUnique = computed(() => 
    this.filteredPayments()
      .filter(p => p.paymentDetails.status === 'PENDING')
      .reduce((total, p) => total + p.paymentDetails.value, 0)
  );

  readonly totalPaidUnique = computed(() => 
    this.filteredPayments()
      .filter(p => p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED')
      .reduce((total, p) => total + p.paymentDetails.value, 0)
  );

  // Computed Signals para Assinaturas
  readonly pendingSubscriptionPayments = computed(() => 
    this.subscriptionPayments().filter(p => p.paymentDetails.status === 'PENDING').length
  );
  readonly paidSubscriptionPayments = computed(() => 
    this.subscriptionPayments().filter(p => p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED').length
  );
  readonly totalPendingSubscription = computed(() => 
    this.subscriptionPayments()
      .filter(p => p.paymentDetails.status === 'PENDING')
      .reduce((total, p) => total + p.paymentDetails.value, 0)
  );
  readonly totalPaidSubscription = computed(() => 
    this.subscriptionPayments()
      .filter(p => p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED')
      .reduce((total, p) => total + p.paymentDetails.value, 0)
  );

  constructor() {
    this.studentId.set(this.route.snapshot.paramMap.get('id'));

    console.log(this.studentId())

    if (!this.studentId()) {
      console.log("certo")
      this.auth.userInfo
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(user => {
          if (user?.email) {
            this.loadFinancialData(user.email);
          }
        });
    } else {

      this.studentService.selectStudent(this.studentId()!)
        .then(studentSignal => {
          const student = studentSignal();
          if (student?.email) {
            this.loadFinancialData(student.email);
          }
        });
    }
  }

  ngOnInit() {}

  private async loadFinancialData(email: string) {
    try {
      this.loadingService.show();
      
      forkJoin([
        this.paymentService.getPayments(email),
        this.paymentService.getSubscriptionPayments(email),
        this.paymentService.getSubscription(email)
      ]).subscribe({
        next: async ([payments, subscriptionPayments]) => {
          // Coletar todos os courseIds únicos
          const courseIds = new Set([
            ...payments.map(p => p.courseId),
            ...subscriptionPayments.map(p => p.courseId)
          ]);

          // Buscar detalhes dos cursos
          const coursesMap = new Map<string, Course>();
          await Promise.all(
            Array.from(courseIds).map(async (courseId) => {
              try {
                const course = await this.courseService.getById(courseId);
                coursesMap.set(courseId, course);
              } catch (error) {
                console.error(`Erro ao buscar curso ${courseId}:`, error);
              }
            })
          );

          this.courses.set(coursesMap);
        },
        error: (error) => {
          console.error('Erro ao carregar dados financeiros:', error);
          this.notificationService.error('Erro ao carregar dados financeiros. Por favor, tente novamente mais tarde.');
          this.loadingService.hide();
        },
        complete: () => this.loadingService.hide()
      });
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      this.notificationService.error('Erro ao carregar dados financeiros. Por favor, tente novamente mais tarde.');
      this.loadingService.hide();
    }
  }

  getCourse(courseId: string): Course | undefined {
    return this.courses().get(courseId);
  }

  copyPixCode(code: string | undefined) {
    if (!code) {
      this.notificationService.error('Código PIX não disponível');
      return;
    }

    navigator.clipboard.writeText(code).then(() => {
      this.notificationService.success('Código PIX copiado com sucesso!');
    }).catch(() => {
      this.notificationService.error('Erro ao copiar código PIX');
    });
  }

  openPaymentUrl(url: string) {
    window.open(url, '_blank');
  }

  cancelSubscription(subscriptionId: string) {
    this.confirmationService.confirm({
      header: 'Cancelar Assinatura',
      message: 'Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loadingService.show();
        this.paymentService.cancelSubscription(subscriptionId).subscribe({
          next: async () => {
            this.notificationService.success('Assinatura cancelada com sucesso!');
            // Recarregar dados usando userInfo
            const user = await firstValueFrom(this.auth.userInfo);
            if (user?.email) {
              await this.loadFinancialData(user.email);
            }
          },
          error: (error) => {
            console.error('Erro ao cancelar assinatura:', error);
            this.notificationService.error('Erro ao cancelar assinatura. Por favor, tente novamente mais tarde.');
          },
          complete: () => this.loadingService.hide()
        });
      }
    });
  }

  async processPayment(payment: any, paymentMethod: string) {
    try {
      this.loadingService.show();
      const user = await firstValueFrom(this.auth.userInfo);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Dados do cliente
      const customerData = {
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpf,
        phone: user.phone1,
        courseId: payment.courseId
      };
      console.log(user)
      if (paymentMethod === 'CREDIT_CARD') {
        try {
          // Salvar dados do cliente
          await firstValueFrom(this.paymentService.saveCustomerData(customerData));

          // Criar link de pagamento
          const response = await firstValueFrom(
            this.http.get<{url: string}>(
              `${environment.apiUrl}/createPaymentLink?courseId=${payment.courseId}`
            )
          );
          
          if (response?.url) {
            window.location.href = response.url;
            return;
          }
          throw new Error('URL de pagamento não disponível');
        } catch (error) {
          console.error('Erro ao obter link de pagamento:', error);
          this.notificationService.error('Erro ao gerar link de pagamento. Tente novamente.');
        }
      } else {
        // Processamento para PIX e Boleto
        const response = await firstValueFrom(this.paymentService.processPayment({
          amount: payment.paymentDetails.value,
          courseId: payment.courseId,
          paymentMethod,
          customer: customerData
        }));

        if (!response) {
          throw new Error('Resposta do pagamento inválida');
        }

        if (paymentMethod === 'BOLETO' && response.bankSlipUrl) {
          window.open(response.bankSlipUrl, '_blank');
        } else if (paymentMethod === 'PIX' && response.invoiceUrl) {
          window.open(response.invoiceUrl, '_blank');
        } else {
          this.notificationService.error('URL de pagamento não disponível');
        }

        await this.loadFinancialData(user.email);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      this.notificationService.error('Erro ao processar pagamento. Por favor, tente novamente.');
    } finally {
      this.loadingService.hide();
    }
  }
} 