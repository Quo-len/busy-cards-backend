const jwt = require('jsonwebtoken');
const config = require('../config');
const nodemailer = require('nodemailer');

const db = require('../models');
const Mindmap = db.Mindmap;
const Participant = db.Participant;

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

const checkPermission = async (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1];
		let userId = null;
		if (token) {
			const decoded = jwt.verify(token, config.jwtSecret);
			userId = decoded.user.id;
		}

		const mindmapId = req.params.id;
		const mindmap = await Mindmap.findById(mindmapId).populate('owner');

		if (!mindmap) {
			return res.status(404).json({ message: 'Інтелект-карта не знайдена.' });
		}
		if (mindmap.owner.id === userId) {
			req.role = 'Власник';
			return next();
		}

		const participant = await Participant.findOne({
			mindmap: mindmapId,
			user: userId,
		});

		if (participant) {
			req.role = participant.accessLevel;
			return next();
		} else if (mindmap.isPublic) {
			req.role = 'Глядач';
			return next();
		}

		return res.status(403).json({ message: 'У вас немає доступу до цієї інтелект-карти.' });
	} catch (error) {
		return res.status(500).json({ message: `Помилка при перевірці доступу: ${error.message}` });
	}
};

module.exports = { verifyToken, authorize, checkPermission };
