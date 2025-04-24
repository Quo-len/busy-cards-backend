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

	// Call the original connection setup
	originalSetupWSConnection(conn, req, { docName: roomName, gc });
};

// add here users handle
wss.on('connection', utils.setupWSConnection);

// ws.on('close', () => {
// 	if (mindmapDocs.has(mindmapId)) {
// 		const roomData = mindmapDocs.get(mindmapId);
// 		roomData.clients.delete(ws);
// 		roomData.lastActivity = Date.now();

// 		console.log(`Client disconnected. ${roomData.clients.size} clients remaining for mindmap ${mindmapId}`);

// 		// If no clients left, schedule cleanup
// 		if (roomData.clients.size === 0) {
// 			console.log(`Last client disconnected from mindmap ${mindmapId}, scheduling cleanup`);

// 			// Final sync before potential cleanup
// 			syncMindmapToDatabase(mindmapId, roomData.doc);

// 			// Schedule cleanup after 2 minutes of inactivity
// 			setTimeout(() => {
// 				const currentRoomData = mindmapDocs.get(mindmapId);
// 				if (currentRoomData && currentRoomData.clients.size === 0) {
// 					// Do one final sync
// 					syncMindmapToDatabase(mindmapId, currentRoomData.doc);

// 					// Clean up resources
// 					clearInterval(currentRoomData.syncInterval);
// 					currentRoomData.doc.destroy();
// 					mindmapDocs.delete(mindmapId);

// 					console.log(`Cleaned up inactive mindmap document ${mindmapId}`);
// 				}
// 			}, 120000); // 2 minutes
// 		}
// 	}
// });

server.on('upgrade', (request, socket, head) => {
	const handleAuth = (ws) => {
		wss.emit('connection', ws, request);
	};
	wss.handleUpgrade(request, socket, head, handleAuth);
});

const fs = require('fs');

// Configure Y.js persistence with enhanced logging
utils.setPersistence({
	bindState: async (docName, ydoc) => {
		try {
			console.log(`\n===== BINDING Y.js DOCUMENT: ${docName} =====`);

			// Store the document in our map for later access
			mindmapRooms.set(docName, ydoc);

			const persistedYdoc = await persistence.getYDoc(docName);
			const newUpdates = Y.encodeStateAsUpdate(ydoc);
			await persistence.storeUpdate(docName, newUpdates);
			Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

			// Log initial state of `node`s and edges
			const nodesMap = ydoc.getMap('nodes');
			const edgesMap = ydoc.getMap('edges');

			console.log('FINAL NODES:', JSON.stringify(Array.from(nodesMap.entries()), null, 2));
			console.log('FINAL EDGES:', JSON.stringify(Array.from(edgesMap.entries()), null, 2));

			const mindmapId = docName.startsWith('mindmap-') ? docName.substring(8) : null;

			const nodes = JSON.stringify(Object.fromEntries(nodesMap), null, 2);
			const edges = JSON.stringify(Object.fromEntries(edgesMap), null, 2);

			fs.writeFile('./canvas/nodes.txt', nodes, (err) => {
				if (err) {
					console.error(err);
				} else {
					// file written successfully
				}
			});

			fs.writeFile('./canvas/edges.txt', edges, (err) => {
				if (err) {
					console.error(err);
				} else {
					// file written successfully
				}
			});

			const updatedMindmap = await Mindmap.findByIdAndUpdate(
				mindmapId,
				{
					nodes: nodes,
					edges: edges,
					lastModified: new Date(),
				},
				{ new: true, runValidators: false }
			);
			await updatedMindmap.save();

			// Setup observers for nodes and edges maps
			nodesMap.observe((event) => {
				console.log(`\n===== NODES UPDATED IN ${docName} =====`);

				// Track deleted keys
				const deletedKeys = [];
				event.changes.keys.forEach((change, key) => {
					if (change.action === 'delete') {
						deletedKeys.push(key);
						console.log(`Node deleted: ${key}`);
					}
				});

				// If we have deletions, update the database right away
				if (deletedKeys.length > 0 && mindmapId) {
					updateMindmapInDatabase(mindmapId, nodesMap, edgesMap);
				}
			});

			edgesMap.observe((event) => {
				console.log(`\n===== EDGES UPDATED IN ${docName} =====`);

				const changedKeys = Array.from(event.changes.keys.entries());
				// Track deleted keys
				const deletedKeys = [];
				event.changes.keys.forEach((change, key) => {
					console.log('ff ' + change.action);
					if (change.action === 'delete') {
						deletedKeys.push(key);
						console.log(`Edge deleted: ${key}`);
					}
				});

				// If we have deletions, update the database right away
				if (deletedKeys.length > 0 && mindmapId) {
					updateMindmapInDatabase(mindmapId, nodesMap, edgesMap);
				}
			});
			// Setup document update observer
			ydoc.on('update', async (update, origin, doc) => {
				console.log(`\n===== DOCUMENT ${docName} UPDATED =====`);

				// Store the update
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
		console.log(`\n===== WRITING DOCUMENT STATE: ${docName} =====`);

		// Log final state before document is closed
		const nodesMap = ydoc.getMap('nodes');
		const edgesMap = ydoc.getMap('edges');

		//	console.log('FINAL NODES:', JSON.stringify(Array.from(nodesMap.entries()), null, 2));
		//	console.log('FINAL EDGES:', JSON.stringify(Array.from(edgesMap.entries()), null, 2));

		console.log(`===== WRITE COMPLETE FOR ${docName} =====\n`);

		// Remove from our documents map
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
				lastModified: new Date(),
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

const printRoomContent = (roomName) => {
	const doc = docs.get(roomName);
	if (!doc) {
		return { error: `Room ${roomName} not found` };
	}

	try {
		// Get nodes and edges from the Y.js shared document
		const nodesMap = doc.getMap('nodes');
		const edgesMap = doc.getMap('edges');

		const nodes = Array.from(nodesMap.entries()).map(([id, node]) => {
			// Convert SharedType to plain object if needed
			return typeof node.toJSON === 'function' ? node.toJSON() : node;
		});

		const edges = Array.from(edgesMap.entries()).map(([id, edge]) => {
			return typeof edge.toJSON === 'function' ? edge.toJSON() : edge;
		});

		// Log to server console
		console.log(`Room ${roomName} content:`);
		console.log(`Nodes (${nodes.length}):`, JSON.stringify(nodes, null, 2));
		console.log(`Edges (${edges.length}):`, JSON.stringify(edges, null, 2));

		return {
			roomName,
			nodeCount: nodes.length,
			edgeCount: edges.length,
			nodes,
			edges,
			connectionCount: connections.get(roomName)?.size || 0,
		};
	} catch (error) {
		console.error(`Error printing room ${roomName} content:`, error);
		return { error: `Error retrieving content: ${error.message}` };
	}
};

// Graceful shutdown handler
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
				lastModified: new Date(),
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
