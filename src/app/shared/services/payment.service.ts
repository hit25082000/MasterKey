import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, catchError, from, map } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { 
  AsaasPaymentResponse, 
  AsaasSubscriptionResponse, 
  AsaasSubscriptionPayment,
  FirestorePayment,
  FirestoreSubscription
} from '../models/asaas.model';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, orderBy } from '@angular/fire/firestore';
import { FirestoreService } from '../../core/services/firestore.service';
import { PaymentTransaction, Subscription } from '../../core/interfaces/payment.interface';
import { AsaasService } from '../../core/services/asaas.service';

export interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  courseId: string;
  asaasId?: string;
}

export interface BaseAsaasPayment {
  customer: string;
  billingType?: string;
  paymentMethod: string;
  amount: number;
  courseId: string;
  dueDate?: string;
  description?: string;
}

export interface AsaasInstallmentPayment extends BaseAsaasPayment {
  totalValue: number;
  installmentCount: number;
}

export interface AsaasPayment extends BaseAsaasPayment {}

export interface SubscriptionRequest {
  customer: CustomerData;
  courseId: string;
  cycle: 'MONTHLY';
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);

  // Signals
  private _payments = signal<FirestorePayment[]>([]);
  private _subscriptionPayments = signal<FirestorePayment[]>([]);
  private _subscription = signal<FirestoreSubscription | null>(null);

  // Getters públicos para os signals
  readonly payments = this._payments.asReadonly();
  readonly subscriptionPayments = this._subscriptionPayments.asReadonly();
  readonly subscription = this._subscription.asReadonly();

  processPayment(request: AsaasPayment): Observable<AsaasPaymentResponse> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<AsaasPaymentResponse>(
      `${this.apiUrl}/createAsaasPayment`,
      request,
      { headers, withCredentials: true }
    );
  }

  createSubscription(data: SubscriptionRequest): Observable<AsaasSubscriptionResponse> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<AsaasSubscriptionResponse>(
      `${this.apiUrl}/createSubscription`, 
      data,
      { headers, withCredentials: true }
    );
  }

  createInstallmentPayment(request: AsaasInstallmentPayment): Observable<any> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<any>(
      `${this.apiUrl}/createInstallmentPayment`,
      request,
      { headers, withCredentials: true }
    );
  }

  getPayments(email: string): Observable<FirestorePayment[]> {
    const paymentsQuery = query(
      collection(this.firestore, 'transactions'),
      where('customerEmail', '==', email),
      where('type', '==', 'PAYMENT')
    );

    return from(getDocs(paymentsQuery)).pipe(
      map(snapshot => {
        const payments = snapshot.docs.map(doc => {
          const data = doc.data() as FirestorePayment;
          return data;
        });
        this._payments.set(payments);
        return payments;
      }),
      catchError(error => {
        console.error('Erro ao buscar pagamentos:', error);
        return of([]);
      })
    );
  }

  getSubscription(email: string): Observable<FirestoreSubscription | null> {
    const subscriptionQuery = query(
      collection(this.firestore, 'subscriptions'),
      where('customerEmail', '==', email),
      where('status', '==', 'ACTIVE')
    );

    return from(getDocs(subscriptionQuery)).pipe(
      map(snapshot => {
        if (snapshot.empty) {
          this._subscription.set(null);
          return null;
        }
        const subscription = snapshot.docs[0].data() as FirestoreSubscription;
        this._subscription.set(subscription);
        return subscription;
      }),
      catchError(error => {
        console.error('Erro ao buscar assinatura:', error);
        return of(null);
      })
    );
  }

  cancelSubscription(subscriptionId: string): Observable<void> {
    const subscriptionRef = doc(this.firestore, 'subscriptions', subscriptionId);
    return from(updateDoc(subscriptionRef, { status: 'CANCELLED' }));
  }

  // Métodos auxiliares para cálculos
  getPendingPayments(): number {
    const pendingPayments = this.payments().filter(p => 
      p.status === 'PENDING' || p.status === 'OVERDUE'
    ).length;

    const pendingSubscriptionPayments = this.subscriptionPayments().filter(p => 
      p.status === 'PENDING' || p.status === 'OVERDUE'
    ).length;

    return pendingPayments + pendingSubscriptionPayments;
  }

  getPaidPayments(): number {
    const paidPayments = this.payments().filter(p => 
      p.status === 'RECEIVED' || p.status === 'CONFIRMED'
    ).length;

    const paidSubscriptionPayments = this.subscriptionPayments().filter(p => 
      p.status === 'RECEIVED' || p.status === 'CONFIRMED'
    ).length;

    return paidPayments + paidSubscriptionPayments;
  }

  getTotalPending(): number {
    const pendingPaymentsTotal = this.payments()
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pendingSubscriptionPaymentsTotal = this.subscriptionPayments()
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return pendingPaymentsTotal + pendingSubscriptionPaymentsTotal;
  }

  getTotalPaid(): number {
    const paidPaymentsTotal = this.payments()
      .filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const paidSubscriptionPaymentsTotal = this.subscriptionPayments()
      .filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return paidPaymentsTotal + paidSubscriptionPaymentsTotal;
  }

  getCustomerTransactions(customerId: string): Observable<PaymentTransaction[]> {
    return this.firestoreService.getCollectionWithQuery<PaymentTransaction>(
      'transactions',
      [where('customerId', '==', customerId), orderBy('createdAt', 'desc')]
    );
  }

  // Buscar assinaturas do usuário
  getCustomerSubscriptions(customerId: string): Observable<Subscription[]> {
    return this.firestoreService.getCollectionWithQuery<Subscription>(
      'subscriptions',
      [where('customerId', '==', customerId), orderBy('createdAt', 'desc')]
    );
  }

  // Buscar histórico de eventos de um pagamento
  getPaymentEvents(paymentId: string): Observable<any[]> {
    return this.firestoreService.getCollectionWithQuery(
      'payment_events',
      [where('paymentId', '==', paymentId), orderBy('createdAt', 'desc')]
    );
  }

  getSubscriptionPayments(email: string): Observable<FirestorePayment[]> {
    const subscriptionsQuery = query(
      collection(this.firestore, 'transactions'),
      where('customerEmail', '==', email),
      where('type', '==', 'SUBSCRIPTION')
    );

    return from(getDocs(subscriptionsQuery)).pipe(
      map(snapshot => {
        const payments = snapshot.docs.map(doc => {
          const data = doc.data() as FirestorePayment;
          return data;
        });
        this._subscriptionPayments.set(payments);
        return payments;
      }),
      catchError(error => {
        console.error('Erro ao buscar pagamentos da assinatura:', error);
        return of([]);
      })
    );
  }

  // Buscar status atual de um pagamento
  getPaymentStatus(paymentId: string): Observable<string> {
    return this.firestoreService.getCollectionWithQuery<PaymentTransaction>(
      'transactions',
      [where('paymentId', '==', paymentId)]
    ).pipe(
      map(transactions => transactions[0]?.status || 'UNKNOWN')
    );
  }

  // Buscar status atual de uma assinatura
  getSubscriptionStatus(subscriptionId: string): Observable<string> {
    return this.firestoreService.getCollectionWithQuery<Subscription>(
      'subscriptions',
      [where('asaasSubscriptionId', '==', subscriptionId)]
    ).pipe(
      map(subscriptions => subscriptions[0]?.status || 'UNKNOWN')
    );
  }

  // Buscar transações por email e CPF
  getTransactionsByEmail(email: string): Observable<PaymentTransaction[]> {
    return this.firestoreService.getCollectionWithQuery<PaymentTransaction>(
      'transactions',
      [
        where('customerEmail', '==', email),
        orderBy('createdAt', 'desc')
      ]
    );
  }

  getSubscriptionsByEmail(email: string): Observable<Subscription[]> {
    return this.firestoreService.getCollectionWithQuery<Subscription>(
      'subscriptions',
      [
        where('customerEmail', '==', email),
        orderBy('createdAt', 'desc')
      ]
    );
  }

  saveCustomerData(customerData: CustomerData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/createCustomer`, customerData);
  }

  getAllTransactions(): Observable<PaymentTransaction[]> {
    return from(getDocs(
      query(
        collection(this.firestore, 'transactions'),
        orderBy('createdAt', 'desc')
      )
    )).pipe(
      map(snapshot => {
        const payments = snapshot.docs.map(doc => {
          const data = doc.data() as PaymentTransaction;
          return { ...data, id: doc.id };
        });
        this._payments.set(payments as any);
        return payments;
      }),
      catchError(error => {
        console.error('Erro detalhado em getAllTransactions:', error);
        return of([]);
      })
    );
  }
}  