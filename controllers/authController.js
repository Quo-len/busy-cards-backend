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
				return res.status(400).json({ error: 'User already exists' });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHashed = await bcrypt.hash(password, salt);

			const user = new User({ email: email, password: passwordHashed, username: username });
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
			const userId = req.user.id;
			const { currentPassword, newPassword } = req.body;
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			const isMatch = await bcrypt.compare(currentPassword, user.password);
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

	forgotPassword: async (req, res) => {
		try {
			const { email } = req.body;

			// Check if the user exists
			const user = await User.findOne({ email });
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			// Generate a reset token
			const resetToken = crypto.randomBytes(20).toString('hex');
			user.resetToken = resetToken;
			user.resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour
			await user.save();
			res.status(200).json({ message: 'Password reset token sent' });
		} catch (error) {
			console.error('Error generating reset token:', error);
			res.status(500).json({ error: 'An error occurred while generating the reset token' });
		}
	},

	resetPassword: async (req, res) => {
		try {
			const { resetToken, newPassword } = req.body;

			// Find the user with the provided reset token
			const user = await User.findOne({
				resetToken,
				resetTokenExpiration: { $gt: Date.now() },
			});
			if (!user) {
				return res.status(401).json({ error: 'Invalid or expired reset token' });
			}

			// Encrypt and hash the new password
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);

			// Update the user's password and reset token fields
			user.password = hashedPassword;
			user.resetToken = undefined;
			user.resetTokenExpiration = undefined;
			await user.save();

			res.status(200).json({ message: 'Password reset successful' });
		} catch (error) {
			console.error('Error resetting password:', error);
			res.status(500).json({ error: 'An error occurred while resetting the password' });
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
