const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: ['http://localhost:4200', 'https://master-key-a3c69.web.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'access_token'
  ],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false
});
const { Storage } = require('@google-cloud/storage');
const fetch = require('node-fetch');
const crypto = require('crypto');

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
          const tempEmail = `deleted_${uid}_${Date.now()}@deleted.com`;
          
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

      try {
        // Criar ou recuperar cliente no Asaas
        console.log('Criando cliente no Asaas:', {
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
          phone: customer.phone
        });

        const customerResponse = await fetch(`${config.asaas.apiUrl}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': config.asaas.apiKey
          },
          body: JSON.stringify({
            name: customer.name,
            email: customer.email,
            cpfCnpj: customer.cpfCnpj,
            phone: customer.phone,
            mobilePhone: customer.phone // Campo adicional requerido pelo Asaas
          })
        });

        const responseText = await customerResponse.text();
        console.log('Resposta do Asaas:', responseText);

        if (!customerResponse.ok) {
          throw new Error(`Erro ao criar cliente no Asaas: ${responseText}`);
        }

        const customerData = JSON.parse(responseText);

        // Preparar dados base do pagamento
        const paymentData = {
          customer: customerData.id,
          billingType: paymentMethod,
          value: amount,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Pagamento do curso ${courseId}`,
          externalReference: courseId,
          postalService: false
        };

        // Adicionar dados do cartão se necessário
        if (paymentMethod === 'CREDIT_CARD') {
          paymentData.billingType = 'CREDIT_CARD';
          paymentData.creditCardToken = null; // Será preenchido pelo checkout do Asaas
          paymentData.creditCard = {
            holderName: customer.name,
            number: null, // Será preenchido pelo checkout do Asaas
            expiryMonth: null, // Será preenchido pelo checkout do Asaas
            expiryYear: null, // Será preenchido pelo checkout do Asaas
            ccv: null // Será preenchido pelo checkout do Asaas
          };
          paymentData.creditCardHolderInfo = {
            name: customer.name,
            email: customer.email,
            cpfCnpj: customer.cpfCnpj,
            phone: customer.phone,
            postalCode: null, // Será preenchido pelo checkout do Asaas
            addressNumber: null // Será preenchido pelo checkout do Asaas
          };
          paymentData.remoteIp = req.ip;
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
          const errorData = await paymentResponse.text();
          console.error('Erro na resposta do Asaas:', errorData);
          throw new Error(`Erro ao criar pagamento no Asaas: ${errorData}`);
        }

        const payment = await paymentResponse.json();

        // Para cartão de crédito, gerar URL do checkout
        if (paymentMethod === 'CREDIT_CARD') {
          const checkoutResponse = await fetch(`${config.asaas.apiUrl}/payments/${payment.id}/checkout`, {
            headers: {
              'Content-Type': 'application/json',
              'access_token': config.asaas.apiKey
            }
          });

          if (!checkoutResponse.ok) {
            throw new Error('Erro ao gerar URL do checkout');
          }

          const checkoutData = await checkoutResponse.json();
          payment.invoiceUrl = checkoutData.url;
        }

        // Buscar dados adicionais do pagamento para obter as URLs
        const paymentDetailsResponse = await fetch(`${config.asaas.apiUrl}/payments/${payment.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'access_token': config.asaas.apiKey
          }
        });

        const paymentDetails = await paymentDetailsResponse.json();
        
        // Adicionar URLs de pagamento à resposta
        const paymentWithUrls = {
          ...payment,
          invoiceUrl: paymentDetails.invoiceUrl || null,
          bankSlipUrl: paymentDetails.bankSlipUrl || null,
          status: paymentDetails.status,
          pixQrCodeUrl: paymentDetails.pixQrCodeUrl || null,
          pixCopiaECola: paymentDetails.pixCopiaECola || null
        };

        // Salvar transação no Firestore
        const transactionRef = await admin.firestore().collection('transactions').add({
          customerId: customerData.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          courseId: courseId,
          paymentId: payment.id,
          amount: amount,
          status: payment.status,
          paymentMethod: paymentMethod,
          type: 'PAYMENT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentDetails: {
            ...paymentWithUrls,
            pixQrCodeUrl: paymentWithUrls.pixQrCodeUrl || null,
            pixCopiaECola: paymentWithUrls.pixCopiaECola || null,
            invoiceUrl: paymentWithUrls.invoiceUrl || null,
            bankSlipUrl: paymentWithUrls.bankSlipUrl || null
          }
        });

        // Se pagamento confirmado, criar registro de acesso ao curso
        if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
          await admin.firestore().collection('student_courses').add({
            customerId: customerData.id,
            customerEmail: customer.email,
            courseId: courseId,
            purchaseDate: new Date().toISOString(),
            paymentId: payment.id,
            transactionId: transactionRef.id,
            active: true
          });
        }

        res.status(200).json(paymentWithUrls);
      } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        res.status(500).json({
          error: 'Erro ao processar pagamento',
          details: error.message
        });
      }
    } catch (error) {
      console.error('Erro ao processar requisição:', error);
      res.status(500).json({
        error: 'Erro ao processar requisição',
        details: error.message
      });
    }
  });
});

// Webhook para receber notificações do Asaas
exports.asaasWebhook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { event, payment } = req.body;

      // Verificar assinatura do webhook
      const signature = req.headers['asaas-signature'];
      const webhookKey = process.env.ASAAS_WEBHOOK_KEY;

      if (webhookKey) {
        const calculatedSignature = crypto
          .createHmac('sha256', webhookKey)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (signature !== calculatedSignature) {
          return res.status(401).send('Assinatura inválida');
        }
      }

      // Atualizar ou criar transação no Firestore
      const transactionsRef = admin.firestore().collection('transactions');
      
      // Buscar transação existente pelo paymentId
      const existingTransactions = await transactionsRef
        .where('paymentId', '==', payment.id)
        .get();

      // Determinar o tipo de pagamento e buscar dados da assinatura se necessário
      let paymentType = 'PAYMENT';
      let subscriptionId = null;

      if (payment.subscription) {
        paymentType = 'SUBSCRIPTION';
        subscriptionId = payment.subscription;
      }

      if (!existingTransactions.empty) {
        // Atualizar transação existente
        const transactionDoc = existingTransactions.docs[0];
        await transactionDoc.ref.update({
          status: payment.status,
          updatedAt: new Date().toISOString(),
          paymentDetails: payment,
          type: paymentType,
          subscriptionId: subscriptionId
        });
      } else {
        // Buscar cliente para obter o email
        const customerResponse = await fetch(
          `${config.asaas.apiUrl}/customers/${payment.customer}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access_token': config.asaas.apiKey
            }
          }
        );

        if (!customerResponse.ok) {
          throw new Error('Erro ao buscar cliente');
        }

        const customer = await customerResponse.json();

        // Criar nova transação
        await transactionsRef.add({
          customerId: payment.customer,
          customerEmail: customer.email,
          paymentId: payment.id,
          status: payment.status,
          type: paymentType,
          subscriptionId: subscriptionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentDetails: payment
        });
      }

      // Se pagamento confirmado, atualizar acesso ao curso
      if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
        const courseId = payment.externalReference;
        if (courseId) {
          await admin.firestore().collection('student_courses').add({
            customerId: payment.customer,
            courseId: courseId,
            purchaseDate: new Date().toISOString(),
            paymentId: payment.id,
            active: true
          });
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  });
});

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

