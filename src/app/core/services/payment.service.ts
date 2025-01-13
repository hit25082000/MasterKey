import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course } from '../models/course.model';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { AsaasPaymentResponse } from '../../shared/models/asaas.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.adminUrl;
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService = inject(AuthService);

  processPayment(
    amount: number,
    courseId: string,
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO',
    creditCardInfo?: {
      card: {
        holderName: string;
        number: string;
        expiryMonth: string;
        expiryYear: string;
        ccv: string;
      },
      holder: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone: string;
      }
    }
  ): Observable<AsaasPaymentResponse> {
    return from(this.authService.getIdToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });

        const user = this.authService.getCurrentUser();
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const customer = {
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpf,
          externalReference: user.id
        };

        return this.http.post<AsaasPaymentResponse>(
          `${this.apiUrl}/createAsaasPayment`,
          {
            amount,
            courseId,
            paymentMethod,
            creditCardInfo,
            customer
          },
          { headers, withCredentials: true }
        );
      })
    );
  }

  checkPaymentStatus(paymentId: string): Observable<AsaasPaymentResponse> {
    return from(this.authService.getIdToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        return this.http.get<AsaasPaymentResponse>(
          `${this.apiUrl}/checkAsaasPaymentStatus?paymentId=${paymentId}`,
          { headers, withCredentials: true }
        );
      })
    );
  }
}
