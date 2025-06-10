require('dotenv').config();
const app = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
// Created modules
const firebase = require('./config/firebase');

const app = express();
const httpServer = http.createServer(app);
const io = new Server ({
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

