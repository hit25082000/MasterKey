import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseService } from '../../../../features/course/services/course.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-status success">
      <i class="fas fa-check-circle"></i>
      <h1>Pagamento Realizado com Sucesso!</h1>
      <p>Seu acesso ao curso já está liberado.</p>
      <div class="actions">
        <button (click)="goToCourse()">Acessar o Curso</button>
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

      &.success {
        background: rgba(56, 74, 135, 0.1);

        i {
          color: #4CAF50;
          font-size: 4rem;
          margin-bottom: 1rem;
        }
      }

      h1 {
        color: #384A87;
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
export class PaymentSuccessComponent implements OnInit {
  private router = inject(Router);
  private courseService = inject(CourseService);

  async ngOnInit() {
    const purchaseData = localStorage.getItem('currentPurchase');
    if (purchaseData) {
      const { courseId } = JSON.parse(purchaseData);
      // Aqui você pode fazer verificações adicionais se necessário
      localStorage.removeItem('currentPurchase');
    }
  }

  goToCourse() {
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
