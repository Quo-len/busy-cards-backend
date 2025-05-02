const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
//const { MongodbPersistence } = require('y-mongodb');
const { MongodbPersistence } = require('y-mongodb-provider');
const utils = require('y-websocket/bin/utils');
const mongoose = require('mongoose');
const db = require('./models');
const Mindmap = db.Mindmap;
const config = require('./config');

// MongoDB configuration
const db_login = config.db_login;
const db_pass = config.db_pass;
const db_uri = `mongodb+srv://${db_login}:${db_pass}@busycardsclaster.7wkb9.mongodb.net/?retryWrites=true&w=majority&appName=BusyCardsClaster`;

// Use the same connection string for both MongoDB connections

// y-mondodb-provider
const collection = 'yjs-transactions';
const persistence = new MongodbPersistence(db_uri, {
	collectionName: collection,
	flushSize: 100,
	multipleCollections: false,
});

// y-mongodb
// const collection = 'yjs-transactions';
// const persistence = new MongodbPersistence(db_uri, collection);

// Connect mongoose to MongoDB
async function connect() {
	try {
		await mongoose.connect(db_uri);
		console.log('Connected to MongoDB with mongoose');
	} catch (error) {
		console.log('Failed to connect to MongoDB with mongoose: ' + error);
	}
}

connect();

// Server configuration
const wsPort = config.ws_port;
const production = process.env.PRODUCTION != null;

// HTTP server
const server = http.createServer((request, response) => {
	if (request.method === 'POST') {
		let body = '';

		request.on('data', (chunk) => {
			body += chunk.toString();
		});

		request.on('end', () => {
			try {
				const jsonData = JSON.parse(body);
				console.log('Received JSON data:', JSON.stringify(jsonData, null, 2));
				response.writeHead(200, { 'Content-Type': 'application/json' });
				response.end(JSON.stringify({ status: 'success', message: 'Data received' }));
			} catch (error) {
				console.error('Error parsing JSON:', error);
				response.writeHead(400, { 'Content-Type': 'application/json' });
				response.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
			}
		});
	} else {
		response.writeHead(200, { 'Content-Type': 'text/plain' });
		response.end('okay');
	}
});

// Store docs by name for debugging purposes
const mindmapRooms = new Map();

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

// Extend the original setupWSConnection to handle custom messages
const originalSetupWSConnection = utils.setupWSConnection;
utils.setupWSConnection = (conn, req, { docName: roomName = req.url.slice(1).split('?')[0], gc = true } = {}) => {
	// Handle custom message types
	conn.on('message', (message) => {
		try {
			const data = JSON.parse(message.toString());
			if (data.type === 'print_state') {
				const doc = mindmapRooms.get(roomName);
				if (doc) {
					const nodesMap = doc.getMap('nodes');
					const edgesMap = doc.getMap('edges');

					console.log('\n===== Y.js DOCUMENT STATE FOR', roomName, '=====');
					console.log('NODES:', JSON.stringify(Array.from(nodesMap.entries()), null, 2));
					console.log('EDGES:', JSON.stringify(Array.from(edgesMap.entries()), null, 2));
					console.log('=========================================\n');

					// Send back a response to the client
					conn.send(
						JSON.stringify({
							type: 'state_info',
							message: 'Server received print_state request',
							nodeCount: nodesMap.size,
							edgeCount: edgesMap.size,
						})
					);
				} else {
					console.log('No document found with name:', roomName);
				}
			}
		} catch (err) {
			// Not a JSON message, likely a binary Y.js update
		}
	});

	originalSetupWSConnection(conn, req, { docName: roomName, gc });
};

wss.on('connection', utils.setupWSConnection);

server.on('upgrade', (request, socket, head) => {
	const handleAuth = (ws) => {
		wss.emit('connection', ws, request);
	};
	wss.handleUpgrade(request, socket, head, handleAuth);
});

