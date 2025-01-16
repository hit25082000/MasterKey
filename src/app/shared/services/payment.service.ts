import { HttpClient } from '@angular/common/http';
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
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';

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

export interface SubscriptionRequest {
  customer: CustomerData;
  courseId: string;
  paymentMethod: string;
  cycle: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private firestore = inject(Firestore);

  // Signals
  private _payments = signal<FirestorePayment[]>([]);
  private _subscriptionPayments = signal<FirestorePayment[]>([]);
  private _subscription = signal<FirestoreSubscription | null>(null);

  // Getters públicos para os signals
  readonly payments = this._payments.asReadonly();
  readonly subscriptionPayments = this._subscriptionPayments.asReadonly();
  readonly subscription = this._subscription.asReadonly();

  processPayment(request: PaymentRequest): Observable<AsaasPaymentResponse> {
    return this.http.post<AsaasPaymentResponse>(
      `${this.apiUrl}/createAsaasPayment`,
      request
    );
  }

  saveCustomerData(data: CustomerData): Observable<any> {
    return this.http.post(`${this.apiUrl}/saveCustomerData`, data);
  }

  createSubscription(data: SubscriptionRequest): Observable<AsaasSubscriptionResponse> {
    return this.http.post<AsaasSubscriptionResponse>(`${this.apiUrl}/createSubscription`, data);
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
      p.paymentDetails.status === 'PENDING' || p.paymentDetails.status === 'OVERDUE'
    ).length;

    const pendingSubscriptionPayments = this.subscriptionPayments().filter(p => 
      p.paymentDetails.status === 'PENDING' || p.paymentDetails.status === 'OVERDUE'
    ).length;

    return pendingPayments + pendingSubscriptionPayments;
  }

  getPaidPayments(): number {
    const paidPayments = this.payments().filter(p => 
      p.paymentDetails.status === 'RECEIVED' || p.paymentDetails.status === 'CONFIRMED'
    ).length;

    const paidSubscriptionPayments = this.subscriptionPayments().filter(p => 
      p.paymentDetails.status === 'RECEIVED' || p.paymentDetails.status === 'CONFIRMED'
    ).length;

    return paidPayments + paidSubscriptionPayments;
  }

  getTotalPending(): number {
    const pendingPaymentsTotal = this.payments()
      .filter(p => p.paymentDetails.status === 'PENDING' || p.paymentDetails.status === 'OVERDUE')
      .reduce((acc, curr) => acc + curr.paymentDetails.value, 0);

    const pendingSubscriptionPaymentsTotal = this.subscriptionPayments()
      .filter(p => p.paymentDetails.status === 'PENDING' || p.paymentDetails.status === 'OVERDUE')
      .reduce((acc, curr) => acc + curr.paymentDetails.value, 0);

    return pendingPaymentsTotal + pendingSubscriptionPaymentsTotal;
  }

  getTotalPaid(): number {
    const paidPaymentsTotal = this.payments()
      .filter(p => p.paymentDetails.status === 'RECEIVED' || p.paymentDetails.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + curr.paymentDetails.value, 0);

    const paidSubscriptionPaymentsTotal = this.subscriptionPayments()
      .filter(p => p.paymentDetails.status === 'RECEIVED' || p.paymentDetails.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + curr.paymentDetails.value, 0);

    return paidPaymentsTotal + paidSubscriptionPaymentsTotal;
  }
}  