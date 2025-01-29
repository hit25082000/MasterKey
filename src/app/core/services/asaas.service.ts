import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AsaasCustomer, AsaasPayment, AsaasSubscription, AsaasResponse } from '../interfaces/asaas.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AsaasService {
  private apiUrl = environment.apiUrl;
  private headers = new HttpHeaders();

  constructor(
    private http: HttpClient,
    private firestore: AngularFirestore
  ) {
    this.updateHeaders();
  }

  private async updateHeaders() {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    this.headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);
  }

  // Clientes
  createCustomer(customerData: any): Observable<any> {
    // Primeiro, salvar no nosso backend
    return this.http.post<{ customerId: string }>(`${this.apiUrl}/createCustomer`, customerData).pipe(
      map(response => {
        if (!response || !response.customerId) {
          throw new Error('Falha ao criar cliente');
        }
        return response;
      }),
      catchError(error => {
        console.error('Erro ao criar cliente:', error);
        return throwError(() => error);
      })
    );
  }

  getCustomer(id: string): Observable<AsaasCustomer> {
    return this.http.get<AsaasCustomer>(`${this.apiUrl}/customers/${id}`, { 
      headers: this.headers,
      withCredentials: false
    });
  }

  // Pagamentos
  createPayment(paymentData: any, courseId?: string): Observable<any> {
    const data = courseId ? { ...paymentData, courseId } : paymentData;
    return this.http.post(`${this.apiUrl}/createAsaasPayment`, data).pipe(
      catchError(error => {
        console.error('Erro ao criar pagamento:', error);
        return throwError(() => error);
      })
    );
  }

  getPayment(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/${id}`, { 
      headers: this.headers,
      withCredentials: false
    });
  }

  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getPaymentStatus/${paymentId}`).pipe(
      catchError(error => {
        console.error('Erro ao obter status do pagamento:', error);
        return throwError(() => error);
      })
    );
  }

  // Assinaturas
  createSubscription(subscriptionData: any, courseId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/createAsaasSubscription`, {
      ...subscriptionData,
      courseId
    }).pipe(
      catchError(error => {
        console.error('Erro ao criar assinatura:', error);
        return throwError(() => error);
      })
    );
  }

  getSubscription(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/subscriptions/${id}`, { 
      headers: this.headers,
      withCredentials: false
    });
  }

  // Gerar QR Code PIX
  generatePixQRCode(paymentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/pixQrCode`, { 
      headers: this.headers,
      withCredentials: false
    });
  }

  // Links de Pagamento
  createPaymentLink(courseId: string): Observable<any> {
    return new Observable(observer => {
      this.updateHeaders().then(() => {
        this.http.get(`${this.apiUrl}/createPaymentLink?courseId=${courseId}`, 
          { headers: this.headers }
        ).subscribe({
          next: (response) => {
            observer.next(response);
            observer.complete();
          },
          error: (error) => observer.error(error)
        });
      });
    });
  }

  // Salvar dados do cliente
  saveCustomerData(data: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    courseId: string;
  }): Observable<any> {
    return new Observable(observer => {
      this.updateHeaders().then(() => {
        this.http.post(`${this.apiUrl}/saveCustomerData`, data, 
          { headers: this.headers }
        ).subscribe({
          next: (response) => {
            observer.next(response);
            observer.complete();
          },
          error: (error) => observer.error(error)
        });
      });
    });
  }
} 