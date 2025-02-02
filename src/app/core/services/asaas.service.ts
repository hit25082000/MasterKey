import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AsaasCustomer, AsaasPayment, AsaasSubscription, AsaasResponse } from '../interfaces/asaas.interface';
import { getAuth } from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';
import { where } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { retry, timeout } from 'rxjs/operators';

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

interface AsaasError {
  code: string;
  description: string;
}

interface AsaasErrorResponse {
  errors: AsaasError[];
}

interface BasePaymentRequest {
  customer: string | { asaasId: string; name: string; email: string; cpfCnpj: string; phone: string; postalCode: string; addressNumber: string; };
  billingType?: string;
  paymentMethod?: string;
  value?: number;
  amount?: number;
  description?: string;
  externalReference?: string;
  postalService?: boolean;
  courseId?: string;
  creditCardInfo?: any;
  creditCardHolderInfo?: any;
}

interface AsaasPaymentRequest extends BasePaymentRequest {
  dueDate?: string;
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

interface AsaasSubscriptionRequest extends BasePaymentRequest {
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
}

@Injectable({
  providedIn: 'root'
})
export class AsaasService {
  private apiUrl = environment.apiUrl;
  private apiKey = environment.asaasApiKey;
  private headers = new HttpHeaders();
  private firestore = inject(FirestoreService);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
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

  // Método privado para tratamento de erros
  private handleAsaasError(error: any): Observable<never> {
    let errorMessage = 'Erro ao processar a requisição';

    if (error.response?.data?.errors) {
      const asaasError = error.response.data as AsaasErrorResponse;
      errorMessage = asaasError.errors.map(err => err.description).join(', ');
      
      // Log detalhado para debugging
      console.error('Erro Asaas:', {
        errors: asaasError.errors,
        status: error.status,
        timestamp: new Date().toISOString()
      });
    } else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Dados inválidos. Verifique as informações fornecidas.';
          break;
        case 401:
          errorMessage = 'Não autorizado. Verifique suas credenciais.';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          break;
        case 429:
          errorMessage = 'Muitas requisições. Tente novamente em alguns minutos.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = `Erro ${error.status}: ${error.message || 'Erro desconhecido'}`;
      }
    }

    // Mostrar mensagem de erro para o usuário
    this.snackBar.open(errorMessage, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });

    return throwError(() => new Error(errorMessage));
  }

  // Método privado para validação de dados
  private validatePaymentData(data: AsaasPaymentRequest | AsaasSubscriptionRequest): string | null {
    if (!data.customer) {
      return 'Cliente não informado';
    }
    if (!data.value && !data.amount) {
      return 'Valor inválido';
    }
    if (!data.billingType && !data.paymentMethod) {
      return 'Forma de pagamento não informada';
    }
    
    const dueDate = 'nextDueDate' in data ? 
      new Date(data.nextDueDate) : 
      new Date(data.dueDate || new Date().toISOString());

    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 40);

    if (isNaN(dueDate.getTime())) {
      return 'Data de vencimento inválida';
    }
    if (dueDate > dataLimite) {
      return 'Data de vencimento não pode ser superior a 40 dias';
    }
    if (dueDate < hoje) {
      const diasAtraso = Math.floor((hoje.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diasAtraso > 60) {
        return 'Não é permitido gerar pagamentos para faturas com mais de 60 dias de atraso';
      }
    }

    return null;
  }

  // Método para criar pagamento com validações melhoradas
  createPayment(paymentData: AsaasPaymentRequest): Observable<any> {
    const validationError = this.validatePaymentData(paymentData);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const paymentRequest = {
      ...paymentData,
      postalService: false,
      dueDate: paymentData.dueDate || new Date().toISOString().split('T')[0]
    };

    return this.http.post(
      `${this.apiUrl}/createAsaasPayment`,
      paymentRequest,
      { headers: this.headers.append('access_token', this.apiKey) }
    ).pipe(
      map(response => {
        if (!response) {
          throw new Error('Resposta vazia do servidor');
        }
        return response;
      }),
      catchError(error => this.handleAsaasError(error))
    );
  }

  getPayment(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/${id}`, { 
      headers: this.headers,
      withCredentials: false
    });
  }

  // Método para criar assinatura com validações melhoradas
  createSubscription(subscriptionData: AsaasSubscriptionRequest, courseId: string): Observable<any> {
    const validationError = this.validatePaymentData(subscriptionData);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const subscriptionRequest = {
      ...subscriptionData,
      courseId,
      postalService: false,
      nextDueDate: new Date(subscriptionData.nextDueDate).toISOString().split('T')[0]
    };

    return this.http.post(
      `${this.apiUrl}/createAsaasSubscription`,
      subscriptionRequest,
      { headers: this.headers.append('access_token', this.apiKey) }
    ).pipe(
      map(response => {
        if (!response) {
          throw new Error('Resposta vazia do servidor');
        }
        return response;
      }),
      catchError(error => this.handleAsaasError(error))
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

  // Método para verificar status do pagamento com retry
  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/getPaymentStatus/${paymentId}`,
      { headers: this.headers }
    ).pipe(
      retry(3), // Tenta 3 vezes antes de falhar
      timeout(30000), // Timeout de 30 segundos
      catchError(error => this.handleAsaasError(error))
    );
  }
} 