utils.setPersistence({
	bindState: async (docName, ydoc) => {
		try {
			console.log(`\n===== BINDING Y.js DOCUMENT: ${docName} =====`);

			const persistedYdoc = await persistence.getYDoc(docName);
			const newUpdates = Y.encodeStateAsUpdate(ydoc);
			await persistence.storeUpdate(docName, newUpdates);
			Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

			const nodesMap = ydoc.getMap('nodes');
			const edgesMap = ydoc.getMap('edges');

			//	console.log('FINAL NODES:', JSON.stringify(Array.from(nodesMap.entries()), null, 2));
			//	console.log('FINAL EDGES:', JSON.stringify(Array.from(edgesMap.entries()), null, 2));

			const mindmapId = docName.startsWith('mindmap-') ? docName.substring(8) : null;

			ydoc.on('update', async (update, origin, doc) => {
				console.log(`\n===== DOCUMENT ${docName} UPDATED =====`);

				await persistence.storeUpdate(docName, update);

				// Update the database with the current state
				if (mindmapId) {
					updateMindmapInDatabase(mindmapId, nodesMap, edgesMap);
				}

				console.log('CURRENT NODES COUNT:', nodesMap.size);
				console.log('CURRENT EDGES COUNT:', edgesMap.size);
			});

			console.log(`===== BINDING COMPLETE FOR ${docName} =====\n`);
		} catch (error) {
			console.error('Error in bindState:', error);
		}
	},
	writeState: async (docName, ydoc) => {
		const nodesMap = ydoc.getMap('nodes');
		const edgesMap = ydoc.getMap('edges');

		const mindmapId = docName.startsWith('mindmap-') ? docName.substring(8) : null;

		if (mindmapId) {
			updateMindmapInDatabase(mindmapId, nodesMap, edgesMap);
		}

		mindmapRooms.delete(docName);

		return new Promise((resolve) => {
			resolve();
		});
	},
});

async function updateMindmapInDatabase(mindmapId, nodesMap, edgesMap) {
	try {
		const nodes = JSON.stringify(Object.fromEntries(nodesMap), null, 2);
		const edges = JSON.stringify(Object.fromEntries(edgesMap), null, 2);

		console.log(`Updating mindmap ${mindmapId} in database`);
		console.log(`Nodes count: ${nodesMap.size}, Edges count: ${edgesMap.size}`);

		const updatedMindmap = await Mindmap.findByIdAndUpdate(
			mindmapId,
			{
				nodes: nodes,
				edges: edges,
			},
			{ new: true, runValidators: false }
		);
		await updatedMindmap.save();

		console.log(`Mindmap ${mindmapId} updated successfully`);
	} catch (error) {
		console.error(`Error updating mindmap ${mindmapId}:`, error);
	}
}

// Start the server
server.listen(wsPort);
console.log(
	`Y.js WebSocket server with MongoDB persistence listening on port ${wsPort} ${production ? '(production)' : ''}`
);

async function initializeDocFromDatabase(mindmapId, ydoc) {
	try {
		console.log(`Initializing document for mindmap ${mindmapId} from database`);

		const mindmap = await Mindmap.findById(mindmapId);
		if (!mindmap) {
			console.log(`No mindmap found with ID: ${mindmapId}`);
			return;
		}

		const nodesMap = ydoc.getMap('nodes');
		const edgesMap = ydoc.getMap('edges');

		console.log(`Found mindmap with ${mindmap.nodes?.length || 0} nodes and ${mindmap.edges?.length || 0} edges`);

		// Only initialize if the maps are empty
		if (nodesMap.size === 0 && mindmap.nodes && mindmap.nodes.length > 0) {
			mindmap.nodes.forEach((node) => {
				if (node && node.id) {
					// Convert to plain object to remove Mongoose-specific properties
					const plainNode = JSON.parse(JSON.stringify(node));
					nodesMap.set(node.id, plainNode);
				}
			});
			console.log(`Populated ${nodesMap.size} nodes from database`);
		}

		if (edgesMap.size === 0 && mindmap.edges && mindmap.edges.length > 0) {
			mindmap.edges.forEach((edge) => {
				if (edge && edge.id) {
					// Convert to plain object to remove Mongoose-specific properties
					const plainEdge = JSON.parse(JSON.stringify(edge));
					edgesMap.set(edge.id, plainEdge);
				}
			});
			console.log(`Populated ${edgesMap.size} edges from database`);
		}

		console.log(`Initialized document for mindmap ${mindmapId} from database successfully`);
	} catch (error) {
		console.error(`Error initializing document for mindmap ${mindmapId}:`, error);
	}
}

