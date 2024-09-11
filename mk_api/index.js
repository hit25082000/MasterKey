const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Inicializa o app Firebase Admin
admin.initializeApp();

// Middleware para verificar autenticação
async function authenticateRequest(req, res, next) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided.');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).send('Forbidden: Invalid or expired token.');
  }
}

// Função para criar um usuário
exports.createUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    await authenticateRequest(req, res, async () => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).send('Email and password are required.');
      }

      try {
        const userRecord = await admin.auth().createUser({
          email: email,
          password: password,
        });
        return res.status(201).json(userRecord);
      } catch (error) {
        return res.status(500).send(`Error creating new user: ${error.message}`);
      }
    });
  });
});

// Função para obter a lista de usuários
exports.getUsers = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    await authenticateRequest(req, res, async () => {
      try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users.map(userRecord => ({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        }));
        return res.status(200).json(users);
      } catch (error) {
        return res.status(500).send(`Error fetching users: ${error.message}`);
      }
    });
  });
});

// Função para deletar um usuário
exports.deleteUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    await authenticateRequest(req, res, async () => {
      const { uid } = req.body;

      if (!uid) {
        return res.status(400).send('User UID is required.');
      }

      try {
        await admin.auth().deleteUser(uid);
        return res.status(200).send('User deleted successfully.');
      } catch (error) {
        return res.status(500).send(`Error deleting user: ${error.message}`);
      }
    });
  });
});

// Função para atualizar um usuário
exports.updateUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    await authenticateRequest(req, res, async () => {
      const { uid, email, password, displayName } = req.body;

      if (!uid) {
        return res.status(400).send('User UID is required.');
      }

      try {
        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (displayName) updateData.displayName = displayName;

        const userRecord = await admin.auth().updateUser(uid, updateData);
        return res.status(200).json(userRecord);
      } catch (error) {
        return res.status(500).send(`Error updating user: ${error.message}`);
      }
    });
  });
});
