const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const utils = require('y-websocket/bin/utils');
const { MongodbPersistence } = require('y-mongodb-provider');
const mongoose = require('mongoose');
const db = require('./models');
const Mindmap = db.Mindmap;
const config = require('./config');

const db_login = config.db_login;
const db_pass = config.db_pass;
const db_uri = `mongodb+srv://${db_login}:${db_pass}@busycardsclaster.7wkb9.mongodb.net/?retryWrites=true&w=majority&appName=BusyCardsClaster`;
const wsPort = config.ws_port;
const production = process.env.PRODUCTION != null;

const collection = 'collab';
const persistence = new MongodbPersistence(db_uri, {
	collectionName: collection,
	flushSize: 100,
	multipleCollections: false,
});

async function connect() {
	try {
		await mongoose.connect(db_uri);
		console.log('Connected to MongoDB with mongoose');
	} catch (error) {
		console.log('Failed to connect to MongoDB with mongoose: ' + error);
	}
}
connect();

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

const wss = new WebSocket.Server({ noServer: true });

const mindmapRooms = new Map();
const connectionsPerDoc = new Map();
const pendingSyncs = new Map();

const throttleSync = (mindmapId, doc) => {
	if (pendingSyncs.has(mindmapId)) {
		clearTimeout(pendingSyncs.get(mindmapId));
	}

	const timeoutId = setTimeout(() => {
		syncToDatabase(mindmapId, doc);
		pendingSyncs.delete(mindmapId);
	}, 500);

	pendingSyncs.set(mindmapId, timeoutId);
};

const originalSetupWSConnection = utils.setupWSConnection;
utils.setupWSConnection = async (conn, req, { docName: roomName = req.url.slice(1).split('?')[0], gc = true } = {}) => {
	const isMindmapDoc = roomName.startsWith('mindmap-');
	const mindmapId = isMindmapDoc ? roomName.substring(8) : null;

	const doc = utils.getYDoc(roomName);

	if (!mindmapRooms.has(roomName)) {
		mindmapRooms.set(roomName, doc);

		if (!connectionsPerDoc.has(roomName)) {
			connectionsPerDoc.set(roomName, new Set());
		}
	}

	const docConnections = connectionsPerDoc.get(roomName);
	docConnections.add(conn);

	if (isMindmapDoc && docConnections.size === 1) {
		console.log(`First connection to mindmap ${mindmapId}, loading from database...`);
		await initFromDatabase(mindmapId, doc);
	}

	conn.on('close', () => {
		const docConnections = connectionsPerDoc.get(roomName);
		if (docConnections) {
			docConnections.delete(conn);

			if (docConnections.size === 0 && isMindmapDoc) {
				console.log(`Last connection to mindmap ${mindmapId} closed, syncing to database...`);
				if (pendingSyncs.has(mindmapId)) {
					clearTimeout(pendingSyncs.get(mindmapId));
					pendingSyncs.delete(mindmapId);
				}
				syncToDatabase(mindmapId, doc);
			}
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

			const mindmapId = docName.startsWith('mindmap-') ? docName.substring(8) : null;

			ydoc.on('update', async (update, origin, doc) => {
				await persistence.storeUpdate(docName, update);
				if (mindmapId) {
					throttleSync(mindmapId, doc);
				}
			});

			console.log(`===== BINDING COMPLETE FOR ${docName} =====\n`);
		} catch (error) {
			console.error('Error in bindState:', error);
		}
	},
	writeState: async (docName, ydoc) => {
		const mindmapId = docName.startsWith('mindmap-') ? docName.substring(8) : null;

		if (mindmapId) {
			syncToDatabase(mindmapId, ydoc);
		}

		mindmapRooms.delete(docName);

		return new Promise((resolve) => {
			resolve();
		});
	},
});

server.listen(wsPort);
console.log(
	`Y.js WebSocket server with MongoDB persistence listening on port ${wsPort} ${production ? '(production)' : ''}`
);

async function initFromDatabase(mindmapId, ydoc) {
	try {
		console.log(`Initializing document for mindmap ${mindmapId} from database`);

		const mindmap = await Mindmap.findById(mindmapId);
		if (!mindmap) {
			console.log(`No mindmap found with ID: ${mindmapId}`);
			return;
		}

		const nodesMap = ydoc.getMap('nodes');
		const edgesMap = ydoc.getMap('edges');

		Object.entries(mindmap.nodes).forEach(([id, nodeData]) => {
			if (id && nodeData) {
				nodesMap.set(id, nodeData);
			}
		});

		Object.entries(mindmap.edges).forEach(([id, edgeData]) => {
			if (id && edgeData) {
				edgesMap.set(id, edgeData);
			}
		});

		console.log(`Populated ${nodesMap.size} nodes from database`);
		console.log(`Populated ${edgesMap.size} edges from database`);

		console.log(`Initialized document for mindmap ${mindmapId} from database successfully`);
	} catch (error) {
		console.error(`Error initializing document for mindmap ${mindmapId}:`, error);
	}
}

async function syncToDatabase(mindmapId, ydoc) {
	try {
		const nodesMap = ydoc.getMap('nodes');
		const edgesMap = ydoc.getMap('edges');

		const nodes = Object.fromEntries(nodesMap);
		const edges = Object.fromEntries(edgesMap);

		console.log(`Updating mindmap ${mindmapId} in database`);
		console.log(`Nodes count: ${nodesMap.size}, Edges count: ${edgesMap.size}`);

		const updatedMindmap = await Mindmap.findByIdAndUpdate(
			mindmapId,
			{
				$set: {
					nodes: nodes,
					edges: edges,
				},
			},
			{ new: true, runValidators: true }
		);

		if (!updatedMindmap) {
			console.error(`Mindmap ${mindmapId} not found during sync`);
			return;
		}

		console.log(`Mindmap ${mindmapId} synchronized to database successfully`);
	} catch (error) {
		console.error(`Error updating mindmap ${mindmapId}:`, error);
	}
}

process.on('SIGINT', async () => {
	console.log('SIGINT received. Syncing mindmaps before shutdown...');

	const syncPromises = [];

	for (const [roomName, doc] of mindmapRooms.entries()) {
		if (roomName.startsWith('mindmap-')) {
			const mindmapId = roomName.substring(8);
			syncPromises.push(syncToDatabase(mindmapId, doc));
		}
	}

	try {
		await Promise.all(syncPromises);
		console.log('All mindmaps synced to database');

		wss.close(() => {
			console.log('WebSocket server closed.');

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
