const jwt = require('jsonwebtoken');
const config = require('../config');
const nodemailer = require('nodemailer');

function verifyToken(req, res, next) {
	const authHeader = req.header('Authorization');

	if (!authHeader) {
		return res.status(401).json({
			msg: 'No token, authorization denied',
		});
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({
			message: 'No token, authorization denied',
		});
	}

	try {
		const decoded = jwt.verify(token, config.jwtSecret);

		req.user = decoded.user;
		next();
	} catch (error) {
		return res.status(401).json({ message: `Token is not valid: ${error.message}` });
	}
}

function authorize(allowedRoles = []) {
	return (req, res, next) => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ message: 'Access denied: insufficient permissions' });
		}
		next();
	};
}

const mailSender = async (email, title, body) => {
	try {
		//to send email ->  firstly create a Transporter
		let transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST, //-> Host SMTP detail
			auth: {
				user: process.env.MAIL_USER, //-> User's mail for authentication
				pass: process.env.MAIL_PASS, //-> User's password for authentication
			},
		});

		//now Send e-mails to users
		let info = await transporter.sendMail({
			from: 'www.sandeepdev.me - Sandeep Singh',
			to: `${email}`,
			subject: `${title}`,
			html: `${body}`,
		});

		console.log('Info is here: ', info);
		next();
	} catch (error) {
		console.log(error.message);
	}
};

module.exports = { verifyToken, authorize, mailSender };
