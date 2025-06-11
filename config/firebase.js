const admin = require('firebase-admin');

let serviceAccount
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized and connected.');
    const db = admin.firestore();
    const auth = admin.auth();
    module.exports = {db, admin, auth}
} 
    catch (err) {
    console.error('Could not parse the service key from your env file! Error: ', err);
    process.exit(1);
}


