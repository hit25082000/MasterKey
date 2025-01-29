import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaymentTransaction, Subscription } from '../interfaces/payment.interface';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private firestore: AngularFirestore) {}

  // Buscar transações do usuário
  getCustomerTransactions(customerId: string): Observable<PaymentTransaction[]> {
    return this.firestore
      .collection<PaymentTransaction>('transactions', ref => 
        ref.where('customerId', '==', customerId)
           .orderBy('createdAt', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  // Buscar assinaturas do usuário
  getCustomerSubscriptions(customerId: string): Observable<Subscription[]> {
    return this.firestore
      .collection<Subscription>('subscriptions', ref => 
        ref.where('customerId', '==', customerId)
           .orderBy('createdAt', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  // Buscar histórico de eventos de um pagamento
  getPaymentEvents(paymentId: string): Observable<any[]> {
    return this.firestore
      .collection('payment_events', ref => 
        ref.where('paymentId', '==', paymentId)
           .orderBy('createdAt', 'desc')
      )
      .valueChanges();
  }

  // Buscar pagamentos de uma assinatura
  getSubscriptionPayments(subscriptionId: string): Observable<PaymentTransaction[]> {
    return this.firestore
      .collection<PaymentTransaction>('transactions', ref => 
        ref.where('subscriptionId', '==', subscriptionId)
           .orderBy('createdAt', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  // Buscar status atual de um pagamento
  getPaymentStatus(paymentId: string): Observable<string> {
    return this.firestore
      .collection<PaymentTransaction>('transactions', ref => 
        ref.where('paymentId', '==', paymentId)
      )
      .valueChanges()
      .pipe(
        map(transactions => transactions[0]?.status || 'UNKNOWN')
      );
  }

  // Buscar status atual de uma assinatura
  getSubscriptionStatus(subscriptionId: string): Observable<string> {
    return this.firestore
      .collection<Subscription>('subscriptions', ref => 
        ref.where('asaasSubscriptionId', '==', subscriptionId)
      )
      .valueChanges()
      .pipe(
        map(subscriptions => subscriptions[0]?.status || 'UNKNOWN')
      );
  }
} 