import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paymentMethod',
  standalone: true
})
export class PaymentMethodPipe implements PipeTransform {
  transform(method: string): string {
    const methodMap: { [key: string]: string } = {
      'BOLETO': 'Boleto',
      'CREDIT_CARD': 'Cartão de Crédito',
      'PIX': 'PIX',
      'UNDEFINED': 'Não definido'
    };
    
    return methodMap[method] || method;
  }
} 