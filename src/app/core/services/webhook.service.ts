import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';

export interface WebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl: string;
    bankSlipUrl?: string;
    postalService: boolean;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    nextDueDate: string;
    status: string;
    cycle: string;
  };
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  constructor(
    private firestore: AngularFirestore,
    private functions: AngularFireFunctions
  ) {}

  /**
   * Registra um novo webhook no Asaas
   */
  registerWebhook(url: string): Observable<any> {
    const callable = this.functions.httpsCallable('registerAsaasWebhook');
    return callable({ url });
  }

  /**
   * Processa um evento recebido do webhook
   */
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      // 1. Salvar o evento no histórico
      await this.firestore.collection('payment_events').add({
        ...event,
        createdAt: new Date(),
        processed: false
      });

      // 2. Atualizar o status do pagamento/assinatura no Firestore
      if (event.payment) {
        await this.updatePaymentStatus(event.payment);
      }
      
      if (event.subscription) {
        await this.updateSubscriptionStatus(event.subscription);
      }

    } catch (error) {
      console.error('Erro ao processar evento do webhook:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um pagamento no Firestore
   */
  private async updatePaymentStatus(payment: any): Promise<void> {
    const paymentRef = this.firestore
      .collection('transactions')
      .doc(payment.id);

    await paymentRef.update({
      status: payment.status,
      updatedAt: new Date(),
      paymentDate: payment.paymentDate || null,
      netValue: payment.netValue,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl || null
    });
  }

  /**
   * Atualiza o status de uma assinatura no Firestore
   */
  private async updateSubscriptionStatus(subscription: any): Promise<void> {
    const subscriptionRef = this.firestore
      .collection('subscriptions')
      .doc(subscription.id);

    await subscriptionRef.update({
      status: subscription.status,
      updatedAt: new Date(),
      nextDueDate: subscription.nextDueDate,
      value: subscription.value
    });
  }

  /**
   * Obtém os últimos eventos do webhook
   */
  getRecentEvents(limit: number = 10): Observable<WebhookEvent[]> {
    return this.firestore
      .collection<WebhookEvent>('payment_events', ref => 
        ref.orderBy('createdAt', 'desc').limit(limit))
      .valueChanges()
      .pipe(
        map(events => events.map(event => ({
          ...event,
          createdAt: new Date(event.createdAt).toISOString()
        })))
      );
  }

  /**
   * Verifica se o webhook está ativo
   */
  async isWebhookActive(): Promise<boolean> {
    const lastEvent = await this.firestore
      .collection('payment_events')
      .ref
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (lastEvent.empty) {
      return false;
    }

    const eventData = lastEvent.docs[0].data() as { createdAt: Timestamp };
    const lastEventTime = eventData.createdAt.toDate();
    const hoursSinceLastEvent = (Date.now() - lastEventTime.getTime()) / (1000 * 60 * 60);

    // Considera ativo se recebeu eventos nas últimas 24 horas
    return hoursSinceLastEvent < 24;
  }
} 
