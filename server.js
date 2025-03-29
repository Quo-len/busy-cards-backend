require("dotenv").config();
const config = require("./config");
const routes = require("./routes");
const cors = require("cors");
const express = require("express");
const { WebSocketServer } = require("ws");
const Y = require("yjs");
const setupWSConnection = require("y-websocket/bin/utils").setupWSConnection;

const mongoose = require('mongoose');
const db_uri = `mongodb+srv://busy-admin:${process.env.DBPASS}@busycardsclaster.7wkb9.mongodb.net/?retryWrites=true&w=majority&appName=BusyCardsClaster`;

async function connect() {
    try {
        await mongoose.connect(db_uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Failed to connect to MongoDB: ' + error)
    }
}

connect();

const app = express();
const host = config.ip;
const port = config.port;
const wsPort = process.env.WS_PORT;

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your React app's URLs
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const wss = new WebSocketServer({ host, port: wsPort });

wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    setupWSConnection(ws, req);

    ws.on('close', () => {
        console.log(`WebSocket connection closed`);
    });
});




app.use(express.json());
app.use(routes);

app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log(`WebSocket server running on ws://${host}:${wsPort}`);
});

app.get("/", (req, res) => {
    res.json({ message: "Server is running!", status: "ok" });
});