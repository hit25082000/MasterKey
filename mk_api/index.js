const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: ['http://localhost:4200', 'https://master-key-a3c69.web.app'],
  credentials: true
});
const { Storage } = require('@google-cloud/storage');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const config = require('./config');

admin.initializeApp();
const storage = new Storage();
const bucket = storage.bucket('master-key-a3c69.appspot.com');

// Configuração do Mercado Pago usando a nova sintaxe
const client = new MercadoPagoConfig({
  accessToken: config.mercadoPago.accessToken
});

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
                contentType: 'image/png', // ou 'image/png' se for PNG
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
          throw authError; // Lança o erro para ser capturado pelo catch externo
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
          let iconUrl = currentUserData.data()?.profilePic || null; // Mantém o URL atual se não houver novo ícone
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
            updateData.profilePic = iconUrl; // Adicionar photoURL ao updateData
          }

          // Atualizar usuário de autenticação com todos os dados
          const userRecord = await admin.auth().updateUser(uid, updateData);

          // Atualizar dados do usuário no Firestore
          const userDataWithIcon = {
            ...userData,
            profilePic: iconUrl // Usar o iconUrl atualizado ou o existente
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
            email: originalEmail // Retornar o email original para confirmação
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

// Função para criar preferência de pagamento
exports.createPaymentPreference = functions.https.onRequest((req, res) => {
  res.set({
    'Access-Control-Allow-Origin': 'http://localhost:4200',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  });

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  cors(req, res, async () => {
    try {
      const { title, price, quantity, courseId, description, picture_url, test_mode } = req.body;

      if (!title || !price || !courseId) {
        return res.status(400).json({
          error: 'Dados incompletos para criar preferência de pagamento'
        });
      }

      const preference = {
        items: [
          {
            id: courseId,
            title,
            description: description || title,
            picture_url: picture_url || '',
            unit_price: Number(price),
            quantity: Number(quantity) || 1,
            currency_id: 'BRL'
          }
        ],
        back_urls: {
          success: `${config.frontend.url}/payment/success`,
          failure: `${config.frontend.url}/payment/failure`,
          pending: `${config.frontend.url}/payment/pending`
        },
        auto_return: 'approved',
        external_reference: courseId,
        notification_url: `${config.functions.url}/paymentWebhook`,
        statement_descriptor: 'MASTERKEY',
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        },
        binary_mode: true, // Aceita apenas pagamentos aprovados ou rejeitados
        expires: true,
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        marketplace: 'MASTERKEY',
        marketplace_fee: 0 // Sem taxa de marketplace
      };

      try {
        const preferenceClient = new Preference(client);
        const response = await preferenceClient.create({ body: preference });
        console.log('Preferência criada:', response);

        // Se estiver em modo de teste, use sandbox_init_point
        const redirectUrl = test_mode ? response.sandbox_init_point : response.init_point;

        res.status(200).json({
          id: response.id,
          init_point: response.init_point,
          sandbox_init_point: response.sandbox_init_point,
          redirect_url: redirectUrl
        });
      } catch (mpError) {
        console.error('Erro Mercado Pago:', mpError);
        res.status(500).json({
          error: 'Erro ao criar preferência de pagamento',
          details: mpError.message
        });
      }
    } catch (error) {
      console.error('Erro geral:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  });
});

// Webhook para receber notificações do Mercado Pago
exports.paymentWebhook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { type, data } = req.body;

      if (type === 'payment') {
        const paymentId = data.id;
        const { Payment } = require('mercadopago');
        const paymentClient = new Payment(client);

        // Buscar informações do pagamento
        const payment = await paymentClient.get({ id: paymentId });
        const preferenceId = payment.preference_id;

        // Atualizar status da transação no Firestore
        const transactionQuery = await admin.firestore()
          .collection('transactions')
          .where('preferenceId', '==', preferenceId)
          .limit(1)
          .get();

        if (!transactionQuery.empty) {
          const transactionDoc = transactionQuery.docs[0];
          await transactionDoc.ref.update({
            status: payment.status,
            paymentId: paymentId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentDetails: payment
          });

          // Se o pagamento foi aprovado, liberar acesso ao curso
          if (payment.status === 'approved') {
            const transaction = transactionDoc.data();
            await admin.firestore().collection('userCourses').add({
              userId: transaction.userId,
              courseId: transaction.courseId,
              purchaseDate: admin.firestore.FieldValue.serverTimestamp(),
              transactionId: transactionDoc.id
            });
          }
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  });
});

// Função para verificar status do pagamento
exports.checkPaymentStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { transactionId } = req.query;

        if (!transactionId) {
          return res.status(400).json({
            error: 'ID da transação não fornecido'
          });
        }

        const transactionDoc = await admin.firestore()
          .collection('transactions')
          .doc(transactionId)
          .get();

        if (!transactionDoc.exists) {
          return res.status(404).json({
            error: 'Transação não encontrada'
          });
        }

        const transaction = transactionDoc.data();

        // Verificar se o usuário tem permissão para ver esta transação
        if (transaction.userId !== req.user.uid) {
          return res.status(403).json({
            error: 'Não autorizado'
          });
        }

        res.status(200).json({
          status: transaction.status,
          paymentDetails: transaction.paymentDetails || null
        });
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      res.status(500).json({
        error: 'Erro ao verificar status do pagamento'
      });
    }
  });
});
