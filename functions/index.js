const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

exports.createAsaasPayment = functions.https.onCall(async (data, context) => {
  try {
    const { amount, courseId, paymentMethod, customer } = data;
    
    // Criar cliente no Asaas se necessário
    const asaasCustomer = await createOrGetAsaasCustomer(customer);

    // Criar pagamento no Asaas
    const paymentResponse = await createPaymentInAsaas({
      customer: asaasCustomer.id,
      billingType: paymentMethod.toUpperCase(),
      value: amount,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Pagamento do curso ${courseId}`,
      externalReference: courseId
    });

    // Salvar no Firestore
    const firestorePayment = {
      id: paymentResponse.id,
      customerEmail: customer.email,
      courseId: courseId,
      type: 'PAYMENT',
      paymentDetails: paymentResponse,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('transactions').doc(paymentResponse.id).set(firestorePayment);

    return paymentResponse;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao criar pagamento');
  }
});

exports.createSubscription = functions.https.onCall(async (data, context) => {
  try {
    const { customer, courseId, paymentMethod, cycle } = data;
    
    // Criar cliente no Asaas se necessário
    const asaasCustomer = await createOrGetAsaasCustomer(customer);

    // Criar assinatura no Asaas
    const subscriptionResponse = await createSubscriptionInAsaas({
      customer: asaasCustomer.id,
      billingType: paymentMethod.toUpperCase(),
      value: amount,
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: cycle.toUpperCase(),
      description: `Assinatura do curso ${courseId}`,
      externalReference: courseId
    });

    // Salvar assinatura no Firestore
    const firestoreSubscription = {
      id: subscriptionResponse.subscription.id,
      customerEmail: customer.email,
      courseId: courseId,
      status: 'ACTIVE',
      value: amount,
      nextDueDate: subscriptionResponse.payment.dueDate,
      subscriptionDetails: subscriptionResponse,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('subscriptions')
      .doc(subscriptionResponse.subscription.id)
      .set(firestoreSubscription);

    // Salvar primeiro pagamento no Firestore
    if (subscriptionResponse.payment) {
      const firestorePayment = {
        id: subscriptionResponse.payment.id,
        customerEmail: customer.email,
        courseId: courseId,
        type: 'SUBSCRIPTION',
        subscriptionId: subscriptionResponse.subscription.id,
        paymentDetails: subscriptionResponse.payment,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore().collection('transactions')
        .doc(subscriptionResponse.payment.id)
        .set(firestorePayment);
    }

    return subscriptionResponse;
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao criar assinatura');
  }
});

// Webhook para receber notificações do Asaas
exports.asaasWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const event = req.body;
    const payment = event.payment;
    
    if (event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED') {
      // Atualizar pagamento no Firestore
      const paymentDoc = await admin.firestore().collection('transactions').doc(payment.id).get();
      
      if (paymentDoc.exists) {
        const paymentData = paymentDoc.data();
        await paymentDoc.ref.update({
          'paymentDetails.status': payment.status,
          'paymentDetails.value': payment.value,
          'paymentDetails.netValue': payment.netValue,
          'paymentDetails.paymentDate': payment.paymentDate,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
});

// Funções auxiliares
async function createOrGetAsaasCustomer(customer) {
  const { name, email, cpfCnpj } = customer;
  
  try {
    // Buscar cliente existente por CPF/CNPJ
    const customersRef = admin.firestore().collection('asaas_customers');
    const snapshot = await customersRef.where('cpfCnpj', '==', cpfCnpj).get();
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }

    // Criar novo cliente no Asaas
    const response = await axios.post(
      `${process.env.ASAAS_API_URL}/customers`,
      {
        name,
        email,
        cpfCnpj
      },
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY
        }
      }
    );

    const asaasCustomer = response.data;

    // Salvar cliente no Firestore
    await customersRef.doc(asaasCustomer.id).set({
      id: asaasCustomer.id,
      name,
      email,
      cpfCnpj,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return asaasCustomer;
  } catch (error) {
    console.error('Erro ao criar/buscar cliente:', error);
    throw error;
  }
}

async function createPaymentInAsaas(paymentData) {
  try {
    const response = await axios.post(
      `${process.env.ASAAS_API_URL}/payments`,
      paymentData,
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erro ao criar pagamento no Asaas:', error);
    throw error;
  }
}

async function createSubscriptionInAsaas(subscriptionData) {
  try {
    const response = await axios.post(
      `${process.env.ASAAS_API_URL}/subscriptions`,
      subscriptionData,
      {
        headers: {
          'access_token': process.env.ASAAS_API_KEY
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erro ao criar assinatura no Asaas:', error);
    throw error;
  }
} 