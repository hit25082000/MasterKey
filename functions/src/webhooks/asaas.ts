import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  AsaasWebhookEvent, 
  AsaasPayment, 
  AsaasSubscription 
} from '../types/asaas';

export const processAsaasWebhook = functions.https.onRequest(async (request, response) => {
  // Verificar método HTTP
  if (request.method !== 'POST') {
    response.status(405).send('Método não permitido');
    return;
  }

  try {
    const event = request.body as AsaasWebhookEvent;
    const db = admin.firestore();

    // Registrar evento recebido
    await db.collection('payment_events').add({
      ...event,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
      rawData: JSON.stringify(request.body)
    });

    // Processar evento com base no tipo
    switch (event.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_UPDATED':
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
        await processPaymentEvent(event);
        break;

      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_UPDATED':
      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_RENEWED':
      case 'SUBSCRIPTION_OVERDUE':
        await processSubscriptionEvent(event);
        break;

      default:
        console.log(`Tipo de evento não tratado: ${event.event}`);
    }

    response.status(200).send('Evento processado com sucesso');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    response.status(500).send('Erro ao processar webhook');
  }
});

async function processPaymentEvent(event: AsaasWebhookEvent) {
  const db = admin.firestore();
  const payment = event.payment as AsaasPayment;

  if (!payment || !payment.id) {
    throw new Error('Dados do pagamento inválidos');
  }

  // Atualizar transação no Firestore
  const paymentRef = db.collection('transactions').doc(payment.id);
  
  await paymentRef.set({
    status: payment.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentDate: payment.paymentDate || null,
    netValue: payment.netValue,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl || null,
    lastEventType: event.event
  }, { merge: true });

  // Se o pagamento foi confirmado, atualizar status do curso/assinatura
  if (event.event === 'PAYMENT_CONFIRMED') {
    const transaction = await paymentRef.get();
    const transactionData = transaction.data() as { courseId: string; customerId: string } | undefined;

    if (transactionData?.courseId) {
      await updateCourseAccess(
        transactionData.courseId,
        transactionData.customerId
      );
    }
  }
}

async function processSubscriptionEvent(event: AsaasWebhookEvent) {
  const db = admin.firestore();
  const subscription = event.subscription as AsaasSubscription;

  if (!subscription || !subscription.id) {
    throw new Error('Dados da assinatura inválidos');
  }

  // Atualizar assinatura no Firestore
  const subscriptionRef = db.collection('subscriptions').doc(subscription.id);
  
  await subscriptionRef.set({
    status: subscription.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    nextDueDate: subscription.nextDueDate,
    value: subscription.value,
    lastEventType: event.event
  }, { merge: true });

  // Se a assinatura foi renovada, atualizar acesso aos cursos
  if (event.event === 'SUBSCRIPTION_RENEWED') {
    const subscriptionDoc = await subscriptionRef.get();
    const subscriptionData = subscriptionDoc.data() as { customerId: string } | undefined;

    if (subscriptionData?.customerId) {
      await updateSubscriptionAccess(subscriptionData.customerId);
    }
  }
}

async function updateCourseAccess(courseId: string, customerId: string) {
  const db = admin.firestore();
  
  await db.collection('course_access').add({
    courseId,
    customerId,
    status: 'ACTIVE',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function updateSubscriptionAccess(customerId: string) {
  const db = admin.firestore();
  
  // Atualizar status de acesso do cliente
  await db.collection('customers').doc(customerId).set({
    subscriptionStatus: 'ACTIVE',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

export const registerAsaasWebhook = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  try {
    const { url } = data;
    
    if (!url) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'URL do webhook não fornecida'
      );
    }

    // Aqui você deve implementar a chamada para a API do Asaas
    // para registrar o webhook usando a URL fornecida
    // const response = await axios.post('https://api.asaas.com/v3/webhook', { url });

    return { success: true, message: 'Webhook registrado com sucesso' };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao registrar webhook',
      error
    );
  }
}); 
