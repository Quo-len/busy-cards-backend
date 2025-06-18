/* eslint-disable no-undef */
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
	throw result.error;
}

module.exports = {
	saltRounds: 2,
	jwtSecret: process.env.SECRET,
	tokenExpireTime: '24h',
	port: process.env.PORT || 3000,
	ws_port: process.env.WS_PORT || 5000,
	email: process.env.EMAIL,
	pass: process.env.PASS,
	session_secret: process.env.SESSION_SECRET,
	db_login: process.env.DB_LOGIN,
	db_pass: process.env.DB_PASS,
};
