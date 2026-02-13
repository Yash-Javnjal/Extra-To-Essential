const admin = require('firebase-admin');

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
  throw new Error('Missing Firebase environment variables. Check .env file.');
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});

const messaging = admin.messaging();

module.exports = {
  admin,
  messaging
};