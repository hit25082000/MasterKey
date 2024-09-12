const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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
