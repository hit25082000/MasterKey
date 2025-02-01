import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AsaasCustomer, AsaasPayment, AsaasSubscription, AsaasResponse } from '../interfaces/asaas.interface';
import { getAuth } from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';
import { where } from '@angular/fire/firestore';

interface CustomerResponse {
  customerId?: string;
  asaasId?: string;
  firestoreId?: string;
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
  message?: string;
  [key: string]: any;
}

interface FirestoreCustomerData {
  id?: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
  asaasId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsaasService {
  private apiUrl = environment.apiUrl;
  private headers = new HttpHeaders();
  private firestore = inject(FirestoreService);

  constructor(
    private http: HttpClient,
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
  createCustomer(customerData: any): Observable<CustomerResponse> {
    // Primeiro, verificar se o cliente já existe no Firestore
    return from(this.checkExistingCustomer(customerData)).pipe(
      switchMap(existingCustomer => {
        if (existingCustomer) {
          console.log('Cliente existente encontrado:', existingCustomer);
          const response: CustomerResponse = {
            customerId: existingCustomer.asaasId,
            firestoreId: existingCustomer.id,
            name: existingCustomer.name,
            email: existingCustomer.email,
            cpfCnpj: existingCustomer.cpfCnpj,
            phone: existingCustomer.phone,
            postalCode: existingCustomer.postalCode,
            addressNumber: existingCustomer.addressNumber,
            message: 'Cliente já cadastrado'
          };
          return of(response);
        }

        // Se não existir, criar novo cliente
        return this.http.post<CustomerResponse>(`${this.apiUrl}/createCustomer`, customerData);
      }),
      map(response => {
        if (!response || (!response.customerId && !response.asaasId)) {
          throw new Error('Falha ao processar cliente');
        }
        return response;
      }),
      catchError(error => {
        console.error('Erro ao processar cliente:', error);
        return throwError(() => error);
      })
    );
  }

  private async checkExistingCustomer(customerData: any): Promise<CustomerResponse | null> {
    try {
      // Buscar por email
      const customers = await this.firestore.getDocumentsByQuery<FirestoreCustomerData>(
        'customers',
        where('email', '==', customerData.email)
      );

      if (customers && customers.length > 0) {
        const customer = customers[0];
        return {
          id: customer.id,
          name: customer.name || '',
          email: customer.email || '',
          cpfCnpj: customer.cpfCnpj || '',
          phone: customer.phone || '',
          postalCode: customer.postalCode || '',
          addressNumber: customer.addressNumber || '',
          asaasId: customer.asaasId || '',
          customerId: customer.asaasId || ''
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar cliente existente:', error);
      return null;
    }
  }

  getCustomer(id: string): Observable<AsaasCustomer> {
    return this.http.get<AsaasCustomer>(`${this.apiUrl}/customers/${id}`, { 
      headers: this.headers,
      withCredentials: false
    });
  }

  getCustomerByEmail(email: string): Observable<CustomerResponse | null> {
    return from(this.firestore.getDocumentsByQuery<FirestoreCustomerData>(
      'customers',
      where('email', '==', email)
    )).pipe(
      map(customers => {
        if (customers && customers.length > 0) {
          const customer = customers[0];
          return {
            id: customer.id,
            name: customer.name || '',
            email: customer.email || '',
            cpfCnpj: customer.cpfCnpj || '',
            phone: customer.phone || '',
            postalCode: customer.postalCode || '',
            addressNumber: customer.addressNumber || '',
            asaasId: customer.asaasId || '',
            customerId: customer.asaasId || ''
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Erro ao buscar cliente por email:', error);
        return throwError(() => error);
      })
    );
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
    const data = courseId ? { ...subscriptionData, courseId } : subscriptionData;
    return this.http.post(`${this.apiUrl}/createAsaasSubscription`, data).pipe(
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
} 