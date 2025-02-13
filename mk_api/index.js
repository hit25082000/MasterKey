const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: true, // Permite todas as origens em desenvolvimento
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type', 
    'Accept',
    'Authorization', 
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  maxAge: 86400 // 24 horas em segundos
});

const { Storage } = require('@google-cloud/storage');
const fetch = require('node-fetch');
const crypto = require('crypto');
const { FieldValue } = require('@google-cloud/firestore');

admin.initializeApp();
const storage = new Storage();
const bucket = storage.bucket('master-key-a3c69.appspot.com');

// Configuração do Asaas
const config = {
  asaas: {
    apiKey: process.env.ASAAS_API_KEY,
    apiUrl: 'https://sandbox.asaas.com/api/v3'
  }
};

// Função para validar CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

// Função para validar CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

// Função para validar telefone
function validatePhone(phone) {
  if (!phone) return null;
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem entre 10 e 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return null;
  }
  
  // Formata o número conforme padrão Asaas
  return cleanPhone.length === 11 ? 
    `55${cleanPhone}` : 
    `55${cleanPhone}`;
}

async function authenticateRequest(req, res, next) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Proibido: Token inválido ou expirado.' });
  }
}

// Middleware para aplicar CORS em todas as funções
const applyMiddleware = (handler) => (req, res) => {
  return cors(req, res, () => {
    // Configurar headers padrão para todas as respostas
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.set('Access-Control-Allow-Credentials', 'true');

    // Responder imediatamente para requisições OPTIONS
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    return handler(req, res);
  });
};

// Métodos de Gerenciamento de Usuário
exports.getUsers = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users.map(userRecord => ({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        }));
        res.status(200).json(users);
      });
    } catch (error) {
      res.status(500).json({ error: `Erro ao buscar usuários: ${error.message}` });
    }
  });
});

exports.createUserWithProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { email, password, userData, iconFile } = req.body;

        if (!email || !password || !userData) {
          return res.status(400).json({ error: 'Dados incompletos.' });
        }

        try {
          // Criar usuário de autenticação
          const userRecord = await admin.auth().createUser({
            email,
            password,
          });

          // Fazer upload do ícone, se fornecido
          let iconUrl = null;
          if (iconFile) {
            const fileName = `${userRecord.uid}_profile.png`;
            const file = bucket.file(fileName);

            // Decodificar a string base64 e salvar como buffer
            const imageBuffer = Buffer.from(iconFile.split(',')[1], 'base64');

            await file.save(imageBuffer, {
              metadata: {
                contentType: 'image/png',
              },
            });

            // Tornar o arquivo público
            await file.makePublic();

            iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          }

          // Adicionar iconUrl aos dados do usuário
          const userDataWithIcon = {
            ...userData,
            profilePic: iconUrl || null
          };

          // Salvar dados do usuário no Firestore
          await admin.firestore().collection('users').doc(userRecord.uid).set(userDataWithIcon);

          // Atualizar o photoURL do usuário de autenticação
          if (iconUrl) {
            await admin.auth().updateUser(userRecord.uid, { photoURL: iconUrl });
          }

          res.status(201).json({ ...userDataWithIcon, uid: userRecord.uid });
        } catch (authError) {
          if (authError.code === 'auth/email-already-exists') {
            return res.status(400).json({ message: 'O e-mail fornecido já está em uso.' });
          }
          throw authError;
        }
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ error: `Erro ao criar usuário: ${error.message}` });
    }
  });
});

