const jwt = require('jsonwebtoken');
const config = require('../config');
const nodemailer = require('nodemailer');

function verifyToken(req, res, next) {
	const authHeader = req.header('Authorization');

	if (!authHeader) {
		return res.status(401).json({
			message: 'Авторизаційні дані не надано, відмова в доступі.',
		});
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({
			message: 'Авторизаційні дані не надано, відмова в доступі.',
		});
	}

	try {
		const decoded = jwt.verify(token, config.jwtSecret);
		req.user = decoded.user;
		next();
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ message: 'Час авторизації сплинув' });
		}
		return res.status(401).json({ message: `Token is not valid: ${error.message}` });
	}
}

function authorize(allowedRoles = []) {
	return (req, res, next) => {
		const userRole = req.user.role;
		const userId = req.user?.id;
		const targetId = req.params.userId;
		const isAdmin = allowedRoles.includes(userRole);
		const isOwner = String(userId) === String(targetId);

		if (!req.user || (!isAdmin && !isOwner)) {
			return res.status(403).json({ message: 'Доступ відмовлено: недостатньо прав.' });
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
