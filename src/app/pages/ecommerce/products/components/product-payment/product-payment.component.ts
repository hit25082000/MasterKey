import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Router } from '@angular/router';
import { LoadingService } from '../../../../../shared/services/loading.service';

@Component({
  selector: 'app-product-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="payment-container">
      <h2>Escolha a forma de pagamento</h2>
      
      <div class="payment-methods">
        <button 
          [class.selected]="selectedMethod === 'PIX'"
          (click)="selectPaymentMethod('PIX')"
        >
          <i class="fas fa-qrcode"></i>
          PIX
        </button>
        
        <button 
          [class.selected]="selectedMethod === 'CREDIT_CARD'"
          (click)="selectPaymentMethod('CREDIT_CARD')"
        >
          <i class="fas fa-credit-card"></i>
          Crédito
        </button>
        
        <button 
          [class.selected]="selectedMethod === 'BOLETO'"
          (click)="selectPaymentMethod('BOLETO')"
        >
          <i class="fas fa-barcode"></i>
          Boleto
        </button>
      </div>

      @if (selectedMethod === 'PIX') {
        <div class="pix-container">
          <p>Pague instantaneamente usando PIX</p>
          <button (click)="processPayment()">Gerar QR Code PIX</button>
        </div>
      }

      @if (selectedMethod === 'CREDIT_CARD') {
        <div class="credit-card-container">
          <form (ngSubmit)="processPayment()">
            <div class="form-group">
              <label>Nome no Cartão</label>
              <input type="text" [(ngModel)]="creditCardInfo.holderName" name="holderName" required>
            </div>
            
            <div class="form-group">
              <label>Número do Cartão</label>
              <input type="text" [(ngModel)]="creditCardInfo.number" name="number" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Mês</label>
                <input type="text" [(ngModel)]="creditCardInfo.expiryMonth" name="expiryMonth" required>
              </div>
              
              <div class="form-group">
                <label>Ano</label>
                <input type="text" [(ngModel)]="creditCardInfo.expiryYear" name="expiryYear" required>
              </div>
              
              <div class="form-group">
                <label>CCV</label>
                <input type="text" [(ngModel)]="creditCardInfo.ccv" name="ccv" required>
              </div>
            </div>

            <div class="form-group">
              <label>CPF/CNPJ</label>
              <input type="text" [(ngModel)]="creditCardInfo.holderInfo.cpfCnpj" name="cpfCnpj" required>
            </div>

            <div class="form-group">
              <label>CEP</label>
              <input type="text" [(ngModel)]="creditCardInfo.holderInfo.postalCode" name="postalCode" required>
            </div>

            <div class="form-group">
              <label>Número</label>
              <input type="text" [(ngModel)]="creditCardInfo.holderInfo.addressNumber" name="addressNumber" required>
            </div>

            <div class="form-group">
              <label>Telefone</label>
              <input type="text" [(ngModel)]="creditCardInfo.holderInfo.phone" name="phone" required>
            </div>

            <button type="submit">Pagar com Cartão</button>
          </form>
        </div>
      }

      @if (selectedMethod === 'BOLETO') {
        <div class="boleto-container">
          <p>Você receberá o boleto por email</p>
          <button (click)="processPayment()">Gerar Boleto</button>
        </div>
      }

      @if (paymentResponse) {
        <div class="payment-response">
          @if (paymentResponse.billingType === 'PIX') {
            <div class="qr-code-container">
              <h3>QR Code PIX</h3>
              <img [src]="paymentResponse.pixQrCodeUrl" alt="QR Code PIX">
              <p>Escaneie o QR Code acima para pagar</p>
            </div>
          }

          @if (paymentResponse.billingType === 'BOLETO') {
            <div class="boleto-info">
              <h3>Boleto Gerado</h3>
              <p>O boleto foi enviado para seu email</p>
              <a [href]="paymentResponse.bankSlipUrl" target="_blank">
                Clique aqui para visualizar o boleto
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .payment-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .payment-methods {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;

      button {
        flex: 1;
        padding: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;

        i {
          font-size: 1.5rem;
        }

        &.selected {
          border-color: #384A87;
          background: rgba(56, 74, 135, 0.1);
        }

        &:hover {
          transform: translateY(-2px);
        }
      }
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: #4a5568;
      }

      input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #384A87;
        }
      }
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    button[type="submit"] {
      width: 100%;
      padding: 1rem;
      background: #384A87;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #2d3a6d;
      }
    }

    .payment-response {
      margin-top: 2rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      text-align: center;

      img {
        max-width: 200px;
        margin: 1rem auto;
      }

      a {
        color: #384A87;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class ProductPaymentComponent {
  @Input() courseId!: string;
  @Input() amount!: number;

  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  selectedMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | null = null;
  paymentResponse: any = null;

  creditCardInfo = {
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    holderInfo: {
      name: '',
      email: '',
      cpfCnpj: '',
      postalCode: '',
      addressNumber: '',
      phone: ''
    }
  };

  selectPaymentMethod(method: 'PIX' | 'CREDIT_CARD' | 'BOLETO') {
    this.selectedMethod = method;
    this.paymentResponse = null;
  }

  async processPayment() {
    if (!this.selectedMethod) {
      this.notificationService.error('Selecione um método de pagamento');
      return;
    }

    this.loadingService.show();

    try {
      const response = await this.paymentService.processPayment(
        this.amount,
        this.courseId,
        this.selectedMethod,
        this.selectedMethod === 'CREDIT_CARD' ? this.creditCardInfo : undefined
      ).toPromise();

      this.paymentResponse = response;
      
      if (response?.status === 'CONFIRMED') {
        this.notificationService.success('Pagamento confirmado com sucesso!');
        this.router.navigate(['/admin/courses', this.courseId]);
      } else {
        this.notificationService.info('Aguardando confirmação do pagamento...');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      this.notificationService.error('Erro ao processar pagamento');
    } finally {
      this.loadingService.hide();
    }
  }
}
