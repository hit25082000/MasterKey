const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const fetch = require('node-fetch');
const config = require('./config');
const { FieldValue } = require('firebase-admin/firestore');

// Inicializar o Firebase Admin
admin.initializeApp();

exports.asaasWebhook = functions.https.onRequest(async (request, response) => {
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
    const event = request.body;
    
    // 4. Registrar evento no Firestore
    const db = admin.firestore();
    const eventRef = db.collection('payment_events').doc();
    
    await eventRef.set({
      ...event,
      createdAt: FieldValue.serverTimestamp(),
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
          processedAt: FieldValue.serverTimestamp()
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
        timestamp: FieldValue.serverTimestamp(),
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

async function processPaymentEvent(event, eventRef) {
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
      updatedAt: FieldValue.serverTimestamp(),
      paymentDate: payment.paymentDate || null,
      netValue: payment.netValue,
      lastEvent: event.event
    }, { merge: true });

    // 2. Se confirmado, atualizar acesso ao curso
    if (event.event === 'PAYMENT_CONFIRMED') {
      const transaction = await paymentRef.get();
      const data = transaction.data();
      
      if (data && data['courseId'] && data['customerId']) {
        await db.collection('course_access').add({
          courseId: data['courseId'],
          customerId: data['customerId'],
          status: 'ACTIVE',
          createdAt: FieldValue.serverTimestamp()
        });
      }
    }

    // 3. Marcar evento como processado
    await eventRef.update({
      status: 'PROCESSED',
      processedAt: FieldValue.serverTimestamp()
    });

  } catch (error) {
    // Registrar falha no processamento
    await eventRef.update({
      status: 'FAILED',
      processedAt: FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

async function processSubscriptionEvent(event, eventRef) {
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
      updatedAt: FieldValue.serverTimestamp(),
      nextDueDate: subscription.nextDueDate,
      lastEvent: event.event
    }, { merge: true });

    // 2. Se renovada, atualizar acesso
    if (event.event === 'SUBSCRIPTION_RENEWED') {
      const subscriptionDoc = await subscriptionRef.get();
      const data = subscriptionDoc.data();

      if (data && data['customerId']) {
        await db.collection('customers').doc(data['customerId']).update({
          subscriptionStatus: 'ACTIVE',
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    // 3. Marcar evento como processado
    await eventRef.update({
      status: 'PROCESSED',
      processedAt: FieldValue.serverTimestamp()
    });

  } catch (error) {
    // Registrar falha no processamento
    await eventRef.update({
      status: 'FAILED',
      processedAt: FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

// Endpoint para criar cliente
exports.createCustomer = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).send();
      return;
    }

    try {
      const customerData = req.body;

      // Validar dados obrigatórios
      if (!customerData.name || !customerData.email || !customerData.cpfCnpj) {
        return res.status(400).json({
          error: 'Dados incompletos do cliente'
        });
      }

      const db = admin.firestore();

      // Buscar cliente existente por email ou CPF
      const emailQuery = await db.collection('customers')
        .where('email', '==', customerData.email)
        .get();

      const cpfQuery = await db.collection('customers')
        .where('cpfCnpj', '==', customerData.cpfCnpj)
        .get();

      // Se encontrar cliente existente, retornar os dados
      if (!emailQuery.empty || !cpfQuery.empty) {
        const existingCustomer = !emailQuery.empty 
          ? emailQuery.docs[0].data()
          : cpfQuery.docs[0].data();

        console.log('Cliente existente encontrado:', existingCustomer);

        return res.status(200).json({
          customerId: existingCustomer.asaasId,
          firestoreId: !emailQuery.empty ? emailQuery.docs[0].id : cpfQuery.docs[0].id,
          ...existingCustomer,
          message: 'Cliente já cadastrado'
        });
      }

      // Se não encontrar, criar novo cliente no Asaas
      const customerResponse = await fetch(`${config.asaas.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        },
        body: JSON.stringify({
          name: customerData.name,
          email: customerData.email,
          cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
          phone: customerData.phone?.replace(/\D/g, ''),
          mobilePhone: customerData.phone?.replace(/\D/g, ''),
          postalCode: customerData.postalCode,
          addressNumber: customerData.addressNumber,
          notificationDisabled: false
        })
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        throw new Error(`Erro ao criar cliente no Asaas: ${errorText}`);
      }

      const asaasCustomer = await customerResponse.json();

      // Salvar novo cliente no Firestore
      const customerRef = db.collection('customers').doc();
      
      await customerRef.set({
        asaasId: asaasCustomer.id,
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj,
        phone: customerData.phone,
        postalCode: customerData.postalCode,
        addressNumber: customerData.addressNumber,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Retornar resposta do novo cliente
      res.status(201).json({
        customerId: asaasCustomer.id,
        firestoreId: customerRef.id,
        ...asaasCustomer,
        message: 'Novo cliente criado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao processar cliente:', error);
      res.status(500).json({
        error: 'Erro ao processar cliente',
        details: error.message
      });
    }
  });
});

// Atualizar o endpoint createAsaasPayment
exports.createAsaasPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).send();
      return;
    }

    try {
      const { 
        amount, 
        courseId, 
        paymentMethod, 
        creditCardInfo,
        customer 
      } = req.body;

      if (!amount || !courseId || !paymentMethod || !customer) {
        return res.status(400).json({
          error: 'Dados incompletos para criar pagamento'
        });
      }

      // Preparar dados do pagamento
      const paymentData = {
        customer: customer.asaasId, // Usar o ID do Asaas
        billingType: paymentMethod,
        value: amount,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Pagamento do curso ${courseId}`,
        externalReference: courseId,
        postalService: false
      };

      // Adicionar dados do cartão se necessário
      if (paymentMethod === 'CREDIT_CARD' && creditCardInfo) {
        paymentData.creditCard = creditCardInfo;
        paymentData.creditCardHolderInfo = {
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
          postalCode: customer.postalCode,
          addressNumber: customer.addressNumber,
          phone: customer.phone.replace(/\D/g, '')
        };
      }

      // Criar pagamento no Asaas
      const paymentResponse = await fetch(`${config.asaas.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        },
        body: JSON.stringify(paymentData)
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        throw new Error(`Erro ao criar pagamento no Asaas: ${errorText}`);
      }

      const asaasPayment = await paymentResponse.json();

      // Salvar transação no Firestore
      const db = admin.firestore();
      const transactionRef = db.collection('transactions').doc(asaasPayment.id);
      
      await transactionRef.set({
        asaasId: asaasPayment.id,
        customerId: customer.firestoreId,
        courseId: courseId,
        amount: amount,
        status: asaasPayment.status,
        paymentMethod: paymentMethod,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        dueDate: asaasPayment.dueDate,
        invoiceUrl: asaasPayment.invoiceUrl,
        bankSlipUrl: asaasPayment.bankSlipUrl,
      });

      res.status(200).json({
        transactionId: asaasPayment.id,
        ...asaasPayment
      });

    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      res.status(500).json({
        error: 'Erro ao criar pagamento',
        details: error.message
      });
    }
  });
}); 