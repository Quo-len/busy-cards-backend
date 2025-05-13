const db = require('../models');
const multer = require('multer');
const fs = require('fs');
const config = require('./../config');
const path = require('path');

const User = db.User;

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
		const userId = req.params.userId || 'default';
		const extension = path.extname(file.originalname);
		const filename = `${userId}${extension}`;
		cb(null, filename);
	},
});

const fileFilter = (req, file, cb) => {
	const fileTypes = /jpeg|jpg|png|gif/;
	const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = fileTypes.test(file.mimetype);

	if (extname && mimetype) {
		return cb(null, true);
	} else {
		return cb(new Error('Only image files are allowed.'));
	}
};

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter,
}).single('avatar');

module.exports = {
	getAllUsers: async (req, res) => {
		try {
			const users = await User.find();
			res.status(200).json(users);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	getUser: async (req, res) => {
		try {
			const userId = req.params.userId;
			const log = req.query.log === 'true';
			const user = await User.findById(userId);

			if (!user) {
				return res.status(404).json({ error: 'Користувача не знайдено.' });
			}

			if (log) {
				user.updatedAt = Date.now();
				await user.save();
			}

			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	getUserEmail: async (req, res) => {
		try {
			const email = req.params.email;
			const user = await User.findOne({ email });
			if (!user) {
				return res.status(404).json({ error: 'Користувача з такою поштою не знайдено.' });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	addUser: async (req, res) => {
		upload(req, res, async (err) => {
			if (err) {
				return res.status(400).json({ error: err.message });
			}

			try {
				const { email, password, username } = req.body;
				const user = new User({
					email,
					password,
					username,
					avatar: req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '',
				});

				await user.save();
				res.status(201).json(user);
			} catch (error) {
				res.status(500).json({ error: `Помилка серверу: ${error.message}` });
			}
		});
	},
	updateAvatar: async (req, res) => {
		upload(req, res, async (err) => {
			if (err) {
				return res.status(400).json({ error: err.message });
			}

			try {
				const userId = req.params.userId;

				const user = await User.findById(userId);
				if (!user) {
					return res.status(404).json({ error: 'Користувача не знайдено.' });
				}

				if (user.avatar) {
					const oldAvatarPath = path.join(__dirname, '..', user.avatar);
					if (fs.existsSync(oldAvatarPath)) {
						fs.unlinkSync(oldAvatarPath);
					}
				}

				const updateData = {
					...req.body,
					avatar: req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '',
				};

				const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
				if (!updatedUser) {
					return res.status(404).json({ error: 'Користувача не знайдено.' });
				}

				res.status(200).json(updatedUser);
			} catch (error) {
				res.status(500).json({ error: `Помилка серверу: ${error.message}` });
			}
		});
	},
	updateUser: async (req, res) => {
		try {
			const userId = req.params.userId;
			const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
			if (!user) {
				return res.status(404).json({ error: 'Користувача не знайдено.' });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	deleteUser: async (req, res) => {
		try {
			const userId = req.params.userId;
			const user = await User.findByIdAndDelete(userId);
			if (!user) {
				return res.status(404).json({ error: 'Користувача не знайдено.' });
			}
			res.status(200).json({ message: 'Користувача успішно видалено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
};
