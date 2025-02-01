import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { AsaasService } from '../../../core/services/asaas.service';
import { firstValueFrom } from 'rxjs';

interface SubscriptionData {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  description: string;
  totalValue: number;
  installments: number;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

interface PaymentData {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: any;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatSelectModule
  ],
  providers: [],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent implements OnInit {
  @Input() courseId: string = '';
  @Input() courseValue: number = 0;
  @Input() maxInstallments: number = 12;
  @Input() interestRate: number = 2.99; // Taxa de juros mensal para parcelamento

  isSubscription: boolean = false;
  customerForm!: FormGroup;
  creditCardForm!: FormGroup;
  selectedPaymentType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' = 'PIX';
  selectedCycle: 'MONTHLY' = 'MONTHLY';
  loading = false;
  pixQRCode: string = '';
  paymentUrl: string = '';

  availableSubscriptionOptions: Array<{
    cycle: 'MONTHLY';
    label: string;
    value: number;
    months: number;
    disabled: boolean;
  }> = [];

  constructor(
    private fb: FormBuilder,
    private asaasService: AsaasService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.calculateSubscriptionOptions();
  }

  initializeForms() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cpfCnpj: ['', Validators.required],
      phone: ['', Validators.required],
      postalCode: ['', Validators.required],
      addressNumber: ['', Validators.required]
    });

    this.creditCardForm = this.fb.group({
      holderName: ['', Validators.required],
      number: ['', Validators.required],
      expiryMonth: ['', Validators.required],
      expiryYear: ['', Validators.required],
      ccv: ['', Validators.required],
      installments: [1] // Novo campo para número de parcelas
    });
  }

  onPaymentTypeChange(type: 'BOLETO' | 'CREDIT_CARD' | 'PIX') {
    this.selectedPaymentType = type;
    this.pixQRCode = '';
    this.paymentUrl = '';
  }

  onCycleChange(cycle: 'MONTHLY') {
    this.selectedCycle = cycle;
  }

  getCycleLabel(cycle: string): string {
    const labels = {
      'MONTHLY': 'Mensal',
      'QUARTERLY': 'Trimestral',
      'YEARLY': 'Anual'
    };
    return labels[cycle as keyof typeof labels] || cycle;
  }

  isFormValid(): boolean {
    if (!this.customerForm.valid) return false;
    if (this.selectedPaymentType === 'CREDIT_CARD' && this.isSubscription && !this.creditCardForm.valid) return false;
    return true;
  }

  private calculateSubscriptionOptions() {
    const baseMonthlyValue = this.courseValue / this.maxInstallments;

    this.availableSubscriptionOptions = [
      {
        cycle: 'MONTHLY',
        label: 'Mensal',
        value: baseMonthlyValue,
        months: 1,
        disabled: false
      }
    ];

    const firstAvailable = this.availableSubscriptionOptions.find(opt => !opt.disabled);
    if (firstAvailable) {
      this.selectedCycle = firstAvailable.cycle;
    }
  }

  getSubscriptionValue(): number {
    const option = this.availableSubscriptionOptions.find(opt => opt.cycle === this.selectedCycle);
    return option ? option.value : 0;
  }

  getInstallmentsCount(): number {
    const option = this.availableSubscriptionOptions.find(opt => opt.cycle === this.selectedCycle);
    return option ? Math.ceil(this.maxInstallments / option.months) : 0;
  }

  async processPayment(isSubscription: boolean) {
    if (!this.isFormValid()) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'OK', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      const customerData = {
        ...this.customerForm.value,
        postalCode: this.formatPostalCode(this.customerForm.value.postalCode)
      };

      const customerResponse = await firstValueFrom(this.asaasService.createCustomer(customerData));

      if (!customerResponse || !customerResponse.customerId) {
        throw new Error('Falha ao criar cliente');
      }

      if (isSubscription) {
        const subscriptionValue = this.getSubscriptionValue();
        const subscriptionData: SubscriptionData = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          value: subscriptionValue,
          nextDueDate: new Date().toISOString().split('T')[0],
          cycle: this.selectedCycle,
          description: `Assinatura do curso ${this.courseId} - ${this.getCycleLabel(this.selectedCycle)}`,
          totalValue: this.courseValue,
          installments: this.getInstallmentsCount()
        };

        if (this.selectedPaymentType === 'CREDIT_CARD') {
          subscriptionData.creditCard = this.creditCardForm.value;
          subscriptionData.creditCardHolderInfo = {
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpfCnpj,
            postalCode: customerData.postalCode,
            addressNumber: customerData.addressNumber,
            phone: customerData.phone
          };
        }

        const subscriptionResponse = await firstValueFrom(
          this.asaasService.createSubscription(subscriptionData, this.courseId)
        );

        if (subscriptionResponse) {
          this.handlePaymentResponse(subscriptionResponse);
          this.snackBar.open('Assinatura criada com sucesso!', 'OK', { duration: 3000 });
        }
      } else {
        const paymentData: PaymentData = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          value: this.courseValue,
          dueDate: new Date().toISOString().split('T')[0],
          description: `Pagamento do curso ${this.courseId}`
        };

        if (this.selectedPaymentType === 'CREDIT_CARD') {
          paymentData.creditCardHolderInfo = {
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpfCnpj,
            postalCode: customerData.postalCode,
            addressNumber: customerData.addressNumber,
            phone: customerData.phone
          };
        }

        const paymentResponse = await firstValueFrom(
          this.asaasService.createPayment(paymentData, this.courseId)
        );

        if (paymentResponse) {
          this.handlePaymentResponse(paymentResponse);
          const msg = this.selectedPaymentType === 'CREDIT_CARD' 
            ? 'Você será redirecionado para a página de pagamento do cartão'
            : 'Pagamento criado com sucesso!';
          this.snackBar.open(msg, 'OK', { duration: 5000 });

          // Redirecionar para a página de pagamento do Asaas
          if (paymentResponse.invoiceUrl) {
            window.location.href = paymentResponse.invoiceUrl;
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar operação:', error);
      this.snackBar.open(
        error instanceof Error ? error.message : 'Erro ao processar operação',
        'OK',
        { duration: 5000 }
      );
    } finally {
      this.loading = false;
    }
  }

  handlePaymentResponse(response: any) {
    if (response.bankSlipUrl) {
      this.paymentUrl = response.bankSlipUrl;
    }
    if (response.invoiceUrl) {
      this.paymentUrl = response.invoiceUrl;
    }
    if (response.pixQrCodeUrl) {
      this.pixQRCode = response.pixQrCodeUrl;
    }
  }

  openPaymentUrl() {
    if (this.paymentUrl) {
      window.open(this.paymentUrl, '_blank');
    }
  }

  private formatPostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, '');
  }
} 
