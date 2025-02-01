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
  template: `
    <div class="payment-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Opções de Pagamento</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <mat-tab-group>
            <!-- Tab de Pagamento Único -->
            <mat-tab label="Pagamento Único">
              <div class="tab-content">
                <div class="payment-type-section">
                  <mat-button-toggle-group [(ngModel)]="selectedPaymentType" (change)="onPaymentTypeChange($event.value)">
                    <mat-button-toggle value="PIX">PIX</mat-button-toggle>
                    <mat-button-toggle value="BOLETO">Boleto</mat-button-toggle>
                    <mat-button-toggle value="CREDIT_CARD">Crédito</mat-button-toggle>
                  </mat-button-toggle-group>
                </div>

                <div class="payment-info">
                  <p class="total-amount">Valor Total: R$ {{ courseValue | number:'1.2-2' }}</p>
                </div>

                <!-- Formulários compartilhados -->
                <ng-container *ngTemplateOutlet="sharedForms"></ng-container>

                <button mat-raised-button color="primary" 
                        (click)="processPayment(false)" 
                        [disabled]="loading || !isFormValid()">
                  <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                  <span *ngIf="!loading">Pagar Agora</span>
                </button>
              </div>
            </mat-tab>

            <!-- Tab de Assinatura -->
            <mat-tab label="Pagamento Recorrente">
              <div class="tab-content">
                <div class="payment-type-section">
                  <mat-button-toggle-group [(ngModel)]="selectedPaymentType" (change)="onPaymentTypeChange($event.value)">
                    <mat-button-toggle value="PIX">PIX</mat-button-toggle>
                    <mat-button-toggle value="BOLETO">Boleto</mat-button-toggle>
                    <mat-button-toggle value="CREDIT_CARD">Crédito</mat-button-toggle>
                  </mat-button-toggle-group>
                </div>

                <div class="subscription-options">
                  <mat-button-toggle-group [(ngModel)]="selectedCycle" (change)="onCycleChange($event.value)">
                    <mat-button-toggle *ngFor="let option of availableSubscriptionOptions" 
                                     [value]="option.cycle"
                                     [disabled]="option.disabled">
                      {{ option.label }}
                      <div class="option-value">R$ {{ option.value | number:'1.2-2' }}/mês</div>
                    </mat-button-toggle>
                  </mat-button-toggle-group>
                </div>

                <div class="payment-info">
                  <p class="total-amount">Valor da Assinatura: R$ {{ getSubscriptionValue() | number:'1.2-2' }}</p>
                  <p class="cycle-info">Ciclo: {{ getCycleLabel(selectedCycle) }}</p>
                  <p class="installments-info">Total de parcelas: {{ getInstallmentsCount() }}</p>
                  <p class="total-info">Valor total do curso: R$ {{ courseValue | number:'1.2-2' }}</p>
                </div>

                <!-- Formulários compartilhados -->
                <ng-container *ngTemplateOutlet="sharedForms"></ng-container>

                <button mat-raised-button color="primary" 
                        (click)="processPayment(true)" 
                        [disabled]="loading || !isFormValid()">
                  <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                  <span *ngIf="!loading">Assinar Agora</span>
                </button>
              </div>
            </mat-tab>
          </mat-tab-group>

          <!-- Template com formulários compartilhados -->
          <ng-template #sharedForms>
            <form [formGroup]="customerForm" class="form-section">
              <mat-form-field>
                <mat-label>Nome Completo</mat-label>
                <input matInput formControlName="name" required>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
              </mat-form-field>

              <mat-form-field>
                <mat-label>CPF/CNPJ</mat-label>
                <input matInput formControlName="cpfCnpj" required>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Telefone</mat-label>
                <input matInput formControlName="phone" required>
              </mat-form-field>

              <mat-form-field>
                <mat-label>CEP</mat-label>
                <input matInput formControlName="postalCode" required>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Número</mat-label>
                <input matInput formControlName="addressNumber" required>
              </mat-form-field>
            </form>

            <form *ngIf="selectedPaymentType === 'CREDIT_CARD'" [formGroup]="creditCardForm" class="form-section">
              <mat-form-field>
                <mat-label>Nome no Cartão</mat-label>
                <input matInput formControlName="holderName" required>
              </mat-form-field>

              <mat-form-field>
                <mat-label>Número do Cartão</mat-label>
                <input matInput formControlName="number" required>
              </mat-form-field>

              <div class="card-details">
                <mat-form-field>
                  <mat-label>Mês</mat-label>
                  <input matInput formControlName="expiryMonth" required>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>Ano</mat-label>
                  <input matInput formControlName="expiryYear" required>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>CCV</mat-label>
                  <input matInput formControlName="ccv" required>
                </mat-form-field>
              </div>

              <!-- Seleção de Parcelas -->
              <mat-form-field *ngIf="!isSubscription && selectedPaymentType === 'CREDIT_CARD'">
                <mat-label>Parcelas</mat-label>
                <mat-select formControlName="installments" (selectionChange)="onInstallmentChange($event.value)">
                  <mat-option *ngFor="let option of installmentOptions" [value]="option.number">
                    {{ option.number }}x de R$ {{ option.value | number:'1.2-2' }} sem juros
                  </mat-option>
                </mat-select>
                <mat-hint>Parcele em até {{ maxInstallments }}x sem juros</mat-hint>
              </mat-form-field>
            </form>
          </ng-template>

          <!-- QR Code PIX -->
          <div *ngIf="pixQRCode" class="pix-section">
            <img [src]="pixQRCode" alt="QR Code PIX">
            <p>Escaneie o QR Code para pagar</p>
          </div>

          <!-- Link do Boleto -->
          <div *ngIf="paymentUrl" class="boleto-section">
            <p>Clique no botão abaixo para acessar o {{ selectedPaymentType === 'BOLETO' ? 'boleto' : 'comprovante' }}</p>
            <button mat-raised-button color="accent" (click)="openPaymentUrl()">
              Abrir {{ selectedPaymentType === 'BOLETO' ? 'Boleto' : 'Comprovante' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .payment-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .tab-content {
      padding: 20px 0;
    }

    .payment-type-section,
    .subscription-options {
      margin: 20px 0;
      display: flex;
      justify-content: center;
    }

    mat-button-toggle-group {
      display: flex;
      width: 100%;
      max-width: 400px;
    }

    mat-button-toggle {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 12px;
      min-width: 0;
    }

    .form-section {
      margin: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    .card-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .payment-info {
      margin: 20px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .total-amount {
      font-size: 1.2em;
      font-weight: bold;
      margin: 0;
    }

    .cycle-info {
      margin: 8px 0 0;
      color: #666;
    }

    .pix-section,
    .boleto-section {
      margin-top: 20px;
      text-align: center;
    }

    .pix-section img {
      max-width: 200px;
      margin: 10px auto;
    }

    button[mat-raised-button] {
      width: 100%;
      margin-top: 20px;
      height: 48px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    @media (max-width: 600px) {
      .card-details {
        grid-template-columns: 1fr;
      }

      mat-button-toggle-group {
        max-width: 100%;
      }

      mat-button-toggle {
        padding: 0 8px;
        font-size: 0.9em;
      }
    }

    .subscription-options mat-button-toggle {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 16px;
      line-height: 1.2;
    }

    .option-value {
      font-size: 0.85em;
      color: #666;
      margin-top: 4px;
    }

    .payment-info {
      margin: 20px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .total-amount, .cycle-info, .installments-info, .total-info {
      margin: 8px 0;
    }

    .total-amount {
      font-size: 1.2em;
      font-weight: bold;
      color: #2196F3;
    }

    .cycle-info, .installments-info {
      color: #666;
    }

    .total-info {
      font-weight: 500;
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 12px;
    }

    .interest-info {
      font-size: 0.85em;
      color: #666;
      margin-left: 8px;
    }

    mat-select {
      width: 100%;
    }

    mat-hint {
      color: #2196F3;
      font-weight: 500;
    }
  `]
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

  installmentOptions: Array<{
    number: number;
    value: number;
  }> = [];

  constructor(
    private fb: FormBuilder,
    private asaasService: AsaasService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.calculateSubscriptionOptions();
    this.calculateInstallmentOptions();
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
    if (this.selectedPaymentType === 'CREDIT_CARD' && !this.creditCardForm.valid) return false;
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

  calculateInstallmentOptions() {
    this.installmentOptions = [];
    
    // Calcular parcelas sem juros
    for (let i = 1; i <= this.maxInstallments; i++) {
      const installmentValue = this.courseValue / i;
      
      this.installmentOptions.push({
        number: i,
        value: installmentValue
      });
    }
  }

  onInstallmentChange(installments: number) {
    const option = this.installmentOptions.find(opt => opt.number === installments);
    if (option) {
      this.creditCardForm.patchValue({
        installments: installments
      });
    }
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
        const selectedInstallment = this.installmentOptions.find(
          opt => opt.number === this.creditCardForm.value.installments
        );

        const paymentData: PaymentData = {
          customer: customerResponse.customerId,
          billingType: this.selectedPaymentType,
          value: this.courseValue,
          dueDate: new Date().toISOString().split('T')[0],
          description: `Pagamento do curso ${this.courseId}`,
          installmentCount: this.selectedPaymentType === 'CREDIT_CARD' ? 
            this.creditCardForm.value.installments : undefined,
          installmentValue: selectedInstallment?.value
        };

        if (this.selectedPaymentType === 'CREDIT_CARD') {
          paymentData.creditCard = {
            ...this.creditCardForm.value,
            installments: this.creditCardForm.value.installments
          };
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
          const msg = this.selectedPaymentType === 'CREDIT_CARD' && this.creditCardForm.value.installments > 1 
            ? `Pagamento criado com sucesso! Parcelado em ${this.creditCardForm.value.installments}x de R$ ${selectedInstallment?.value.toFixed(2)}`
            : 'Pagamento criado com sucesso!';
          this.snackBar.open(msg, 'OK', { duration: 3000 });
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
