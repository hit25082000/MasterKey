import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PaymentTransaction, Subscription } from '../interfaces/payment.interface';
import { where, orderBy } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private firestoreService: FirestoreService) {}

  // Buscar transações do usuário
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

  // Buscar pagamentos de uma assinatura
  getSubscriptionPayments(subscriptionId: string): Observable<PaymentTransaction[]> {
    return this.firestoreService.getCollectionWithQuery<PaymentTransaction>(
      'transactions',
      [where('subscriptionId', '==', subscriptionId), orderBy('createdAt', 'desc')]
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
} 