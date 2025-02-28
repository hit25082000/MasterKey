import { Component, inject, input, Input, OnInit, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { AsaasService } from '../../../core/services/asaas.service';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import { AsaasInstallmentPayment, AsaasPayment } from '../../services/payment.service';
import { Course } from '../../../core/models/course.model';

interface SubscriptionData {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  description: string;
  totalValue: number;
  installments: number;
  maxInstallments: number;
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

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  providers: [],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent implements OnInit {
  course = input.required<Course>(); 

  @Input() maxInstallments!: number;
  @Input() interestRate: number = 0; // Taxa de juros mensal para parcelamento

  isSubscription: boolean = false;
  isInstallment: boolean = false;
  customerForm!: FormGroup;
  creditCardForm!: FormGroup;
  installmentForm!: FormGroup;
  selectedPaymentType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' = 'PIX';
  selectedCycle: 'MONTHLY' = 'MONTHLY';
  private loadingService = inject(LoadingService)
  pixQRCode: string = '';
  paymentUrl: string = '';

  paymentOption = signal<'single' | 'installment' | 'subscription'>('single');

  availableSubscriptionOptions: Array<{
    cycle: 'MONTHLY';
    label: string;
    value: number;
    months: number;
    disabled: boolean;
  }> = [];

  installmentOptions: Array<{value: number, label: string, installmentValue: number}> = [];

  constructor(
    private fb: FormBuilder,
    private asaasService: AsaasService,
    private snackBar: MatSnackBar
  ) {
    effect(() => {
      // Quando o course mudar, recalcular os valores
      if (this.course()) {
        this.calculateSubscriptionOptions();
        this.calculateInstallmentOptions();
      }
    });
  }

  ngOnInit() {
    this.initializeForms();
    this.calculateSubscriptionOptions();
    this.calculateInstallmentOptions();
  }

  initializeForms() {
    // Calcula a data do próximo mês
    const dataProximoMes = new Date();
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);
    dataProximoMes.setDate(1); // Define para o primeiro dia do próximo mês
    
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
      installments: [1]
    });

    this.installmentForm = this.fb.group({
      installmentCount: [1, [Validators.required, Validators.min(1), Validators.max(this.maxInstallments)]],
      dueDate: [dataProximoMes.toISOString().split('T')[0], Validators.required]
    });

    // Atualizar valor da parcela quando mudar o número de parcelas
    this.installmentForm.get('installmentCount')?.valueChanges.subscribe(count => {
      this.updateInstallmentValue(count);
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
    const baseMonthlyValue = this.course().price / this.maxInstallments;

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

  calculateInstallmentOptions() {
    this.installmentOptions = [];
    for (let i = 1; i <= this.maxInstallments; i++) {
      const installmentValue = this.course().price / i;
      this.installmentOptions.push({
        value: i,
        label: `${i}x de R$ ${installmentValue.toFixed(2)}`,
        installmentValue: installmentValue
      });
    }
  }

  calculateInstallmentValue(installments: number): number {
    return this.course().price / installments;
  }

  updateInstallmentValue(installments: number) {
    const option = this.installmentOptions.find(opt => opt.value === installments);
    if (option) {
      this.installmentForm.patchValue({
        installmentValue: option.installmentValue
      }, { emitEvent: false });
    }
  }

  onPaymentOptionChange(value: 'single' | 'installment' | 'subscription') {
    this.paymentOption.set(value);
    if (value === 'single') {
      this.isInstallment = false;
      this.isSubscription = false;
    } else if (value === 'installment') {
      this.isInstallment = true;
      this.isSubscription = false;
    } else {
      this.isInstallment = false;
      this.isSubscription = true;
    }
  }

  updatePaymentOption(value: any) {
    this.paymentOption.set(value);
    this.onPaymentOptionChange(value);
  }

  async processPayment(isSubscription: boolean = false) {
    if (!this.isFormValid()) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'OK', { duration: 3000 });
      return;
    }

    this.loadingService.show();

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
        const subscriptionData = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          nextDueDate: new Date().toISOString().split('T')[0],
          cycle: this.selectedCycle,
          courseId: this.course().id,
          maxInstallments: this.maxInstallments
        };

        const subscriptionResponse = await firstValueFrom(
          this.asaasService.createSubscription(subscriptionData)
        );

        if (subscriptionResponse?.firstPayment) {
          this.handlePaymentResponse(subscriptionResponse.firstPayment);
          if (subscriptionResponse.firstPayment.invoiceUrl) {
            window.location.href = subscriptionResponse.firstPayment.invoiceUrl;
          }
        } else {
          this.snackBar.open('Assinatura criada com sucesso!', 'OK', { duration: 3000 });
        }
      } else if (this.isInstallment) {
        const installmentData = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          installmentCount: this.installmentForm.get('installmentCount')?.value || 1,
          dueDate: this.installmentForm.get('dueDate')?.value,
          courseId: this.course().id
        };

        const paymentResponse = await firstValueFrom(
          this.asaasService.createInstallmentPayment(installmentData)
        );
        
        if (paymentResponse) {
          this.handlePaymentResponse(paymentResponse);
          if (paymentResponse.invoiceUrl) {
            window.location.href = paymentResponse.invoiceUrl;
          }
        }
      } else {
        const paymentData = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          paymentMethod: this.selectedPaymentType,
          dueDate: new Date().toISOString().split('T')[0],
          courseId: this.course().id
        };

        const paymentResponse = await firstValueFrom(
          this.asaasService.createPayment(paymentData)
        );

        if (paymentResponse) {
          this.handlePaymentResponse(paymentResponse);
          if (paymentResponse['invoiceUrl']) {
            window.location.href = paymentResponse['invoiceUrl'];
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
      this.loadingService.hide();
      this.resetForms();
    }
  }

  private resetForms() {
    const dataProximoMes = new Date();
    dataProximoMes.setMonth(dataProximoMes.getMonth() + 1);
    dataProximoMes.setDate(1);

    this.customerForm.reset();
    this.creditCardForm.reset();
    this.installmentForm.reset({
      installmentCount: 1,
      dueDate: dataProximoMes.toISOString().split('T')[0]
    });
    this.isInstallment = false;
    this.isSubscription = false;
    this.selectedPaymentType = 'PIX';
    this.pixQRCode = '';
    this.paymentUrl = '';
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

  private formatPostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, '');
  }

  getPaymentTypeIcon(type: string): string {
    switch (type) {
      case 'PIX':
        return 'qr_code';
      case 'BOLETO':
        return 'receipt';
      case 'CREDIT_CARD':
        return 'credit_card';
      default:
        return 'payments';
    }
  }

  getPaymentTypeLabel(type: string): string {
    switch (type) {
      case 'PIX':
        return 'PIX';
      case 'BOLETO':
        return 'Boleto';
      case 'CREDIT_CARD':
        return 'Crédito';
      default:
        return 'Selecione';
    }
  }

  getPaymentOptionIcon(option: string): string {
    switch (option) {
      case 'single':
        return 'payments';
      case 'installment':
        return 'calendar_month';
      case 'subscription':
        return 'sync';
      default:
        return 'payments';
    }
  }

  getPaymentOptionLabel(option: string): string {
    switch (option) {
      case 'single':
        return 'À Vista';
      case 'installment':
        return 'Parcelado';
      case 'subscription':
        return 'Assinatura';
      default:
        return 'Selecione';
    }
  }
} 