exports.updateUserWithProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { uid, email, password, userData, iconFile } = req.body;

        if (!uid) {
          return res.status(400).json({ error: 'UID do usuário é obrigatório.' });
        }

        try {
          // Atualizar usuário de autenticação
          const updateData = {};
          if (email) updateData.email = email;
          if (password) updateData.password = password;

          // Primeiro, obter os dados atuais do usuário
          const currentUserData = await admin.firestore().collection('users').doc(uid).get();

          // Fazer upload do ícone, se fornecido
          let iconUrl = currentUserData.data()?.profilePic || null;
          if (iconFile) {
            const fileName = `${uid}_profile.jpg`;
            const file = bucket.file(fileName);

            // Decodificar a string base64 e salvar como buffer
            const imageBuffer = Buffer.from(iconFile.split(',')[1], 'base64');

            await file.save(imageBuffer, {
              metadata: {
                contentType: 'image/jpg',
              },
            });

            await file.makePublic();

            iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            updateData.profilePic = iconUrl;
          }

          // Atualizar usuário de autenticação com todos os dados
          const userRecord = await admin.auth().updateUser(uid, updateData);

          // Atualizar dados do usuário no Firestore
          const userDataWithIcon = {
            ...userData,
            profilePic: iconUrl
          };

          await admin.firestore().collection('users').doc(uid).update(userDataWithIcon);

          res.status(200).json({ ...userRecord, ...userDataWithIcon });
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            return res.status(400).json({ message: 'O e-mail fornecido já está em uso.' });
          }
          throw authError;
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: `Erro ao atualizar usuário: ${error.message}` });
    }
  });
});

exports.deleteUserWithProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { uid } = req.body;

        if (!uid) {
          return res.status(400).json({ error: 'UID do usuário é obrigatório.' });
        }

        try {
          // 1. Buscar dados do usuário antes de excluir
          const userDoc = await admin.firestore().collection('users').doc(uid).get();
          
          if (!userDoc.exists) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
          }

          const userData = userDoc.data();

          // 2. Excluir imagem de perfil se existir
          if (userData.profilePic) {
            try {
              const fileName = `${uid}_profile.jpg`;
              await bucket.file(fileName).delete();
              console.log(`Imagem de perfil ${fileName} excluída com sucesso`);
            } catch (storageError) {
              console.warn('Erro ao excluir imagem de perfil:', storageError);
            }
          }

          // 3. Excluir dados relacionados em batch
          const batch = admin.firestore().batch();

          // Excluir documento do usuário
          batch.delete(admin.firestore().collection('users').doc(uid));

          // Buscar e excluir progresso do estudante
          const progressSnapshot = await admin.firestore()
            .collection('student_progress')
            .where('studentId', '==', uid)
            .get();
          
          progressSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Buscar e excluir cursos do estudante
          const coursesSnapshot = await admin.firestore()
            .collection('student_courses')
            .where('studentId', '==', uid)
            .get();
          
          coursesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Buscar e excluir transações do usuário
          const transactionsSnapshot = await admin.firestore()
            .collection('transactions')
            .where('userId', '==', uid)
            .get();
          
          transactionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Executar todas as exclusões em batch
          await batch.commit();
          console.log('Dados do usuário excluídos com sucesso do Firestore');

          // 4. Antes de excluir, atualizar o email do usuário para liberar o email original
          const userRecord = await admin.auth().getUser(uid);
          const originalEmail = userRecord.email;
          
          // Gerar um email temporário único
          const tempEmail = `deleted_${uid}_${new Date()}@deleted.com`;
          
          // Atualizar o email do usuário antes de excluí-lo
          await admin.auth().updateUser(uid, {
            email: tempEmail,
            disabled: true
          });
          
          // Agora sim, excluir o usuário
          await admin.auth().deleteUser(uid);
          console.log('Usuário excluído do Firebase Auth');

          res.status(200).json({ 
            message: 'Usuário excluído com sucesso.',
            email: originalEmail
          });
        } catch (deleteError) {
          console.error('Erro durante o processo de exclusão:', deleteError);
          throw deleteError;
        }
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({ error: `Erro ao excluir usuário: ${error.message}` });
    }
  });
});