const syncMindmapToDatabase = async (mindmapId, ydoc) => {
	try {
		// Get nodes and edges from the Yjs document
		const nodesMap = ydoc.getMap('nodes');
		const edgesMap = ydoc.getMap('edges');

		// Convert YJS maps to arrays properly
		const nodes = Array.from(nodesMap.entries()).map(([id, value]) => {
			// Ensure we're getting the correct structure
			const nodeData = typeof value === 'object' ? value : JSON.parse(value);
			return {
				id: nodeData.id || id,
				type: nodeData.type || 'custom',
				position: nodeData.position || { x: 0, y: 0 },
				data: nodeData.data || { label: 'Node' },
			};
		});

		const edges = Array.from(edgesMap.entries()).map(([id, value]) => {
			// Ensure we're getting the correct structure
			const edgeData = typeof value === 'object' ? value : JSON.parse(value);
			return {
				id: edgeData.id || id,
				source: edgeData.source,
				target: edgeData.target,
				type: edgeData.type || 'custom',
				sourceHandle: edgeData.sourceHandle,
				targetHandle: edgeData.targetHandle,
			};
		});

		console.log(`Syncing mindmap ${mindmapId}: ${nodes.length} nodes, ${edges.length} edges`);

		if (nodes.length === 0 && edges.length === 0) {
			console.log(`No nodes or edges to sync for mindmap ${mindmapId}`);
			return;
		}

		// Update the mindmap in the database
		const updatedMindmap = await Mindmap.findByIdAndUpdate(
			mindmapId,
			{
				nodes: nodes,
				edges: edges,
			},
			{ new: true, runValidators: false }
		);

		if (!updatedMindmap) {
			console.error(`Mindmap ${mindmapId} not found during sync`);
			return;
		}

		console.log(`Mindmap ${mindmapId} synchronized to database successfully`);
	} catch (error) {
		console.error(`Error syncing mindmap ${mindmapId}:`, error);
		console.error(error.stack);
	}
};

process.on('SIGINT', async () => {
	console.log('SIGINT received. Syncing mindmaps before shutdown...');

	const syncPromises = [];

	// Sync all active documents to database before shutting down
	mindmapRooms.forEach(({ doc, syncInterval }, mindmapId) => {
		clearInterval(syncInterval);
		syncPromises.push(syncMindmapToDatabase(mindmapId, doc));
	});

	try {
		await Promise.all(syncPromises);
		console.log('All mindmaps synced to database');

		// Close WebSocket server
		wss.close(() => {
			console.log('WebSocket server closed.');

			// Close database connection
			mongoose.connection.close(false, () => {
				console.log('MongoDB connection closed.');
				process.exit(0);
			});
		});
	} catch (err) {
		console.error('Error during final sync:', err);
		process.exit(1);
	}
});

/////////////////////////////
// app.get('/rooms/:roomName/content', (req, res) => {
// 	const { roomName } = req.params;
// 	const content = printRoomContent(roomName);

// 	if (content.error) {
// 		return res.status(404).json(content);
// 	}

// 	res.json(content);
// });

// app.post('/rooms/:roomName/gc', (req, res) => {
// 	const { roomName } = req.params;
// 	const doc = docs.get(roomName);

