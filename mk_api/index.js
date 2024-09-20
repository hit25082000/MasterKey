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

exports.createUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { email, password, displayName, phoneNumber, photoURL } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName,
          phoneNumber,
          photoURL
        });
        res.status(201).json(userRecord);
      });
    } catch (error) {
      res.status(500).json({ error: `Erro ao criar novo usuário: ${error.message}` });
    }
  });
});

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

exports.deleteUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { uid } = req.body;

        if (!uid) {
          return res.status(400).json({ error: 'UID do usuário é obrigatório.' });
        }

        await admin.auth().deleteUser(uid);
        res.status(200).json({ message: 'Usuário deletado com sucesso.' });
      });
    } catch (error) {
      res.status(500).json({ error: `Erro ao deletar usuário: ${error.message}` });
    }
  });
});

exports.updateUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      await authenticateRequest(req, res, async () => {
        const { uid, email, password, displayName } = req.body;

        if (!uid) {
          return res.status(400).json({ error: 'UID do usuário é obrigatório.' });
        }

        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (displayName) updateData.displayName = displayName;

        const userRecord = await admin.auth().updateUser(uid, updateData);

        res.status(200).json(userRecord);
      });
    } catch (error) {
      res.status(500).json({ error: `Erro ao atualizar usuário: ${error.message}` });
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

        // Criar usuário de autenticação
        const userRecord = await admin.auth().createUser({
          email,
          password,
        });

        // Salvar dados do usuário no Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

        // Fazer upload do ícone, se fornecido
        let iconUrl = null;
        if (iconFile) {
          const fileName = `${userRecord.uid}_profile.jpg`;
          const file = bucket.file(fileName);
          await file.save(Buffer.from(iconFile, 'base64'));
          iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          // Atualizar o photoURL do usuário
          await admin.auth().updateUser(userRecord.uid, { photoURL: iconUrl });
        }

        res.status(201).json({ ...userRecord, iconUrl });
      });
    } catch (error) {
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

        // Atualizar usuário de autenticação
        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const userRecord = await admin.auth().updateUser(uid, updateData);

        // Atualizar dados do usuário no Firestore
        if (userData) {
          await admin.firestore().collection('users').doc(uid).update(userData);
        }

        // Atualizar ícone, se fornecido
        let iconUrl = null;
        if (iconFile) {
          const fileName = `${uid}_profile.jpg`;
          const file = bucket.file(fileName);
          await file.save(Buffer.from(iconFile, 'base64'));
          iconUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          // Atualizar o photoURL do usuário
          await admin.auth().updateUser(uid, { photoURL: iconUrl });
        }

        res.status(200).json({ ...userRecord, iconUrl });
      });
    } catch (error) {
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

        // Deletar usuário de autenticação
        await admin.auth().deleteUser(uid);

        // Deletar dados do usuário no Firestore
        await admin.firestore().collection('users').doc(uid).delete();

        // Deletar ícone do usuário
        const fileName = `${uid}_profile.jpg`;
        await bucket.file(fileName).delete().catch(() => { });

        res.status(200).json({ message: 'Usuário deletado com sucesso.' });
      });
    } catch (error) {
      res.status(500).json({ error: `Erro ao deletar usuário: ${error.message}` });
    }
  });
});
