import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AsaasWebhookEvent } from './types/asaas';

// Inicializar o Firebase Admin
admin.initializeApp();

export const asaasWebhook = functions.https.onRequest(async (request, response) => {
  // Log para debug
  console.log('Webhook recebido:', {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  try {
    // 1. Validar método HTTP
    if (request.method !== 'POST') {
      console.warn('Método inválido:', request.method);
      response.status(405).json({
        error: 'Método não permitido',
        details: 'Apenas POST é aceito'
      });
      return;
    }

    // 2. Validar corpo da requisição
    if (!request.body || !request.body.event) {
      console.warn('Corpo da requisição inválido:', request.body);
      response.status(400).json({
        error: 'Requisição inválida',
        details: 'Corpo da requisição ausente ou malformado'
      });
      return;
    }

    // 3. Validar evento
    const event = request.body as AsaasWebhookEvent;
    
    // 4. Registrar evento no Firestore
    const db = admin.firestore();
    const eventRef = db.collection('payment_events').doc();
    
    await eventRef.set({
      ...event,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: null,
      status: 'PENDING',
      error: null,
      rawData: JSON.stringify(request.body)
    });

    // 5. Processar evento baseado no tipo
    switch (event.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_REFUNDED':
        await processPaymentEvent(event, eventRef);
        break;

      case 'SUBSCRIPTION_RENEWED':
      case 'SUBSCRIPTION_OVERDUE':
      case 'SUBSCRIPTION_DELETED':
        await processSubscriptionEvent(event, eventRef);
        break;

      default:
        console.log(`Evento não processado: ${event.event}`);
        await eventRef.update({
          status: 'SKIPPED',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    // 6. Responder com sucesso
    response.status(200).json({
      message: 'Evento processado com sucesso',
      eventId: eventRef.id
    });
    return;

  } catch (error) {
    // Log detalhado do erro
    console.error('Erro ao processar webhook:', error);
    
    // Tentar extrair mensagem de erro mais útil
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido';
    
    // Registrar erro no Firestore se possível
    try {
      const db = admin.firestore();
      await db.collection('webhook_errors').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: errorMessage,
        request: {
          method: request.method,
          headers: request.headers,
          body: request.body
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar erro:', logError);
    }

    // Responder com erro
    response.status(500).json({
      error: 'Erro interno ao processar webhook',
      details: errorMessage
    });
    return;
  }
});

async function processPaymentEvent(
  event: AsaasWebhookEvent, 
  eventRef: FirebaseFirestore.DocumentReference
) {
  const db = admin.firestore();
  const payment = event.payment;

  if (!payment) {
    throw new Error('Dados do pagamento ausentes no evento');
  }

  try {
    // 1. Atualizar transação
    const paymentRef = db.collection('transactions').doc(payment.id);
    await paymentRef.set({
      status: payment.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentDate: payment.paymentDate || null,
      netValue: payment.netValue,
      lastEvent: event.event
    }, { merge: true });

    // 2. Se confirmado, atualizar acesso ao curso
    if (event.event === 'PAYMENT_CONFIRMED') {
      const transaction = await paymentRef.get();
      const data = transaction.data();
      
      if (data?.['courseId'] && data?.['customerId']) {
        await db.collection('course_access').add({
          courseId: data['courseId'],
          customerId: data['customerId'],
          status: 'ACTIVE',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // 3. Marcar evento como processado
    await eventRef.update({
      status: 'PROCESSED',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    // Registrar falha no processamento
    await eventRef.update({
      status: 'FAILED',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

async function processSubscriptionEvent(
  event: AsaasWebhookEvent,
  eventRef: FirebaseFirestore.DocumentReference
) {
  const db = admin.firestore();
  const subscription = event.subscription;

  if (!subscription) {
    throw new Error('Dados da assinatura ausentes no evento');
  }

  try {
    // 1. Atualizar assinatura
    const subscriptionRef = db.collection('subscriptions').doc(subscription.id);
    await subscriptionRef.set({
      status: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextDueDate: subscription.nextDueDate,
      lastEvent: event.event
    }, { merge: true });

    // 2. Se renovada, atualizar acesso
    if (event.event === 'SUBSCRIPTION_RENEWED') {
      const subscriptionDoc = await subscriptionRef.get();
      const data = subscriptionDoc.data();

      if (data?.['customerId']) {
        await db.collection('customers').doc(data['customerId']).update({
          subscriptionStatus: 'ACTIVE',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // 3. Marcar evento como processado
    await eventRef.update({
      status: 'PROCESSED',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    // Registrar falha no processamento
    await eventRef.update({
      status: 'FAILED',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
} 
