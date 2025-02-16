const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const db = admin.firestore();

// Webhook para receber notificações do Asaas
exports.asaasWebhook = functions.https.onRequest(async (request, response) => {
  try {
    const event = request.body.event;
    const payment = request.body.payment;
    const subscription = request.body.subscription;

    // Processamento assíncrono dos eventos
    await processAsaasEvent(event, payment, subscription);

    // Responde imediatamente ao Asaas
    response.status(200).send('Webhook processado com sucesso');

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    response.status(500).send('Erro ao processar webhook');
  }
});

async function processAsaasEvent(event, payment, subscription) {
  const batch = db.batch();

  try {
    switch (event) {
      // Eventos de Pagamento
      case 'PAYMENT_CREATED':
        await updatePaymentStatus(payment.id, {
          status: payment.status,
          value: payment.value,
          dueDate: payment.dueDate,
          invoiceUrl: payment.invoiceUrl,
          bankSlipUrl: payment.bankSlipUrl,
          invoiceNumber: payment.invoiceNumber
        }, batch);
        break;

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await updatePaymentStatus(payment.id, {
          status: 'CONFIRMED',
          value: payment.value,
          paymentDate: payment.paymentDate,
          confirmedDate: payment.confirmedDate
        }, batch);
        break;

      case 'PAYMENT_REFUNDED':
        await updatePaymentStatus(payment.id, {
          status: 'REFUNDED',
          value: payment.value,
          refundedDate: payment.refundedDate
        }, batch);
        break;

      // Eventos de Assinatura
      case 'SUBSCRIPTION_CREATED':
        await updateSubscriptionStatus(subscription.id, {
          status: subscription.status,
          value: subscription.value,
          nextDueDate: subscription.nextDueDate,
          description: subscription.description
        }, batch);
        break;

      case 'SUBSCRIPTION_UPDATED':
        await updateSubscriptionStatus(subscription.id, {
          status: subscription.status,
          value: subscription.value,
          nextDueDate: subscription.nextDueDate
        }, batch);
        break;

      case 'SUBSCRIPTION_INACTIVATED':
      case 'SUBSCRIPTION_CANCELLED':
        await updateSubscriptionStatus(subscription.id, {
          status: 'INACTIVE',
          canceledDate: new Date().toISOString()
        }, batch);
        break;

      default:
    }

    // Commit das alterações em batch
    await batch.commit();

  } catch (error) {
    console.error('Erro ao processar evento:', event, error);
    throw error;
  }
}

async function updatePaymentStatus(paymentId, updates, batch) {
  try {
    // Busca o documento do pagamento
    const paymentRef = db.collection('transactions').doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      console.error('Pagamento não encontrado:', paymentId);
      return;
    }

    // Atualiza o status e outros detalhes do pagamento
    batch.update(paymentRef, {
      'paymentDetails.status': updates.status,
      'paymentDetails.value': updates.value,
      'paymentDetails.dueDate': updates.dueDate,
      'paymentDetails.paymentDate': updates.paymentDate,
      'paymentDetails.confirmedDate': updates.confirmedDate,
      'paymentDetails.refundedDate': updates.refundedDate,
      'paymentDetails.invoiceUrl': updates.invoiceUrl,
      'paymentDetails.bankSlipUrl': updates.bankSlipUrl,
      'paymentDetails.invoiceNumber': updates.invoiceNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Erro ao atualizar status do pagamento:', paymentId, error);
    throw error;
  }
}

async function updateSubscriptionStatus(subscriptionId, updates, batch) {
  try {
    // Busca o documento da assinatura
    const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      console.error('Assinatura não encontrada:', subscriptionId);
      return;
    }

    // Atualiza o status e outros detalhes da assinatura
    batch.update(subscriptionRef, {
      status: updates.status,
      value: updates.value,
      nextDueDate: updates.nextDueDate,
      description: updates.description,
      canceledDate: updates.canceledDate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Erro ao atualizar status da assinatura:', subscriptionId, error);
    throw error;
  }
} 