// Endpoint para salvar dados do cliente
exports.saveCustomerData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).send();
      return;
    }

    try {
      const { name, email, cpfCnpj, phone, courseId } = req.body;

      // Validar campos obrigatórios
      if (!name || !email || !cpfCnpj || !phone || !courseId) {
        return res.status(400).json({
          error: 'Dados incompletos. Todos os campos são obrigatórios.'
        });
      }

      // Salvar no Firestore
      const customerData = {
        name,
        email,
        cpfCnpj,
        phone,
        courseId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await admin.firestore()
        .collection('customer_data')
        .add(customerData);

      res.status(200).json({
        message: 'Dados do cliente salvos com sucesso',
        id: docRef.id
      });

    } catch (error) {
      console.error('Erro ao salvar dados do cliente:', error);
      res.status(500).json({
        error: 'Erro ao salvar dados do cliente',
        details: error.message
      });
    }
  });
});

// Função para criar assinatura
async function createSubscription(customer, courseData, cycle = 'MONTHLY', paymentMethod = 'BOLETO') {
  try { 
    // Primeiro, tentar buscar cliente existente por CPF
    const searchResponse = await fetch(
      `${config.asaas.apiUrl}/customers?cpfCnpj=${encodeURIComponent(customer.cpfCnpj.replace(/\D/g, ''))}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': config.asaas.apiKey
        }
      }
    );

    const searchText = await searchResponse.text();
    console.log('Resposta da busca de cliente:', searchText);

    let customerData;
    let searchResult;

    try {
      if (searchText) {
        searchResult = JSON.parse(searchText);
        console.log('Resultado da busca de cliente:', searchResult);
      }
    } catch (parseError) {
      console.error('Erro ao processar resposta da busca:', parseError);
    }

    if (searchResult && searchResult.data && searchResult.data.length > 0) {
      // Cliente já existe, usar o primeiro encontrado
      customerData = searchResult.data[0];
      console.log('Cliente existente encontrado:', customerData);
    } else {
      // Cliente não existe, criar novo
      console.log('Criando novo cliente...');
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
          notificationDisabled: false
        })
      });

      const customerResponseText = await customerResponse.text();

      if (!customerResponse.ok) {
        throw new Error(`Erro ao criar cliente no Asaas: ${customerResponseText}`);
      }

      customerData = JSON.parse(customerResponseText);
    }

    if (!customerData || !customerData.id) {
      throw new Error('Dados do cliente inválidos ou incompletos');
    }

    const subscriptionBody = {
      customer: customerData.id,
      billingType: paymentMethod,
      nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: courseData.price / 12,
      cycle: cycle,
      description: `Assinatura do curso: ${courseData.name}`,
      maxPayments: 12,
      updatePendingPayments: true
    };

    const subscriptionResponse = await fetch(`${config.asaas.apiUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.asaas.apiKey
      },
      body: JSON.stringify(subscriptionBody)
    });

    const subscriptionResponseText = await subscriptionResponse.text();
    console.log('Resposta da criação da assinatura:', subscriptionResponseText);

    if (!subscriptionResponse.ok) {
      throw new Error(`Erro ao criar assinatura: ${subscriptionResponseText}`);
    }

    return JSON.parse(subscriptionResponseText);
  } catch (error) {
    console.error('Erro detalhado na criação de assinatura:', error);
    throw error;
  }
}

// Endpoint para criar assinatura
exports.createSubscription = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
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
      const paymentsResponse = await fetch(`${config.asaas.apiUrl}/subscriptions/${subscriptionData.id}/payments`, {
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
        customerId: subscriptionData.customer,
        customerEmail: customer.email,
        asaasSubscriptionId: subscriptionData.id,
        value: courseData.price,
        cycle: cycle || 'MONTHLY',
        paymentMethod: paymentMethod,
        status: subscriptionData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscriptionDetails: subscriptionData
      });

      // Salvar o primeiro pagamento da assinatura
      await admin.firestore().collection('transactions').add({
        customerId: subscriptionData.customer,
        customerEmail: customer.email,
        courseId: courseId,
        paymentId: paymentData.id,
        amount: paymentData.value,
        status: paymentData.status,
        paymentMethod: paymentMethod,
        type: 'SUBSCRIPTION',
        subscriptionId: subscriptionData.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentDetails: paymentData
      });

      res.status(200).json({
        subscription: subscriptionData,
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
      res.status(500).json({
        error: 'Erro ao processar assinatura',
        details: error.message
      });
    }
  });
});

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

