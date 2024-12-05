import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-status failure">
      <i class="fas fa-times-circle"></i>
      <h1>Falha no Pagamento</h1>
      <p>Infelizmente houve um problema ao processar seu pagamento.</p>
      <div class="actions">
        <button (click)="tryAgain()">Tentar Novamente</button>
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

      &.failure {
        background: rgba(238, 60, 72, 0.1);

        i {
          color: #ee3c48;
          font-size: 4rem;
          margin-bottom: 1rem;
        }
      }

      h1 {
        color: #ee3c48;
        margin-bottom: 1rem;
      }

      p {
        color: #666;
        margin-bottom: 2rem;
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
export class PaymentFailureComponent {
  private router = inject(Router);

  tryAgain() {
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
