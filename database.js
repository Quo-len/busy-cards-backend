const mongoose = require('mongoose');
const config = require('./config');

const db_login = config.db_login;
const db_pass = config.db_pass;
const db_uri = `mongodb+srv://${db_login}:${db_pass}@busycardsclaster.7wkb9.mongodb.net/?retryWrites=true&w=majority&appName=BusyCardsClaster`;

async function connect() {
	try {
		await mongoose.connect(db_uri);
		console.log('Connected to MongoDB');
	} catch (error) {
		console.log('Failed to connect to MongoDB: ' + error);
	}
}

connect();
