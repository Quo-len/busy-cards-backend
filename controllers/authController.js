const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, email, pass } = require('../config');

const db = require('../models');
const User = db.User;

module.exports = {
	register: async (req, res) => {
		try {
			const { email, password, username } = req.body;
			const userExists = await User.findOne({ email: email });
			if (userExists) {
				return res.status(400).json({ error: 'Користувач під такою пошною вже зареєстрований.' });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHashed = await bcrypt.hash(password, salt);

			const user = new User({ email: email, password: passwordHashed, username: username });
			await user.save();

			res.status(201).json({ message: 'Користувача успішно зареєстровано.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	login: async (req, res) => {
		try {
			const { email, password } = req.body;
			const user = await User.findOne({ email: email });
			if (!user) {
				return res.status(400).json({ error: 'Неправильні дані для входу.' });
			}

			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(500).json({ error: 'Неправильний пароль.' });
			}

			const payload = {
				user: {
					id: user.id,
					...(user.role && { role: user.role }),
				},
			};

			const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
			res.status(201).json({ token: token });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	updatePassword: async (req, res) => {
		try {
			const userId = req.user.id;
			const { currentPassword, newPassword } = req.body;
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: 'Користувача не знайдено.' });
			}

			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) {
				return res.status(400).json({ error: 'Неправильний теперішній пароль.' });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHashed = await bcrypt.hash(newPassword, salt);

			user.password = passwordHashed;
			await user.save();

			res.status(201).json({ message: 'Пароль оновлено успішно.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},

	forgotPassword: async (req, res) => {
		try {
			const { email } = req.body;

			const user = await User.findOne({ email });
			if (!user) {
				return res.status(404).json({ error: 'Користувача не знайдено' });
			}

			const resetToken = crypto.randomBytes(20).toString('hex');
			user.resetToken = resetToken;
			user.resetTokenExpiration = Date.now() + 3600000 * 24;
			await user.save();
			res.status(200).json({ message: 'Посилання для скидання пароля надіслано.' });
		} catch (error) {
			res.status(500).json({ error: 'Виникла помилка під час відновлення пароля.' });
		}
	},

	resetPassword: async (req, res) => {
		try {
			const { resetToken, newPassword } = req.body;

			const user = await User.findOne({
				resetToken,
				resetTokenExpiration: { $gt: Date.now() },
			});
			if (!user) {
				return res.status(401).json({ error: 'Час авторизації сплинув.' });
			}

			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);

			user.password = hashedPassword;
			user.resetToken = undefined;
			user.resetTokenExpiration = undefined;
			await user.save();

			res.status(200).json({ message: 'Скидання пароля відбулося успішно.' });
		} catch (error) {
			res.status(500).json({ error: 'Виникла помилка під час скидання пароля.' });
		}
	},
};
