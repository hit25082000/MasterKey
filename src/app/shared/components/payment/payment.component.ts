import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsaasService } from '../../../core/services/asaas.service';
import { AsaasCustomer, AsaasPayment, AsaasSubscription } from '../../../core/interfaces/asaas.interface';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNgxMask } from 'ngx-mask';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  providers: [],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  @Input() courseId: string = '';
  @Input() courseValue: number = 0;
  @Input() isRecurring: boolean = false;

  paymentForm!: FormGroup;
  customerForm!: FormGroup;
  creditCardForm!: FormGroup;
  loading = false;
  selectedPaymentType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' = 'PIX';
  pixQRCode: string = '';
  paymentUrl: string = '';

  constructor(
    private fb: FormBuilder,
    private asaasService: AsaasService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initializeForms();
  }

  private initializeForms() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cpfCnpj: ['', [Validators.required, Validators.minLength(11)]],
      phone: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      addressNumber: ['', Validators.required]
    });

    this.creditCardForm = this.fb.group({
      holderName: ['', Validators.required],
      number: ['', [Validators.required, Validators.minLength(16)]],
      expiryMonth: ['', [Validators.required, Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.minLength(4)]],
      ccv: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.paymentForm = this.fb.group({
      billingType: [this.selectedPaymentType],
      value: [this.courseValue],
      dueDate: [new Date().toISOString().split('T')[0]],
      description: [`Pagamento do curso ${this.courseId}`],
      cycle: ['MONTHLY']
    });
  }

  private formatPostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, '');
  }

  async processPayment() {
    if (!this.customerForm.valid || (this.selectedPaymentType === 'CREDIT_CARD' && !this.creditCardForm.valid)) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios', 'OK', { duration: 3000 });
      return;
    }

    this.loading = true;

    try {
      // Primeiro, criar cliente
      const customerData = {
        ...this.customerForm.value,
        postalCode: this.formatPostalCode(this.customerForm.value.postalCode)
      };

      const customerResponse = await firstValueFrom(this.asaasService.createCustomer(customerData));

      if (!customerResponse || !customerResponse.customerId) {
        throw new Error('Falha ao criar cliente');
      }
      console.log(customerResponse)
      if (this.isRecurring) {
        // Criar assinatura
        const subscriptionData: AsaasSubscription = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          value: this.courseValue,
          nextDueDate: this.paymentForm.get('dueDate')?.value || new Date().toISOString().split('T')[0],
          description: this.paymentForm.get('description')?.value || '',
          cycle: this.paymentForm.get('cycle')?.value || 'MONTHLY'
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

        if (subscriptionResponse?.payment) {
          this.handlePaymentResponse(subscriptionResponse.payment);
        }

        this.handleSuccess('Assinatura criada com sucesso!');
      } else {
        // Criar pagamento único
        const paymentData: AsaasPayment = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          value: this.courseValue,
          dueDate: this.paymentForm.get('dueDate')?.value || new Date().toISOString().split('T')[0],
          description: this.paymentForm.get('description')?.value || ''
        };

        if (this.selectedPaymentType === 'CREDIT_CARD') {
          paymentData.creditCard = this.creditCardForm.value;
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
        }

        this.handleSuccess('Pagamento criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      this.loading = false;
      this.snackBar.open(
        error instanceof Error ? error.message : 'Erro ao processar pagamento',
        'OK',
        { duration: 5000 }
      );
    }
  }

  private handlePaymentResponse(payment: any) {
    if (this.selectedPaymentType === 'PIX' && payment.pixQrCode) {
      this.pixQRCode = payment.pixQrCode;
    } else if (this.selectedPaymentType === 'BOLETO' && payment.bankSlipUrl) {
      this.paymentUrl = payment.bankSlipUrl;
      window.open(this.paymentUrl, '_blank');
    }
  }

  private handleSuccess(message: string) {
    this.loading = false;
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  onPaymentTypeChange(type: 'BOLETO' | 'CREDIT_CARD' | 'PIX') {
    this.selectedPaymentType = type;
    this.paymentForm.patchValue({ billingType: type });
  }
} 