// 	if (!doc) {
// 		return res.status(404).json({ error: `Room ${roomName} not found` });
// 	}

// 	try {
// 		doc.gc();
// 		res.json({ success: true, message: `Garbage collection triggered for room ${roomName}` });
// 	} catch (error) {
// 		res.status(500).json({ error: `Failed to trigger garbage collection: ${error.message}` });
// 	}
// });
/////////////////////////////////////////////

// const http = require('http');
// const { Server } = require('socket.io');
// const mongoose = require('mongoose');
// const db = require('./models');
// const Mindmap = db.Mindmap;
// const config = require('./config');
// const fs = require('fs');

// // MongoDB configuration
// const db_login = config.db_login;
// const db_pass = config.db_pass;
// const db_uri = `mongodb+srv://${db_login}:${db_pass}@busycardsclaster.7wkb9.mongodb.net/?retryWrites=true&w=majority&appName=BusyCardsClaster`;

// // Server configuration
// const port = config.ws_port;
// const production = process.env.PRODUCTION != null;

// // Connect mongoose to MongoDB
// async function connect() {
// 	try {
// 		await mongoose.connect(db_uri);
// 		console.log('Connected to MongoDB with mongoose');
// 	} catch (error) {
// 		console.log('Failed to connect to MongoDB with mongoose: ' + error);
// 	}
// }

// connect();

// // Track active mindmaps and their clients
// const activeMindmaps = new Map();

// // HTTP server
// const server = http.createServer((request, response) => {
// 	if (request.method === 'POST') {
// 		let body = '';

// 		request.on('data', (chunk) => {
// 			body += chunk.toString();
// 		});

// 		request.on('end', () => {
// 			try {
// 				const jsonData = JSON.parse(body);
// 				console.log('Received JSON data:', JSON.stringify(jsonData, null, 2));
// 				response.writeHead(200, { 'Content-Type': 'application/json' });
// 				response.end(JSON.stringify({ status: 'success', message: 'Data received' }));
// 			} catch (error) {
// 				console.error('Error parsing JSON:', error);
// 				response.writeHead(400, { 'Content-Type': 'application/json' });
// 				response.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
// 			}
// 		});
// 	} else {
// 		response.writeHead(200, { 'Content-Type': 'text/plain' });
// 		response.end('okay');
// 	}
// });

// // Create Socket.IO server
// const io = new Server(server, {
// 	cors: {
// 		origin: '*',
// 		methods: ['GET', 'POST'],
// 	},
// });

// // Load mindmap from database or initialize new one
// async function loadMindmap(mindmapId) {
// 	try {
// 		console.log(`Loading mindmap ${mindmapId} from database`);

// 		const mindmap = await Mindmap.findById(mindmapId);
// 		if (!mindmap) {
// 			console.log(`No mindmap found with ID: ${mindmapId}`);
// 			return { nodes: {}, edges: {} };
// 		}

// 		const nodes = mindmap.nodes ? JSON.parse(mindmap.nodes) : {};
// 		const edges = mindmap.edges ? JSON.parse(mindmap.edges) : {};

// 		console.log(`Loaded mindmap with ${Object.keys(nodes).length} nodes and ${Object.keys(edges).length} edges`);
// 		return { nodes, edges };
// 	} catch (error) {
// 		console.error(`Error loading mindmap ${mindmapId}:`, error);
// 		return { nodes: {}, edges: {} };
// 	}
// }

// // Save mindmap state to database
// async function saveMindmapToDatabase(mindmapId, nodes, edges) {
// 	try {
// 		const nodesJson = JSON.stringify(nodes, null, 2);
// 		const edgesJson = JSON.stringify(edges, null, 2);

// 		console.log(`Saving mindmap ${mindmapId} to database`);
// 		console.log(`Nodes count: ${Object.keys(nodes).length}, Edges count: ${Object.keys(edges).length}`);

