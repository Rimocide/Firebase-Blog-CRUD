require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');


// Created modules
const firebase = require('./config/firebase');
const registerRouter = require('./routes/auth');


//Initialize express, socket and httpServer (for socket)
const app = express();
const httpServer = http.createServer(app);
const io = new Server (httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

const frontendFirebaseConfig = {
    apiKey: process.env.FRONTEND_FIREBASE_API_KEY,
    authDomain: process.env.FRONTEND_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FRONTEND_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FRONTEND_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FRONTEND_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FRONTEND_FIREBASE_APP_ID,
};

// Socket debugging logs
io.on('connection', (socket) => {
    console.log("User connected with socket ID: ", socket.id);
    socket.on('disconnect', () => {
        console.log(`Socket.IO: User disconnected: ${socket.id}`);
    });
});


// Middleware setup

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, './public')));

app.get('/api/firebase-client-config', (req, res) => {
    res.status(200).json(frontendFirebaseConfig);
});

//Register users route
app.use('/api/auth', registerRouter);


// Global Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        error: 'An unexpected server error occurred.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


async function startServer() {
    httpServer.listen(PORT, () => {
        console.log(`Server and Socket.IO running on http://localhost:${PORT}`);
        console.log(`Firebase Admin SDK initialized.`);
        console.log(`Static files served from: ${path.join(__dirname, 'public')}`);
        console.log('Backend ready for modular routes!');
    });
}

startServer();