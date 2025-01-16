import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { PaymentService } from '../../../../shared/services/payment.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';

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

  // Signals
  readonly payments = this.paymentService.payments;
  readonly subscriptionPayments = this.paymentService.subscriptionPayments;
  readonly subscription = this.paymentService.subscription;
  readonly courses = signal<Map<string, Course>>(new Map());

  // Computed Signals para Pagamentos Únicos
  readonly pendingUniquePayments = computed(() => 
    this.payments().filter(p => p.paymentDetails.status === 'PENDING').length
  );
  readonly paidUniquePayments = computed(() => 
    this.payments().filter(p => p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED').length
  );
  readonly totalPendingUnique = computed(() => 
    this.payments()
      .filter(p => p.paymentDetails.status === 'PENDING')
      .reduce((total, p) => total + p.paymentDetails.value, 0)
  );
  readonly totalPaidUnique = computed(() => 
    this.payments()
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
    this.auth.userInfo
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user?.email) {
          this.loadFinancialData(user.email);
        }
      });
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

  cancelSubscription(subscriptionId: string) {
    this.confirmationService.confirm({
      header: 'Cancelar Assinatura',
      message: 'Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.',
      icon: 'fas fa-exclamation-triangle',
      accept: () => {
        this.loadingService.show();
        this.paymentService.cancelSubscription(subscriptionId).subscribe({
          next: () => {
            this.notificationService.success('Assinatura cancelada com sucesso!');
            // Recarregar dados do usuário atual
            const userEmail = this.auth.getCurrentUser().email;
            if (userEmail) {
              this.loadFinancialData(userEmail);
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
} 