const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:4200',
      'https://seu-dominio.com',
      'https://master-key-a3c69.web.app'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  }
});
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
    return res.status(403).json({ error: error.message });
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
      await authenticateRequest(req);

      const { email, password, userData, iconFile } = req.body;

      if (!email || !password || !userData) {
        return res.status(400).json({ message: 'Dados incompletos.' });
      }

      try {
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: userData.name,
          disabled: false
        });

        // Fazer upload do ícone, se fornecido
        let iconUrl = null;
        if (iconFile) {
          // Adiciona timestamp ao nome do arquivo
          const timestamp = Date.now();
          const fileName = `profiles/${userRecord.uid}_${timestamp}_profile.png`;
          const file = bucket.file(fileName);

          const imageBuffer = Buffer.from(iconFile.split(',')[1], 'base64');
          await file.save(imageBuffer, {
            metadata: {
              contentType: 'image/png',
              cacheControl: 'no-cache, no-store, must-revalidate' // Previne cache
            }
          });

          await file.makePublic();
          // Adiciona parâmetro de versão na URL
          iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}?v=${timestamp}`;
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
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ message: `Erro ao criar usuário: ${error.message}` });
    }
  });
});

exports.updateUserWithProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req);

      const { uid, userData, iconFile } = req.body;

      if (!uid) {
        return res.status(400).json({ message: 'UID do usuário é obrigatório.' });
      }

      try {
        let iconUrl = userData.profilePic;

        if (iconFile) {
          // Adiciona timestamp ao nome do arquivo
          const timestamp = Date.now();
          const fileName = `profiles/${uid}_${timestamp}_profile.png`;
          const file = bucket.file(fileName);

          const imageBuffer = Buffer.from(iconFile.split(',')[1], 'base64');
          await file.save(imageBuffer, {
            metadata: {
              contentType: 'image/png',
              cacheControl: 'no-cache, no-store, must-revalidate' // Previne cache
            }
          });

          await file.makePublic();
          // Adiciona parâmetro de versão na URL
          iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}?v=${timestamp}`;

          // Tenta deletar a imagem antiga se existir
          if (userData.profilePic) {
            try {
              const oldFileName = userData.profilePic.split('/').pop().split('?')[0];
              const oldFile = bucket.file(`profiles/${oldFileName}`);
              await oldFile.delete().catch(() => {}); // Ignora erro se arquivo não existir
            } catch (error) {
              console.log('Erro ao deletar imagem antiga:', error);
            }
          }
        }

        // Atualizar usuário de autenticação com todos os dados
        const updateData = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.password) updateData.password = userData.password;

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
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ message: `Erro ao atualizar usuário: ${error.message}` });
    }
  });
});

exports.deleteUserWithProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { uid } = req.body;

        if (!uid) {
          return res.status(400).json({ message: 'UID do usuário é obrigatório.' });
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
      res.status(500).json({ message: `Erro ao inativar usuário: ${error.message}` });
    }
  });
});
