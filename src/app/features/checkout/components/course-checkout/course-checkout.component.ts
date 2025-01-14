import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
import { AsaasSubscriptionPayment } from '../../../../shared/models/asaas.model';

@Component({
  selector: 'app-course-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="checkout-page">
      <div class="checkout-container" *ngIf="course()">
        <div class="course-details">
          <h2>{{ course()?.name }}</h2>
          <p class="description">{{ course()?.description }}</p>
          <div class="price-info">
            <h3>Valor do Curso</h3>
            <p class="price">R$ {{ course()?.price | number:'1.2-2' }}</p>
            <p class="installments">ou até {{ course()?.portionCount }}x de R$ {{ (course()?.price || 0) / (course()?.portionCount || 1) | number:'1.2-2' }}</p>
          </div>
        </div>
        
        <form [formGroup]="customerForm" class="contact-form">
          <h3>Informações para Contato</h3>
          <div class="form-group">
            <label for="name">Nome Completo</label>
            <input type="text" id="name" formControlName="name" placeholder="Seu nome completo">
          </div>
          <div class="form-group">
            <label for="cpf">CPF</label>
            <input type="text" id="cpf" formControlName="cpf" placeholder="Seu CPF" maxlength="11">
          </div>
          <div class="form-group">
            <label for="email">E-mail</label>
            <input type="email" id="email" formControlName="email" placeholder="Seu e-mail">
          </div>
          <div class="form-group">
            <label for="phone">Telefone</label>
            <input type="tel" id="phone" formControlName="phone" placeholder="Seu telefone">
          </div>
        </form>

        <div class="payment-methods" *ngIf="customerForm.valid">
          <h3>Escolha a forma de pagamento</h3>
          <button class="payment-button pix" (click)="processPayment('PIX')">
            <div class="button-content">
              <i class="fas fa-qrcode"></i>
              <span>Pagar com PIX</span>
              <small>Aprovação instantânea</small>
            </div>
          </button>
          <button class="payment-button credit-card" (click)="processPayment('CREDIT_CARD')">
            <div class="button-content">
              <i class="fas fa-credit-card"></i>
              <span>Cartão de Crédito</span>
              <small>Até {{ course()?.portionCount }}x sem juros</small>
            </div>
          </button>
          <button class="payment-button boleto" (click)="processPayment('BOLETO')">
            <div class="button-content">
              <i class="fas fa-barcode"></i>
              <span>Boleto Bancário</span>
              <small>Vencimento em 3 dias</small>
            </div>
          </button>
          <button class="payment-button subscription" (click)="processSubscription()">
            Assinar (Pagamento Mensal)
            <small>12x de {{ (course()?.price || 0) / 12 | currency:'BRL' }}</small>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page {
      min-height: 100vh;
      padding: 2rem;
      background: linear-gradient(90deg, rgba(238, 60, 72, 0.2) 0%, rgba(56, 74, 135, 0.2) 100%), #000000;
    }

    .checkout-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    .course-details {
      color: #fff;
      margin-bottom: 2rem;

      h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      .description {
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
      }

      .price-info {
        background: rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        border-radius: 10px;

        h3 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .price {
          font-size: 2rem;
          font-weight: bold;
          color: #ee3c48;
        }

        .installments {
          font-size: 1rem;
          color: #aaa;
        }
      }
    }

    .contact-form {
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 10px;
      margin-bottom: 2rem;

      h3 {
        color: #fff;
        margin-bottom: 1.5rem;
        font-size: 1.5rem;
      }

      .form-group {
        margin-bottom: 1.5rem;

        label {
          display: block;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        input {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #ee3c48;
          }

          &::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
        }
      }
    }

    .payment-methods {
      h3 {
        color: #fff;
        margin-bottom: 1.5rem;
        font-size: 1.5rem;
      }

      .payment-button {
        width: 100%;
        padding: 1.5rem;
        margin-bottom: 1rem;
        border: none;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;

          i {
            font-size: 1.5rem;
          }

          span {
            font-size: 1.2rem;
            font-weight: 500;
          }

          small {
            color: #aaa;
            font-size: 0.9rem;
          }
        }

        &.pix {
          border: 1px solid #32bcad;
          i { color: #32bcad; }
        }

        &.credit-card {
          border: 1px solid #ee3c48;
          i { color: #ee3c48; }
        }

        &.boleto {
          border: 1px solid #384a87;
          i { color: #384a87; }
        }
      }

      .payment-button.subscription {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .payment-button.subscription small {
        font-size: 0.8rem;
        opacity: 0.9;
        margin-top: 0.5rem;
      }

      .payment-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }
  `]
})
export class CourseCheckoutComponent implements OnInit, OnDestroy {
  course = signal<Course | null>(null);
  customerForm: FormGroup;
  showPixPayment = false;
  pixQrCodeUrl = '';
  pixCopiaECola = '';
  invoiceUrl = '';
  paymentId = '';
  private paymentCheckInterval?: Subscription;
  subscriptionPayments: AsaasSubscriptionPayment[] = [];
  showPayments = false;
  selectedPaymentMethod: string = 'PIX';

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private http: HttpClient
  ) {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required]],
      phone: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourse(courseId);
    }
  }

  private async loadCourse(courseId: string) {
    try {
      this.loadingService.show();
      const course = await this.courseService.getById(courseId);
      if (!course) {
        throw new Error('Curso não encontrado');
      }
      this.course.set(course);
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      this.notificationService.error('Erro ao carregar informações do curso');
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

    try {
      this.loadingService.show();
      const courseData = this.course();
      
      if (!courseData) {
        throw new Error('Dados do curso não disponíveis');
      }

      if (paymentMethod === 'CREDIT_CARD') {
        try {
          // Salvar dados do cliente antes de redirecionar
          await this.paymentService.saveCustomerData({
            name: this.customerForm.get('name')?.value,
            email: this.customerForm.get('email')?.value,
            cpfCnpj: this.customerForm.get('cpf')?.value,
            phone: this.customerForm.get('phone')?.value,
            courseId: courseData.id
          }).toPromise();

          // Obter link de pagamento para cartão de crédito
          const response = await this.http.get<{url: string}>(
            `${environment.adminUrl}/createPaymentLink?courseId=${courseData.id}`
          ).toPromise();
          
          if (response?.url) {
            window.location.href = response.url;
            return;
          } else {
            throw new Error('URL de pagamento não disponível');
          }
        } catch (error) {
          console.error('Erro ao obter link de pagamento:', error);
          this.notificationService.error('Erro ao gerar link de pagamento. Tente novamente.');
          return;
        }
      }

      // Processamento para outros métodos de pagamento
      const response = await this.paymentService.processPayment({
        amount: courseData.price,
        courseId: courseData.id,
        paymentMethod,
        customer: {
          name: this.customerForm.get('name')?.value,
          email: this.customerForm.get('email')?.value,
          cpfCnpj: this.customerForm.get('cpf')?.value,
          phone: this.customerForm.get('phone')?.value,
          courseId: courseData.id
        }
      }).toPromise();

      if (!response) {
        throw new Error('Resposta do pagamento inválida');
      }

      if (response.invoiceUrl) {
        window.open(response.invoiceUrl, '_blank');
        this.startPaymentCheck(response.id);
      } else {
        this.notificationService.error('URL de pagamento não disponível');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      this.notificationService.error('Erro ao processar pagamento. Por favor, tente novamente.');
    } finally {
      this.loadingService.hide();
    }
  }

  startPaymentCheck(paymentId: string) {
    this.paymentCheckInterval?.unsubscribe();
    
    this.paymentCheckInterval = interval(5000)
      .pipe(
        switchMap(() => this.paymentService.checkPaymentStatus(paymentId)),
        takeWhile(status => !['RECEIVED', 'CONFIRMED', 'FAILED', 'CANCELLED'].includes(status.status), true)
      )
      .subscribe({
        next: (status) => {
          if (status.status === 'RECEIVED' || status.status === 'CONFIRMED') {
            this.notificationService.success('Pagamento confirmado! Em breve entraremos em contato.');
            this.router.navigate(['/courses']);
          } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
            this.notificationService.error('Pagamento não aprovado');
          }
        },
        error: (error) => {
          console.error('Erro ao verificar status:', error);
          this.notificationService.error('Erro ao verificar status do pagamento');
        }
      });
  }

  copyPixCode() {
    const input = document.createElement('input');
    input.value = this.pixCopiaECola;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    this.notificationService.success('Código PIX copiado!');
  }

  async processSubscription() {
    const currentCourse = this.course();
    if (!this.customerForm.valid || !currentCourse) {
      this.notificationService.error('Por favor, preencha todos os dados corretamente.');
      return;
    }

    this.loadingService.show();

    try {
      const customerData: CustomerData = {
        name: this.customerForm.get('name')?.value,
        email: this.customerForm.get('email')?.value,
        cpfCnpj: this.customerForm.get('cpf')?.value,
        phone: this.customerForm.get('phone')?.value,
        courseId: currentCourse.id
      };

      await this.paymentService.saveCustomerData(customerData).toPromise();

      const subscriptionRequest: SubscriptionRequest = {
        courseId: currentCourse.id,
        customer: customerData,
        cycle: 'MONTHLY',
        paymentMethod: 'BOLETO'
      };

      const response = await this.paymentService.createSubscription(subscriptionRequest).toPromise();

      console.log("resposta ao criar assinatura", response)

      if (response?.payment!.invoiceUrl) {
        window.location.href = response?.payment!.invoiceUrl;
      } else {
        this.notificationService.error('Erro ao gerar link de assinatura. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      this.notificationService.error('Erro ao processar assinatura. Tente novamente.');
    } finally {
      this.loadingService.hide();
    }
  }

  async createSubscription() {
    try {
      const response = await firstValueFrom(this.paymentService.createSubscription({
        courseId: this.course()?.id || '',
        customer: {
          name: this.customerForm.get('name')?.value,
          email: this.customerForm.get('email')?.value,
          cpfCnpj: this.customerForm.get('cpf')?.value,
          phone: this.customerForm.get('phone')?.value,
          courseId: this.course()?.id || ''
        },
        cycle: 'MONTHLY',
        paymentMethod: this.selectedPaymentMethod
      }));

      console.log("resposta ao criar assinatura",response)

      if (response?.subscription?.id) {
        // Buscar cobranças da assinatura
        this.paymentService.getSubscriptionPayments(response.subscription.id)
          .subscribe(
            payments => {
              this.subscriptionPayments = payments;
              this.showPayments = true;
            },
            error => {
              console.error('Erro ao buscar cobranças:', error);
            }
          );
      }

      // ... resto do código existente ...
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
    }
  }

  ngOnDestroy() {
    this.paymentCheckInterval?.unsubscribe();
  }
}
