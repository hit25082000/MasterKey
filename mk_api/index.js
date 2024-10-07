const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { Storage } = require('@google-cloud/storage');

admin.initializeApp();
const storage = new Storage();
const bucket = storage.bucket('master-key-a3c69.appspot.com');

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
            const fileName = `${userRecord.uid}_profile.jpg`;
            const file = bucket.file(fileName);

            // Decodificar a string base64 e salvar como buffer
            const imageBuffer = Buffer.from(iconFile.split(',')[1], 'base64');

            await file.save(imageBuffer, {
              metadata: {
                contentType: 'image/jpeg', // ou 'image/png' se for PNG
              },
            });

            // Tornar o arquivo público
            await file.makePublic();

            iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          }

          // Adicionar iconUrl aos dados do usuário
          const userDataWithIcon = {
            ...userData,
            iconUrl: iconUrl || null
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

          const userRecord = await admin.auth().updateUser(uid, updateData);

          // Fazer upload do ícone, se fornecido
          let iconUrl = null;
          if (iconFile) {
            const fileName = `${uid}_profile.jpg`;
            const file = bucket.file(fileName);

            // Decodificar a string base64 e salvar como buffer
            const imageBuffer = Buffer.from(iconFile.split(',')[1], 'base64');

            await file.save(imageBuffer, {
              metadata: {
                contentType: 'image/jpeg', // ou 'image/png' se for PNG
              },
            });

            // Tornar o arquivo público
            await file.makePublic();

            iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            // Atualizar o photoURL do usuário de autenticação
            await admin.auth().updateUser(uid, { photoURL: iconUrl });
          }

          // Atualizar dados do usuário no Firestore
          const userDataWithIcon = {
            ...userData,
            iconUrl: iconUrl || userRecord.photoURL
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

        // Inativar usuário no Firestore
        await admin.firestore().collection('users').doc(uid).update({
          isActive: false,
          inactivatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Desabilitar usuário de autenticação
        await admin.auth().updateUser(uid, { disabled: true });

        res.status(200).json({ message: 'Usuário inativado com sucesso.' });
      });
    } catch (error) {
      console.error('Erro ao inativar usuário:', error);
      res.status(500).json({ error: `Erro ao inativar usuário: ${error.message}` });
    }
  });
});
