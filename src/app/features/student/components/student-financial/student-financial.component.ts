import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';

interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  paymentUrl?: string;
  paidAt?: string;
}

@Component({
  selector: 'app-student-financial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-financial.component.html',
  styleUrls: ['./student-financial.component.scss']
})
export class StudentFinancialComponent {
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  loading = signal<boolean>(false);
  payments = signal<Payment[]>([]);

  pendingCount = computed(() => 
    this.payments().filter(p => p.status === 'pending').length
  );

  paidCount = computed(() => 
    this.payments().filter(p => p.status === 'approved').length
  );

  constructor() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.loadPayments(userId);
    }
  }

  private async loadPayments(userId: string) {
    this.loading.set(true);
    try {
      // TODO: Implementar serviço para buscar pagamentos
      // Dados mockados para exemplo
      const mockPayments: Payment[] = [
        {
          id: '1',
          description: 'Mensalidade Janeiro/2025',
          amount: 499.90,
          dueDate: '2025-01-10',
          status: 'pending',
          paymentUrl: 'https://mercadopago.com/payment/1'
        },
        {
          id: '2',
          description: 'Mensalidade Dezembro/2024',
          amount: 499.90,
          dueDate: '2024-12-10',
          status: 'approved',
          paidAt: '2024-12-08'
        },
        {
          id: '3',
          description: 'Mensalidade Novembro/2024',
          amount: 499.90,
          dueDate: '2024-11-10',
          status: 'approved',
          paidAt: '2024-11-09'
        }
      ];

      this.payments.set(mockPayments);
    } catch (error) {
      this.notificationService.error('Erro ao carregar informações financeiras');
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendente',
      approved: 'Pago',
      rejected: 'Rejeitado',
      refunded: 'Reembolsado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      refunded: 'status-refunded'
    };
    return classMap[status] || '';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  openPaymentLink(url?: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
