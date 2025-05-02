const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const routes = require('./routes');

require('./webSocket');
require('./database');

const port = config.port;
const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
	cors({
		origin: ['http://localhost:5173', 'http://localhost:3000'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);
app.use(express.json());
app.use(routes);

app.get('/', (req, res) => {
	res.json({ message: 'Server is running!', status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
	console.log(`Server running on port ${port}`);
});

// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');

// const app = express();
// app.use(cors());

// const server = http.createServer(app);
// const io = new Server(server, {
// 	cors: {
// 		// Update to allow your frontend origin
// 		origin: ['http://localhost:3000', 'http://localhost:5173'],
// 		methods: ['GET', 'POST'],
// 		credentials: true,
// 	},
// });

// // Store flow state
// let flowState = {
// 	nodes: [],
// 	edges: [],
// };

// // Store connected users
// let connectedUsers = [];

// io.on('connection', (socket) => {
// 	console.log(`User connected: ${socket.id}`);

// 	// Send initial state to new connections
// 	socket.emit('initialState', flowState);

// 	// Handle user login
// 	socket.on('userLogin', (username) => {
// 		// Add user to connected users
// 		const userInfo = {
// 			id: socket.id,
// 			name: username,
// 		};
// 		connectedUsers.push(userInfo);

// 		// Update user list for all clients
// 		io.emit(
// 			'usersUpdate',
// 			connectedUsers.map((user) => user.name)
// 		);
// 		console.log(`User logged in: ${username}`);
// 	});

// 	// Handle nodes update
// 	socket.on('updateNodes', (updatedNodes) => {
// 		flowState.nodes = updatedNodes;
// 		// Broadcast to all other clients
// 		console.log(updatedNodes.length);
// 		socket.broadcast.emit('nodesUpdate', updatedNodes);
// 	});

// 	// Handle edges update
// 	socket.on('updateEdges', (updatedEdges) => {
// 		flowState.edges = updatedEdges;
// 		// Broadcast to all other clients
// 		socket.broadcast.emit('edgesUpdate', updatedEdges);
// 	});

// 	// Handle disconnect
// 	socket.on('disconnect', () => {
// 		console.log(`User disconnected: ${socket.id}`);
// 		// Remove user from connected users
// 		connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
// 		// Update user list for all clients
// 		io.emit(
// 			'usersUpdate',
// 			connectedUsers.map((user) => user.name)
// 		);
// 	});
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
// 	console.log(`Server running on port ${PORT}`);
// });
