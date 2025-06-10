const app = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');


// Created modules
const firebase = require('./config/firebase');
require('dotenv').config();

//Initialize express, socket and httpServer (for socket)
const app = express();
const httpServer = http.createServer(app);
const io = new Server ({
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

const PORT = process.env.PORT;

// Socket debugging logs
io.on('connection', (socket) => {
    console.log("User connected with socket ID: ", socket.id);
    socket.on('disconnect', () => {
        console.log(`Socket.IO: User disconnected: ${socket.id}`);
    });
});


// Middleware setup
app.use(express.json);
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, './public')));


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