// 		// For debugging: save to files
// 		fs.writeFile('./canvas/nodes.txt', nodesJson, (err) => {
// 			if (err) console.error(err);
// 		});

// 		fs.writeFile('./canvas/edges.txt', edgesJson, (err) => {
// 			if (err) console.error(err);
// 		});

// 		const updatedMindmap = await Mindmap.findByIdAndUpdate(
// 			mindmapId,
// 			{
// 				nodes: nodesJson,
// 				edges: edgesJson,
// 			},
// 			{ new: true, runValidators: false }
// 		);

// 		await updatedMindmap.save();
// 		console.log(`Mindmap ${mindmapId} saved successfully`);
// 	} catch (error) {
// 		console.error(`Error saving mindmap ${mindmapId}:`, error);
// 	}
// }

// // Socket.IO connection handler
// io.on('connection', async (socket) => {
// 	console.log(`Client connected: ${socket.id}`);

// 	// Handle joining a mindmap room
// 	socket.on('join-mindmap', async ({ mindmapId }) => {
// 		const roomName = `mindmap-${mindmapId}`;

// 		// Join the socket to the room
// 		socket.join(roomName);
// 		console.log(`Client ${socket.id} joined ${roomName}`);

// 		// Initialize or get existing mindmap data
// 		if (!activeMindmaps.has(roomName)) {
// 			const { nodes, edges } = await loadMindmap(mindmapId);
// 			activeMindmaps.set(roomName, {
// 				nodes,
// 				edges,
// 				clients: new Set(),
// 				lastActivity: Date.now(),
// 				saveInterval: setInterval(() => {
// 					const data = activeMindmaps.get(roomName);
// 					if (data) {
// 						saveMindmapToDatabase(mindmapId, data.nodes, data.edges);
// 					}
// 				}, 30000), // Save every 30 seconds
// 			});
// 		}

// 		const mindmapData = activeMindmaps.get(roomName);
// 		mindmapData.clients.add(socket.id);

// 		// Send initial state to the client
// 		socket.emit('init-state', {
// 			nodes: mindmapData.nodes,
// 			edges: mindmapData.edges,
// 		});

// 		console.log(
// 			`Sent initial state to client ${socket.id} with ${Object.keys(mindmapData.nodes).length} nodes and ${
// 				Object.keys(mindmapData.edges).length
// 			} edges`
// 		);
// 	});

// 	// Handle node updates
// 	socket.on('node-update', ({ mindmapId, node, action }) => {
// 		const roomName = `mindmap-${mindmapId}`;
// 		const mindmapData = activeMindmaps.get(roomName);

// 		if (!mindmapData) return;

// 		console.log(`${action} node ${node.id} in ${roomName}`);

// 		// Update local state based on action
// 		if (action === 'add' || action === 'update') {
// 			mindmapData.nodes[node.id] = node;
// 		} else if (action === 'delete') {
// 			delete mindmapData.nodes[node.id];
// 		}

// 		mindmapData.lastActivity = Date.now();

// 		// Broadcast to all clients in room except sender
// 		socket.to(roomName).emit('node-updated', { node, action });
// 	});

// 	// Handle edge updates
// 	socket.on('edge-update', ({ mindmapId, edge, action }) => {
// 		const roomName = `mindmap-${mindmapId}`;
// 		const mindmapData = activeMindmaps.get(roomName);

// 		if (!mindmapData) return;

// 		console.log(`${action} edge ${edge.id} in ${roomName}`);

// 		// Update local state based on action
// 		if (action === 'add' || action === 'update') {
// 			mindmapData.edges[edge.id] = edge;
// 		} else if (action === 'delete') {
// 			delete mindmapData.edges[edge.id];
// 		}

// 		mindmapData.lastActivity = Date.now();

// 		// Broadcast to all clients in room except sender
// 		socket.to(roomName).emit('edge-updated', { edge, action });
// 	});

