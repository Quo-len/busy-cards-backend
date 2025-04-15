const config = require('./config');

const Y = require('yjs');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;
const { WebSocketServer } = require('ws');

const host = config.ip;
const wsPort = config.ws_port;

// Websocket config
const wss = new WebSocketServer({ host, port: wsPort });

wss.on('connection', (ws, req) => {
	console.log('New WebSocket connection');

	ws.on('message', (message) => {
		try {
			// If you want to handle custom messages beyond Y.js protocol
			// const data = JSON.parse(message);
			// Process custom message logic here
		} catch (e) {
			// Y.js messages will be handled by setupWSConnection
		}
	});

	ws.on('error', (error) => {
		console.error('WebSocket error', error);
	});

	setupWSConnection(ws, req);

	ws.on('close', () => {
		console.log(`WebSocket connection closed`);
	});
});

// Graceful shutdown handling
process.on('SIGINT', () => {
	console.log('SIGINT received. Shutting down gracefully...');
	server.close(() => {
		wss.close(() => {
			console.log('WebSocket server closed.');
			mongoose.connection.close(false, () => {
				console.log('MongoDB connection closed.');
				process.exit(0);
			});
		});
	});
});

// // Store active rooms
// const rooms = new Map();

// wss.on('connection', (ws, req) => {
// 	// Extract room ID from the URL
// 	const roomId = req.url.slice(1);

// 	// Initialize room if it doesn't exist
// 	if (!rooms.has(roomId)) {
// 		rooms.set(roomId, {
// 			doc: new Y.Doc(),
// 			clients: new Set(),
// 		});
// 	}

// 	const room = rooms.get(roomId);
// 	room.clients.add(ws);

// 	console.log(`Client connected to room: ${roomId}`);
// 	console.log(`Room ${roomId} now has ${room.clients.size} clients`);

// 	// Sync protocol message handler
// 	ws.on('message', (message) => {
// 		// Broadcast message to all clients in the room except the sender
// 		room.clients.forEach((client) => {
// 			if (client !== ws && client.readyState === WebSocket.OPEN) {
// 				client.send(message);
// 			}
// 		});
// 	});

// 	// Handle client disconnection
// 	ws.on('close', () => {
// 		room.clients.delete(ws);
// 		console.log(`Client disconnected from room: ${roomId}`);
// 		console.log(`Room ${roomId} now has ${room.clients.size} clients`);

// 		// Clean up room if no more clients
// 		if (room.clients.size === 0) {
// 			rooms.delete(roomId);
// 			console.log(`Room ${roomId} deleted`);
// 		}
// 	});
// });

module.exports = wss;
