const admin = require('firebase-admin');
const db = admin.firestore();
const auth = admin.auth();

let serviceAccount
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} 
    catch (err) {
    console.error('Could not parse the service key from your env file! Error: ', err);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin SDK initialized and connected.');

module.exports = {db, admin, auth}