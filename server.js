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
		origin: '*',
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);
app.use(express.json());
app.use(routes);

app.get('/', (req, res) => {
	res.json({ message: 'Server is running!', status: 'ok' });
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
