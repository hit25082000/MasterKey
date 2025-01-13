import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AsaasCustomer, AsaasPayment, AsaasPaymentResponse } from '../models/asaas.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsaasService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.asaasApiUrl;
  private readonly apiKey = environment.asaasApiKey;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'access_token': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  createCustomer(customer: AsaasCustomer): Observable<AsaasCustomer> {
    return this.http.post<AsaasCustomer>(
      `${this.apiUrl}/customers`,
      customer,
      { headers: this.getHeaders() }
    );
  }

  createPayment(payment: AsaasPayment): Observable<AsaasPaymentResponse> {
    return this.http.post<AsaasPaymentResponse>(
      `${this.apiUrl}/payments`,
      payment,
      { headers: this.getHeaders() }
    );
  }

  getPaymentStatus(paymentId: string): Observable<AsaasPaymentResponse> {
    return this.http.get<AsaasPaymentResponse>(
      `${this.apiUrl}/payments/${paymentId}`,
      { headers: this.getHeaders() }
    );
  }

  createPixPayment(payment: Omit<AsaasPayment, 'billingType'>): Observable<AsaasPaymentResponse> {
    const pixPayment: AsaasPayment = {
      ...payment,
      billingType: 'PIX'
    };
    return this.createPayment(pixPayment);
  }

  createCreditCardPayment(payment: Omit<AsaasPayment, 'billingType'> & {
    creditCard: NonNullable<AsaasPayment['creditCard']>;
    creditCardHolderInfo: NonNullable<AsaasPayment['creditCardHolderInfo']>;
  }): Observable<AsaasPaymentResponse> {
    const creditCardPayment: AsaasPayment = {
      ...payment,
      billingType: 'CREDIT_CARD'
    };
    return this.createPayment(creditCardPayment);
  }

  createBoletoPayment(payment: Omit<AsaasPayment, 'billingType'>): Observable<AsaasPaymentResponse> {
    const boletoPayment: AsaasPayment = {
      ...payment,
      billingType: 'BOLETO'
    };
    return this.createPayment(boletoPayment);
  }
}
