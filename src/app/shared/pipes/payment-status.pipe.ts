import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paymentStatus',
  standalone: true
})
export class PaymentStatusPipe implements PipeTransform {
  transform(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendente',
      'RECEIVED': 'Recebido',
      'CONFIRMED': 'Confirmado',
      'OVERDUE': 'Vencido',
      'REFUNDED': 'Reembolsado',
      'RECEIVED_IN_CASH': 'Recebido em Dinheiro',
      'REFUND_REQUESTED': 'Reembolso Solicitado',
      'CHARGEBACK_REQUESTED': 'Chargeback Solicitado',
      'CHARGEBACK_DISPUTE': 'Em Disputa de Chargeback',
      'AWAITING_CHARGEBACK_REVERSAL': 'Aguardando Reversão de Chargeback',
      'DUNNING_REQUESTED': 'Em Processo de Dunning',
      'DUNNING_RECEIVED': 'Recuperado',
      'AWAITING_RISK_ANALYSIS': 'Em Análise de Risco'
    };
    
    return statusMap[status] || status;
  }
} 