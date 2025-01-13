import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AsaasPaymentResponse } from '../../../../shared/models/asaas.model';

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);

  processPayment(
    amount: number,
    courseId: string,
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO',
    customerData: CustomerData,
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
    return this.http.post<AsaasPaymentResponse>(
      `${environment.adminUrl}/createAsaasPayment`,
      {
        amount,
        courseId,
        paymentMethod,
        creditCardInfo,
        customer: customerData
      }
    );
  }

  checkPaymentStatus(paymentId: string): Observable<AsaasPaymentResponse> {
    return this.http.get<AsaasPaymentResponse>(
      `${environment.adminUrl}/checkAsaasPaymentStatus`,
      { params: { paymentId } }
    );
  }
}
