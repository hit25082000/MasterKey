import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { AsaasService } from '../../../../shared/services/asaas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AsaasCustomer, AsaasPayment, AsaasPaymentResponse } from '../../../../shared/models/asaas.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private asaasService = inject(AsaasService);
  private authService = inject(AuthService);

  processPayment(
    amount: number,
    courseId: string,
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO',
    creditCardInfo?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
      holderInfo: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone: string;
      }
    }
  ): Observable<AsaasPaymentResponse> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Criar ou recuperar cliente no Asaas
    const customer: AsaasCustomer = {
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpf,
      externalReference: user.id
    };

    return this.asaasService.createCustomer(customer).pipe(
      switchMap(createdCustomer => {
        const basePayment = {
          customer: createdCustomer.id!,
          value: amount,
          dueDate: new Date().toISOString().split('T')[0],
          description: `Pagamento do curso ${courseId}`,
          externalReference: courseId
        };

        if (paymentMethod === 'CREDIT_CARD' && creditCardInfo) {
          return this.asaasService.createCreditCardPayment({
            ...basePayment,
            creditCard: {
              holderName: creditCardInfo.holderName,
              number: creditCardInfo.number,
              expiryMonth: creditCardInfo.expiryMonth,
              expiryYear: creditCardInfo.expiryYear,
              ccv: creditCardInfo.ccv
            },
            creditCardHolderInfo: {
              name: creditCardInfo.holderInfo.name,
              email: creditCardInfo.holderInfo.email,
              cpfCnpj: creditCardInfo.holderInfo.cpfCnpj,
              postalCode: creditCardInfo.holderInfo.postalCode,
              addressNumber: creditCardInfo.holderInfo.addressNumber,
              phone: creditCardInfo.holderInfo.phone
            }
          });
        } else if (paymentMethod === 'PIX') {
          return this.asaasService.createPixPayment(basePayment);
        } else {
          return this.asaasService.createBoletoPayment(basePayment);
        }
      })
    );
  }

  checkPaymentStatus(paymentId: string): Observable<AsaasPaymentResponse> {
    return this.asaasService.getPaymentStatus(paymentId);
  }
}
