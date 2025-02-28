import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { PaymentService, CustomerData, SubscriptionRequest } from '../../../../shared/services/payment.service';
import { Course } from '../../../../core/models/course.model';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../course/services/course.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';
import { firstValueFrom } from 'rxjs';
import { AsaasSubscriptionPayment, FirestoreSubscription } from '../../../../shared/models/asaas.model';
import { StudentService } from '../../../student/services/student.service';
import { AuthService } from '../../../../core/services/auth.service';
import BaseUser from '../../../../core/models/base-user.model';
import { PaymentComponent } from '../../../../shared/components/payment/payment.component';
import { PaymentHistoryComponent } from "../../../../shared/components/payment-history/payment-history.component";

@Component({
  selector: 'app-course-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaymentComponent],
  templateUrl: './course-checkout.component.html',
  styleUrls: ['./course-checkout.component.scss']
})
export class CourseCheckoutComponent implements OnInit {
  private courseService = inject(CourseService);
  private paymentService = inject(PaymentService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  course = signal<Course | undefined>(undefined);
  customerForm: FormGroup;

  constructor() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      cpf: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
    });
  }

  async ngOnInit() {
    this.loadingService.show();
    try {
      const courseId = this.route.snapshot.params['id'];
      if (!courseId) {
        throw new Error('ID do curso não fornecido');
      }

      // Carrega o curso
      const courseData = await this.courseService.getById(courseId);
      if (!courseData) {
        throw new Error('Curso não encontrado');
      }
      this.course.set(courseData);

      // Monitora mudanças no email para verificar acesso ao curso
      this.customerForm.get('email')?.valueChanges.subscribe(async (email) => {
        if (email && this.course()) {
          // Verifica se existe uma assinatura ativa para o curso
          const subscription = await firstValueFrom(this.paymentService.getSubscription(email)) as FirestoreSubscription;
          if (subscription && subscription.courseId === this.course()!.id && subscription.status === 'ACTIVE') {
            this.notificationService.error('Você já possui uma assinatura ativa para este curso');
            return;
          }
        }
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.notificationService.error('Erro ao carregar dados do curso');
      this.router.navigate(['/courses']);
    } finally {
      this.loadingService.hide();
    }
  }

  async processPayment(paymentMethod: string) {
    if (!this.customerForm.valid) {
      this.notificationService.error('Por favor, preencha todos os campos corretamente');
      return;
    }

    if (!this.course()) {
      this.notificationService.error('Curso não encontrado');
      return;
    }

    try {
      this.loadingService.show();

      const email = this.customerForm.get('email')!.value;

      // Verifica se existe uma assinatura ativa para o curso
      const subscription = await firstValueFrom(this.paymentService.getSubscription(email)) as FirestoreSubscription;
      if (subscription && subscription.courseId === this.course()!.id && subscription.status === 'ACTIVE') {
        this.notificationService.error('Você já possui uma assinatura ativa para este curso');
        return;
      }

      const customerData: CustomerData = {
        name: this.customerForm.get('name')!.value,
        cpfCnpj: this.customerForm.get('cpf')!.value,
        email: email,
        phone: this.customerForm.get('phone')!.value,
        courseId: this.course()!.id
      };

      if (paymentMethod === 'CREDIT_CARD') {
        await firstValueFrom(this.paymentService.saveCustomerData(customerData));
        const response = await firstValueFrom(
          this.http.get<{url: string}>(
            `${environment.apiUrl}/createPaymentLink?courseId=${this.course()!.id}`
          )
        );
        
        if (response?.url) {
          window.location.href = response.url;
          return;
        }
        throw new Error('URL de pagamento não disponível');
      } else {
        const response = await firstValueFrom(this.paymentService.processPayment({
          amount: this.course()!.price,
          courseId: this.course()!.id,
          paymentMethod,
          customer: customerData.asaasId || ''
        }));

        if (!response) {
          throw new Error('Resposta do pagamento inválida');
        }

        if (paymentMethod === 'BOLETO' && response.bankSlipUrl) {
          window.location.href = response.bankSlipUrl;
        } else if (paymentMethod === 'PIX' && response.invoiceUrl) {
          window.location.href = response.invoiceUrl;
        } else {
          throw new Error('URL de pagamento não disponível');
        }
      }

      localStorage.setItem('currentPurchase', JSON.stringify({
        courseId: this.course()!.id
      }));

      this.router.navigate(['/payment/pending']);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      this.notificationService.error('Erro ao processar pagamento. Por favor, tente novamente.');
    } finally {
      this.loadingService.hide();
    }
  }

  async processSubscription() {
    if (!this.customerForm.valid) {
      this.notificationService.error('Por favor, preencha todos os campos corretamente');
      return;
    }

    if (!this.course()) {
      this.notificationService.error('Curso não encontrado');
      return;
    }

    try {
      this.loadingService.show();

      const email = this.customerForm.get('email')!.value;

      // Verifica se já existe uma assinatura ativa
      const subscription = await firstValueFrom(this.paymentService.getSubscription(email)) as FirestoreSubscription;
      if (subscription && subscription.courseId === this.course()!.id && subscription.status === 'ACTIVE') {
        this.notificationService.error('Você já possui uma assinatura ativa para este curso');
        this.router.navigate(['/course', this.course()!.id]);
        return;
      }

      const customerData: CustomerData = {
        name: this.customerForm.get('name')!.value,
        cpfCnpj: this.customerForm.get('cpf')!.value,
        email: email,
        phone: this.customerForm.get('phone')!.value,
        courseId: this.course()!.id
      };

      const subscriptionRequest: SubscriptionRequest = {
        customer: customerData,
        courseId: this.course()!.id,
        cycle: 'MONTHLY',
        value: this.course()!.price / 12 // Valor mensal
      };

      await firstValueFrom(this.paymentService.createSubscription(subscriptionRequest));

      localStorage.setItem('currentPurchase', JSON.stringify({
        courseId: this.course()!.id
      }));

      this.router.navigate(['/payment/pending']);
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      this.notificationService.error('Erro ao processar assinatura. Por favor, tente novamente.');
    } finally {
      this.loadingService.hide();
    }
  }
}