// Função para criar pagamento no Asaas
exports.asaasWebhook = functions.https.onRequest(async (req, res) => {
  // Configurar headers CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Responder imediatamente para requisições OPTIONS
    if (req.method === 'OPTIONS') {
    res.status(204).send('');
      return;
    }

  // Verificar se é POST
  if (req.method !== 'POST') {
    res.status(405).send('Método não permitido');
      return;
      }

      try {
    // Log para debug
    console.log('Webhook recebido:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Validar corpo da requisição
    if (!req.body || !req.body.event) {
      console.warn('Corpo da requisição inválido:', req.body);
        return res.status(400).json({
        error: 'Requisição inválida',
        details: 'Corpo da requisição ausente ou malformado'
      });
    }

    // Processar evento
    const event = req.body;
    
    // Registrar evento no Firestore
    const db = admin.firestore();
    const eventRef = db.collection('payment_events').doc();
    
    await eventRef.set({
      ...event,
      createdAt: new Date(),
      processedAt: null,
      status: 'PENDING',
      error: null,
      rawData: JSON.stringify(req.body)
    });

    // Processar evento baseado no tipo
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
          processedAt: new Date()
        });
    }

    // Responder com sucesso
    res.status(200).json({
      message: 'Evento processado com sucesso',
      eventId: eventRef.id
    });

  } catch (error) {
    // Log detalhado do erro
    console.error('Erro ao processar webhook:', error);
    
    // Tentar extrair mensagem de erro mais útil
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido';
    
    // Registrar erro no Firestore
    try {
      const db = admin.firestore();
      await db.collection('webhook_errors').add({
        timestamp: new Date(),
        error: errorMessage,
        request: {
          method: req.method,
          headers: req.headers,
          body: req.body
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar erro:', logError);
    }

    // Responder com erro
    res.status(500).json({
      error: 'Erro interno ao processar webhook',
      details: errorMessage
    });
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
      updatedAt: new Date(),
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
          createdAt: new Date()
        });
      }
    }

    // 3. Marcar evento como processado
    await eventRef.update({
      status: 'PROCESSED',
      processedAt: new Date()
    });

    } catch (error) {
    // Registrar falha no processamento
    await eventRef.update({
      status: 'FAILED',
      processedAt: new Date(),
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
      updatedAt: new Date(),
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
          updatedAt: new Date()
        });
      }
    }

    // 3. Marcar evento como processado
    await eventRef.update({
      status: 'PROCESSED',
      processedAt: new Date()
    });

  } catch (error) {
    // Registrar falha no processamento
    await eventRef.update({
      status: 'FAILED',
      processedAt: new Date(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    throw error;
  }
}

// Endpoint para criar cliente
exports.createCustomer = functions.https.onRequest(applyMiddleware(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  try {
    const customerData = req.body;

    // Validar dados obrigatórios
    if (!customerData.name || !customerData.email || !customerData.cpfCnpj) {
      return res.status(400).json({
        error: 'Dados incompletos do cliente',
        details: 'Nome, email e CPF/CNPJ são obrigatórios'
      });
    }

    // Validar formato do CPF/CNPJ
    const document = customerData.cpfCnpj.replace(/[^\d]/g, '');
    const isValid = document.length === 11 ? validateCPF(document) : validateCNPJ(document);
    
    if (!isValid) {
      return res.status(400).json({
        error: 'CPF/CNPJ inválido',
        details: 'O documento fornecido não é válido'
      });
    }

    // Validar e formatar telefone
    const formattedPhone = validatePhone(customerData.phone);
    if (customerData.phone && !formattedPhone) {
      return res.status(400).json({
        error: 'Telefone inválido',
        details: 'O número de telefone fornecido é inválido'
      });
    }

    // 1. Criar cliente no Asaas
    const customerResponse = await fetch(`${config.asaas.apiUrl}/customers`, {
      method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': config.asaas.apiKey
      },
      body: JSON.stringify({
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: document,
        phone: formattedPhone,
        mobilePhone: formattedPhone,
        postalCode: customerData.postalCode,
        addressNumber: customerData.addressNumber,
        notificationDisabled: false
      })
    });

    const responseText = await customerResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Erro ao fazer parse da resposta:', responseText);
      throw new Error('Resposta inválida do Asaas');
    }

        if (!customerResponse.ok) {
      console.error('Erro Asaas:', responseData);
      if (customerResponse.status === 401) {
        throw new Error('Erro de autenticação com a API do Asaas. Verifique a chave de API.');
      }
      throw new Error(responseData.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
    }
    // 2. Salvar no Firestore
    const db = admin.firestore();
    const customerRef = db.collection('customers').doc();
    
    await customerRef.set({
      asaasId: responseData.id,
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj,
      phone: formattedPhone,
      postalCode: customerData.postalCode,
      addressNumber: customerData.addressNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    // 3. Retornar resposta
    res.status(200).json({
      customerId: responseData.id,
      firestoreId: customerRef.id,
      ...responseData
    });
    
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({
      error: 'Erro ao criar cliente',
      details: error.message
    });
  }
}));

// Atualizar o endpoint createAsaasPayment
exports.createAsaasPayment = functions.https.onRequest(applyMiddleware(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  try {
    const { 
      value, 
      externalReference, 
      billingType, 
      creditCardInfo,
      description,
      dueDate,
      customer 
    } = req.body;

    console.log(req.body)
    if (!value || !externalReference || !billingType || !customer) {
      return res.status(400).json({
        error: 'Dados incompletos para criar pagamento'
      });
    }

    // Preparar dados do pagamento
    const paymentData = {
      customer: customer, // Usar o ID do Asaas
      billingType: billingType,
      value: value,
      dueDate: dueDate,
      description: description,
      externalReference: externalReference,
    };       

    const paymentResponse = await fetch(`${config.asaas.apiUrl}/payments`, {
      method: 'POST',
          headers: {
        accept: 'application/json',
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
      customerId: asaasPayment.customer,
      courseId: externalReference,
      amount: value,
      status: asaasPayment.status,
      paymentMethod: billingType,
      createdAt: new Date(),
      updatedAt:  new Date(),
      dueDate: asaasPayment.dueDate,
      invoiceUrl: asaasPayment.invoiceUrl,
      bankSlipUrl: asaasPayment.bankSlipUrl
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
}));

// Função para criar link de pagamento com parcelamento
async function createPaymentLink(courseId, courseName, coursePrice, portionCount) {
  try {
    // Criar link de pagamento no Asaas
    const linkResponse = await fetch(`${config.asaas.apiUrl}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.asaas.apiKey
      },
      body: JSON.stringify({
        name: courseName,
        description: `Pagamento do curso: ${courseName}`,
        value: coursePrice,
        billingType: 'CREDIT_CARD',
        chargeType: 'INSTALLMENT',
        maxInstallmentCount: portionCount || 12,
        dueDateLimitDays: 10,
        subscriptionCycle: null,
        active: true,
        allowInstallment: true,
        showDescription: true,
        showNumericalInstallments: true,
        fine: {
          value: 1,
          type: 'PERCENTAGE'
        },
        interest: {
          value: 2,
          type: 'PERCENTAGE'
        }
      })
    });

    const responseText = await linkResponse.text();
    console.log('Resposta da criação do link:', responseText);
    console.log('Resposta da criação do link:', linkResponse);

    if (!linkResponse.ok) {
      throw new Error(`Erro ao criar link de pagamento: ${responseText}`);
    }

    const linkData = JSON.parse(responseText);
    return linkData;
  } catch (error) {
    console.error('Erro ao criar link de pagamento:', error);
    throw error;
  }
}

// Endpoint para criar link de pagamento
exports.createPaymentLink = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).send();
      return;
    }

    try {
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({
          error: 'ID do curso não fornecido'
        });
      }

      // Buscar dados do curso no Firestore
      const courseDoc = await admin.firestore()
        .collection('courses')
        .doc(courseId)
        .get();

      if (!courseDoc.exists) {
        throw new Error('Curso não encontrado');
      }

      const courseData = courseDoc.data();

      // Criar ou recuperar link de pagamento
      const linkData = await createPaymentLink(
        courseId,
        courseData.name,
        courseData.price,
        courseData.portionCount
      );

      // Salvar link no Firestore
      await admin.firestore().collection('payment_links').add({
        courseId,
        courseName: courseData.name,
        coursePrice: courseData.price,
        url: linkData.url,
        asaasId: linkData.id,
        createdAt: new Date().toISOString(),
        active: true
      });

      res.status(200).json(linkData);
    } catch (error) {
      console.error('Erro ao processar link de pagamento:', error);
      res.status(500).json({
        error: 'Erro ao processar link de pagamento',
        details: error.message
      });
    }
  });
});

// Função para criar assinatura
async function createSubscription(customer, courseData, cycle = 'MONTHLY', paymentMethod = 'BOLETO') {
  try { 
    // Criar cliente no Asaas
      const customerResponse = await fetch(`${config.asaas.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
          phone: customer.phone.replace(/\D/g, ''),
          mobilePhone: customer.phone.replace(/\D/g, ''),
        postalCode: customer.postalCode,
        addressNumber: customer.addressNumber,
          notificationDisabled: false
        })
      });

      if (!customerResponse.ok) {
      throw new Error('Erro ao criar cliente no Asaas');
      }

    const customerData = await customerResponse.json();

    // Criar assinatura
    const subscriptionData = {
      customer: customerData.id,
      billingType: paymentMethod,
      nextDueDate: new Date(new Date() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: courseData.price,
      cycle: cycle,
      description: `Assinatura do curso: ${courseData.name}`,
      externalReference: courseData.id,
      maxInstallments: req.body.maxInstallments || 1
    };

    // Adicionar dados do cartão se necessário
    if (paymentMethod === 'CREDIT_CARD' && customer.creditCard) {
      subscriptionData.creditCard = customer.creditCard;
      subscriptionData.creditCardHolderInfo = {
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''),
        postalCode: customer.postalCode,
        addressNumber: customer.addressNumber,
        phone: customer.phone.replace(/\D/g, '')
      };
    }

    const subscriptionResponse = await fetch(`${config.asaas.apiUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.asaas.apiKey
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!subscriptionResponse.ok) {
      throw new Error('Erro ao criar assinatura');
    }

    const subscription = await subscriptionResponse.json();

    // Buscar primeiro pagamento da assinatura
    const paymentsResponse = await fetch(
      `${config.asaas.apiUrl}/subscriptions/${subscription.id}/payments`,
      {
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        }
      }
    );

    if (!paymentsResponse.ok) {
      throw new Error('Erro ao buscar pagamentos da assinatura');
    }

    const paymentsData = await paymentsResponse.json();
    const firstPayment = paymentsData.data[0];

    // Para PIX, gerar QR Code
    if (paymentMethod === 'PIX' && firstPayment) {
      const pixResponse = await fetch(
        `${config.asaas.apiUrl}/payments/${firstPayment.id}/pixQrCode`,
        {
          headers: {
            'access_token': config.asaas.apiKey
          }
        }
      );

      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        firstPayment.pixQrCodeUrl = pixData.encodedImage;
        firstPayment.pixCopiaECola = pixData.payload;
      }
    }

    return {
      subscription,
      payment: firstPayment ? {
        id: firstPayment.id,
        value: firstPayment.value,
        dueDate: firstPayment.dueDate,
        status: firstPayment.status,
        invoiceUrl: firstPayment.invoiceUrl,
        bankSlipUrl: firstPayment.bankSlipUrl,
        pixQrCodeUrl: firstPayment.pixQrCodeUrl,
        pixCopiaECola: firstPayment.pixCopiaECola
      } : null
    };
  } catch (error) {
    console.error('Erro detalhado na criação de assinatura:', error);
    throw error;
  }
}

// Endpoint para criar assinatura
exports.createSubscription = functions.https.onRequest(applyMiddleware(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(200).send();
      return;
    }

    try {
      const { courseId, customer, cycle, paymentMethod } = req.body;

      if (!courseId || !customer || !customer.cpfCnpj || !paymentMethod) {
        return res.status(400).json({
          error: 'Dados incompletos para criar assinatura. CourseId, customer (com CPF) e paymentMethod são obrigatórios.'
        });
      }

      // Validar método de pagamento
      if (!['BOLETO', 'PIX'].includes(paymentMethod)) {
        return res.status(400).json({
          error: 'Método de pagamento inválido. Use BOLETO ou PIX.'
        });
      }

      // Buscar dados do curso
      const courseDoc = await admin.firestore()
        .collection('courses')
        .doc(courseId)
        .get();

      if (!courseDoc.exists) {
        throw new Error('Curso não encontrado');
      }

      const courseData = courseDoc.data();

      // Criar assinatura
      const subscriptionData = await createSubscription(customer, courseData, cycle, paymentMethod);
      console.log('Dados da assinatura criada:', subscriptionData);

      // Buscar dados do primeiro pagamento da assinatura
    const paymentsResponse = await fetch(`${config.asaas.apiUrl}/subscriptions/${subscriptionData.subscription.id}/payments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        }
      });

      if (!paymentsResponse.ok) {
        throw new Error('Erro ao buscar pagamentos da assinatura');
      }

      const paymentsData = await paymentsResponse.json();
      const firstPayment = paymentsData.data[0];
      console.log("dados de primeiro pagamento", firstPayment)
      // Buscar dados específicos do pagamento (boleto/pix)
      const paymentResponse = await fetch(`${config.asaas.apiUrl}/payments/${firstPayment.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        }
      });

      
      if (!paymentResponse.ok) {
        throw new Error('Erro ao buscar dados do pagamento');
      }
      
      const paymentData = await paymentResponse.json();
      
      console.log("resposta do pagamento", paymentData)
      // Salvar assinatura no Firestore
      const subscriptionRef = await admin.firestore().collection('subscriptions').add({
        courseId: courseId,
        courseName: courseData.name,
      customerId: subscriptionData.subscription.customer,
        customerEmail: customer.email,
      asaasSubscriptionId: subscriptionData.subscription.id,
        value: courseData.price,
        cycle: cycle || 'MONTHLY',
        paymentMethod: paymentMethod,
      status: subscriptionData.subscription.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      subscriptionDetails: subscriptionData.subscription
      });

      // Salvar o primeiro pagamento da assinatura
    const transactionData = {
      customerId: customer.id,
        courseId: courseId,
        status: paymentData.status,
      type: 'INSTALLMENT',
        paymentMethod: paymentMethod,
      amount: paymentData.value,
      dueDate: paymentData.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      installmentId: firstPayment.id,
      installmentNumber: 1,
      totalInstallments: 1,
      invoiceUrl: paymentData.invoiceUrl,
      bankSlipUrl: paymentData.bankSlipUrl,
      pixQrCodeUrl: paymentData.pixQrCodeUrl,
      paymentDetails: {
        description: description,
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        pixQrCodeUrl: paymentData.pixQrCodeUrl,
        pixCopiaECola: paymentData.pixCopiaECola,
        dueDate: paymentData.dueDate,
        installmentInfo: {
          installmentNumber: 1,
          totalInstallments: 1,
          installmentValue: paymentData.value
        }
      }
    };

    await admin.firestore().collection('transactions').add(transactionData);

      res.status(200).json({
      subscription: subscriptionData.subscription,
        payment: {
          id: paymentData.id,
          value: paymentData.value,
          dueDate: paymentData.dueDate,
          status: paymentData.status,
          invoiceUrl: paymentData.invoiceUrl,
          bankSlipUrl: paymentData.bankSlipUrl,
          pixQrCodeUrl: paymentData.pixQrCodeUrl,
          pixCopiaECola: paymentData.pixCopiaECola
        }
      });

    } catch (error) {
    console.error('Erro ao processar assinatura:', error);
      res.status(500).json({
        error: 'Erro ao processar assinatura',
        details: error.message
      });
    }
}));

// Função para download de imagem
exports.downloadImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { studentId } = req.query;

        if (!studentId) {
          return res.status(400).json({ error: 'ID do estudante não fornecido' });
        }

        try {
          // Tentar diferentes extensões de arquivo
          const extensions = ['jpg', 'jpeg', 'png', 'webp'];
          let file;
          let exists = false;

          // Procurar por arquivo com diferentes extensões
          for (const ext of extensions) {
            const fileName = `${studentId}_profile.${ext}`;
            file = bucket.file(fileName);
            [exists] = await file.exists();
            if (exists) break;
          }

          if (!exists || !file) {
            return res.status(404).json({ error: 'Imagem não encontrada' });
          }

          // Fazer download do arquivo
          const [fileBuffer] = await file.download();

          // Configurar headers da resposta
          res.set('Content-Type', 'application/octet-stream');
          res.set('Content-Disposition', 'attachment; filename=image');
          
          // Enviar o buffer da imagem
          res.send(fileBuffer);

        } catch (error) {
          console.error('Erro ao fazer download da imagem:', error);
          res.status(500).json({ 
            error: 'Erro ao fazer download da imagem',
            details: error.message 
          });
        }
      });
    } catch (error) {
      console.error('Erro na autenticação:', error);
      res.status(401).json({ error: 'Erro de autenticação' });
    }
  });
});

// Endpoint para criar assinatura no Asaas
exports.createAsaasSubscription = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder imediatamente para requisições OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Verificar se é POST
  if (req.method !== 'POST') {
    res.status(405).send('Método não permitido');
    return;
  }
  cors(req, res, async () => {
    try {
      const { 
        customer,
        billingType,
        value,
        nextDueDate,
        cycle,
        description,
        courseId 
      } = req.body;

      if (!customer || !value || !courseId) {
        return res.status(400).json({
          error: 'Dados incompletos para criar assinatura'
        });
      }

      // Preparar dados da assinatura
      const subscriptionData = {
        customer: customer,
        billingType: billingType || 'BOLETO',
        value: value,
        nextDueDate: nextDueDate || new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cycle: cycle || 'MONTHLY',
        description: description || `Assinatura do curso ${courseId}`,
        externalReference: courseId,
        maxInstallments: req.body.maxInstallments || 1
      };

      // Criar assinatura no Asaas
      const subscriptionResponse = await fetch(`${config.asaas.apiUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        throw new Error(`Erro ao criar assinatura no Asaas: ${errorText}`);
      }

      const asaasSubscription = await subscriptionResponse.json();

      // Buscar o primeiro pagamento da assinatura
      const paymentsResponse = await fetch(`${config.asaas.apiUrl}/subscriptions/${asaasSubscription.id}/payments`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        }
      });

      if (!paymentsResponse.ok) {
        const errorText = await paymentsResponse.text();
        throw new Error(`Erro ao buscar pagamentos da assinatura: ${errorText}`);
      }

      const payments = await paymentsResponse.json();
      const firstPayment = payments.data && payments.data.length > 0 ? payments.data[0] : null;

      // Salvar assinatura no Firestore
      const db = admin.firestore();
      const subscriptionRef = db.collection('subscriptions').doc(asaasSubscription.id);

      await subscriptionRef.set({
        asaasId: asaasSubscription.id,
        customerId: customer,
        courseId: courseId,
        value: value,
        status: asaasSubscription.status,
        cycle: cycle || 'MONTHLY',
        nextDueDate: asaasSubscription.nextDueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        maxInstallments: req.body.maxInstallments || 1,
        currentInstallment: 1,
        firstPaymentId: firstPayment ? firstPayment.id : null
      });

      // Se houver primeiro pagamento, salvar também na coleção de transações
      if (firstPayment) {
        const paymentRef = db.collection('transactions').doc(firstPayment.id);
        await paymentRef.set({
          asaasId: firstPayment.id,
          subscriptionId: asaasSubscription.id,
          customerId: customer,
          courseId: courseId,
          amount: firstPayment.value,
          status: firstPayment.status,
          paymentMethod: billingType,
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: firstPayment.dueDate,
          invoiceUrl: firstPayment.invoiceUrl,
          bankSlipUrl: firstPayment.bankSlipUrl,
          installmentNumber: 1,
          totalInstallments: req.body.maxInstallments || 1
        });
      }

      res.status(200).json({
        id: asaasSubscription.id,
        status: asaasSubscription.status,
        maxInstallments: req.body.maxInstallments || 1,
        currentInstallment: 1,
        firstPayment: firstPayment ? {
          id: firstPayment.id,
          status: firstPayment.status,
          invoiceUrl: firstPayment.invoiceUrl,
          bankSlipUrl: firstPayment.bankSlipUrl,
          pixQrCodeUrl: firstPayment.pixQrCodeUrl,
          installmentNumber: 1
        } : null,
        message: 'Assinatura criada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      res.status(500).json({
        error: 'Erro ao criar assinatura',
        details: error.message
      });
    }
  });
});

