import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AsaasPaymentResponse } from '../models/asaas.model';

export interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  courseId: string;
}

export interface PaymentRequest {
  amount: number;
  courseId: string;
  paymentMethod: string;
  customer: CustomerData;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = environment.adminUrl;

  constructor(private http: HttpClient) {}

  processPayment(request: PaymentRequest): Observable<AsaasPaymentResponse> {
    return this.http.post<AsaasPaymentResponse>(
      `${this.apiUrl}/createAsaasPayment`,
      request
    );
  }

  checkPaymentStatus(paymentId: string): Observable<AsaasPaymentResponse> {
    return this.http.get<AsaasPaymentResponse>(
      `${this.apiUrl}/checkAsaasPaymentStatus?paymentId=${paymentId}`
    );
  }

  saveCustomerData(data: CustomerData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/saveCustomerData`,
      data
    );
  }
} 