// 	// Handle debug/state requests
// 	socket.on('request-state', ({ mindmapId }) => {
// 		const roomName = `mindmap-${mindmapId}`;
// 		const mindmapData = activeMindmaps.get(roomName);

// 		if (mindmapData) {
// 			socket.emit('state-info', {
// 				nodeCount: Object.keys(mindmapData.nodes).length,
// 				edgeCount: Object.keys(mindmapData.edges).length,
// 				clientCount: mindmapData.clients.size,
// 			});

// 			console.log(`State requested for ${roomName}:`, {
// 				nodeCount: Object.keys(mindmapData.nodes).length,
// 				edgeCount: Object.keys(mindmapData.edges).length,
// 				clientCount: mindmapData.clients.size,
// 			});
// 		}
// 	});

// 	// Handle forced sync requests
// 	socket.on('force-sync', async ({ mindmapId }) => {
// 		const roomName = `mindmap-${mindmapId}`;
// 		const mindmapData = activeMindmaps.get(roomName);

// 		if (mindmapData) {
// 			// Save to database
// 			await saveMindmapToDatabase(mindmapId, mindmapData.nodes, mindmapData.edges);

// 			// Notify client
// 			socket.emit('sync-complete', {
// 				success: true,
// 				message: 'Mindmap synchronized to database',
// 				timestamp: new Date(),
// 			});
// 		}
// 	});

// 	// Handle client disconnect
// 	socket.on('disconnect', () => {
// 		console.log(`Client disconnected: ${socket.id}`);

// 		// Find and remove client from any mindmap rooms
// 		for (const [roomName, data] of activeMindmaps.entries()) {
// 			if (data.clients.has(socket.id)) {
// 				data.clients.delete(socket.id);
// 				console.log(`Removed client ${socket.id} from ${roomName}. ${data.clients.size} clients remaining.`);

// 				// If no clients left, schedule cleanup
// 				if (data.clients.size === 0) {
// 					const mindmapId = roomName.substring(8); // Remove 'mindmap-' prefix
// 					console.log(`No clients remaining in ${roomName}, scheduling cleanup`);

// 					// Schedule cleanup after 2 minutes of inactivity
// 					setTimeout(() => {
// 						const currentData = activeMindmaps.get(roomName);
// 						if (currentData && currentData.clients.size === 0) {
// 							// Final save before cleanup
// 							saveMindmapToDatabase(mindmapId, currentData.nodes, currentData.edges);

// 							// Clean up resources
// 							clearInterval(currentData.saveInterval);
// 							activeMindmaps.delete(roomName);
// 							console.log(`Cleaned up inactive mindmap ${roomName}`);
// 						}
// 					}, 120000); // 2 minutes
// 				}
// 			}
// 		}
// 	});
// });

// // Start the server
// server.listen(port, () => {
// 	console.log(`Socket.IO server listening on port ${port} ${production ? '(production)' : ''}`);
// });

// // Graceful shutdown handler
// process.on('SIGINT', async () => {
// 	console.log('SIGINT received. Syncing mindmaps before shutdown...');

// 	const savePromises = [];

// 	// Save all active mindmaps to database
// 	for (const [roomName, data] of activeMindmaps.entries()) {
// 		const mindmapId = roomName.substring(8); // Remove 'mindmap-' prefix
// 		savePromises.push(saveMindmapToDatabase(mindmapId, data.nodes, data.edges));
// 		clearInterval(data.saveInterval);
// 	}

// 	try {
// 		await Promise.all(savePromises);
// 		console.log('All mindmaps synced to database');

// 		// Close server and database connection
// 		io.close(() => {
// 			console.log('Socket.IO server closed.');

// 			mongoose.connection.close(false, () => {
// 				console.log('MongoDB connection closed.');
// 				process.exit(0);
// 			});
// 		});
// 	} catch (err) {
// 		console.error('Error during final sync:', err);
// 		process.exit(1);
// 	}
// });