// Endpoint para criar pagamento parcelado
exports.createInstallmentPayment = functions.https.onRequest((req, res) => {
  return applyMiddleware(async (req, res) => {
    try {
      const { customer, billingType, totalValue, installmentCount, dueDate, description, courseId } = req.body;

      if (!customer || !billingType || !totalValue || !installmentCount || !dueDate || !description || !courseId) {
        return res.status(400).json({ error: 'Dados incompletos para criar parcelamento' });
      }

      // Calcular datas de vencimento para cada parcela
      const installmentDates = [];
      let currentDate = new Date(dueDate);
      
      for (let i = 0; i < installmentCount; i++) {
        installmentDates.push(new Date(currentDate));
        // Adiciona um mês para a próxima parcela
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Criar parcelamento no Asaas com as datas calculadas
      const installmentData = {
        customer,
        billingType,
        totalValue,
        installmentCount,
        dueDate,
        description,
        externalReference: courseId,
        fine: {
          value: 10,  // 10% de multa por atraso
          type: 'PERCENTAGE'
        },
        interest: {
          value: 0,   // Sem juros diários
          type: 'PERCENTAGE'
        },
        installments: installmentDates.map((date, index) => ({
          value: totalValue / installmentCount,
          dueDate: date.toISOString().split('T')[0]
        }))
      };

      const response = await fetch(`${config.asaas.apiUrl}/installments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        },
        body: JSON.stringify(installmentData)
      });

      const installmentResponse = await response.json();

      if (!response.ok) {
        throw new Error(installmentResponse.message || 'Erro ao criar parcelamento');
      }


      console.log(installmentResponse)
      // Buscar detalhes das parcelas
      const paymentsResponse = await fetch(`${config.asaas.apiUrl}/installments/${installmentResponse.id}/payments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        }
      });

      const paymentsData = await paymentsResponse.json();

      console.log(paymentsData)

      // Salvar dados do parcelamento no Firestore
      const db = admin.firestore();
      const batch = db.batch();

      // Documento principal do parcelamento
      const installmentRef = db.collection('installments').doc(installmentResponse.id);
      batch.set(installmentRef, {
        id: installmentResponse.id,
        customerId: customer,
        courseId,
        status: 'PENDING',
        type: 'INSTALLMENT',
        paymentMethod: billingType,
        totalValue,
        installmentCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description,
        dueDate
      });

      // Salvar cada parcela individualmente com sua respectiva data de vencimento
      paymentsData.data.forEach((payment, index) => {
        const paymentRef = db.collection('transactions').doc(payment.id);
        const transactionData = {
          customerId: customer,
          courseId,
          status: payment.status,
          type: 'INSTALLMENT',
          paymentMethod: billingType,
          amount: payment.value,
          dueDate: payment.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          installmentId: installmentResponse.id,
          installmentNumber: payment.installmentNumber,
          totalInstallments: installmentCount,
          invoiceUrl: payment.invoiceUrl,
          description: `${description} - Parcela ${payment.installmentNumber}/${installmentCount}`,
          paymentDetails: {
            description: description,
            invoiceUrl: payment.invoiceUrl,
            bankSlipUrl: payment.bankSlipUrl,
            dueDate: payment.dueDate,
            installmentInfo: {
              installmentNumber: payment.installmentNumber,
              totalInstallments: installmentCount,
              installmentValue: payment.value
            }
          }
        };
        batch.set(paymentRef, transactionData);
      });

      await batch.commit();

      // Ordenar pagamentos por data de vencimento e pegar o mais próximo
      const sortedPayments = paymentsData.data.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      });

      const firstPayment = sortedPayments[0] || null;

      res.json({
        id: installmentResponse.id,
        status: 'PENDING',
        totalValue,
        installmentCount,
        payments: sortedPayments,
        invoiceUrl: firstPayment?.invoiceUrl,
        firstPayment: firstPayment
      });
    } catch (error) {
      console.error('Erro ao criar parcelamento:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao criar parcelamento' });
    }
  })(req, res);
});



