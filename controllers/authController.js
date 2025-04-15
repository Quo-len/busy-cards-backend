const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { jwtSecret, email, pass } = require('../config');

const db = require('../models');
const User = db.User;

module.exports = {
	register: async (req, res) => {
		try {
			const { email, password } = req.body;
			const userExists = await User.findOne({ email: email });
			if (userExists) {
				return res.status(400).json({ error: 'User already exists' });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHashed = await bcrypt.hash(password, salt);

			const user = new User({ email: email, password: passwordHashed });
			await user.save();

			res.status(201).json({ message: 'User registered successfully' });
		} catch (error) {
			res.status(500).json({ error: `Server error: ${error.message}` });
		}
	},
	login: async (req, res) => {
		try {
			const { email, password } = req.body;
			const user = await User.findOne({ email: email });
			if (!user) {
				return res.status(400).json({ error: 'Invalid credentials' });
			}

			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(500).json({ error: 'Wrong password' });
			}

			const payload = {
				user: {
					id: user.id,
				},
			};

			const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
			res.status(201).json({ token: token });
		} catch (error) {
			res.status(500).json({ error: `Server error: ${error.message}` });
		}
	},
	updatePassword: async (req, res) => {
		try {
			const { userId } = req.params;
			const { currentPassword, newPassword } = req.body;

			const user = User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			const isMatch = bcrypt.compare(currentPassword, user.password);
			if (!isMatch) {
				return res.status(400).json({ error: 'Current password is incorrect' });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHashed = await bcrypt.hash(newPassword, salt);

			user.password = passwordHashed;
			await user.save();

			res.status(201).json({ message: 'Password updated successfully' });
		} catch (error) {
			res.status(500).json({ error: `Server error: ${error.message}` });
		}
	},

	// sendEmail: async (req, res) => {
	// 	try {
	// 		const { email, subject, text } = req.body;
	// 		const transporter = nodemailer.createTransport({
	// 			host: process.env.HOST,
	// 			service: process.env.SERVICE,
	// 			port: 587,
	// 			secure: true,
	// 			auth: {
	// 				user: email,
	// 				pass: pass,
	// 			},
	// 		});

	// 		await transporter.sendMail({
	// 			from: process.env.USER,
	// 			to: email,
	// 			subject: subject,
	// 			text: text,
	// 		});
	// 		console.log('email sent sucessfully');
	// 	} catch (error) {
	// 		console.log('email not sent');
	// 		console.log(error);
	// 	}
	// },
};
