import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-pending',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-status pending">
      <i class="fas fa-clock"></i>
      <h1>Pagamento em Processamento</h1>
      <p>Seu pagamento está sendo processado. Assim que confirmado, você receberá um e-mail com as instruções de acesso.</p>
      <div class="actions">
        <button (click)="checkStatus()">Verificar Status</button>
        <button (click)="goToHome()">Voltar para Home</button>
      </div>
    </div>
  `,
  styles: [`
    .payment-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
      text-align: center;

      &.pending {
        background: rgba(255, 193, 7, 0.1);

        i {
          color: #FFC107;
          font-size: 4rem;
          margin-bottom: 1rem;
        }
      }

      h1 {
        color: #FFC107;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
        max-width: 600px;
      }

      .actions {
        display: flex;
        gap: 1rem;

        button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;

          &:first-child {
            background: #384A87;
            color: white;

            &:hover {
              background: darken(#384A87, 10%);
            }
          }

          &:last-child {
            background: #ee3c48;
            color: white;

            &:hover {
              background: darken(#ee3c48, 10%);
            }
          }
        }
      }
    }
  `]
})
export class PaymentPendingComponent {
  private router = inject(Router);

  checkStatus() {
    const purchaseData = localStorage.getItem('currentPurchase');
    if (purchaseData) {
      const { courseId } = JSON.parse(purchaseData);
      this.router.navigate(['/course', courseId]);
    } else {
      this.router.navigate(['/courses']);
    }
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
