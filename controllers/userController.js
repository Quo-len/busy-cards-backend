const db = require('../models');
const multer = require('multer');

const User = db.User;

module.exports = {
	getAllUsers: async (req, res) => {
		try {
			const users = await User.find();
			res.status(200).json(users);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	getUser: async (req, res) => {
		try {
			const userId = req.params.userId;
			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found by id ' + userId });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	getUserEmail: async (req, res) => {
		try {
			const { email } = req.params.email;
			const user = await User.findOne({ email });
			if (!user) {
				return res.status(404).json({ error: 'User not found by email ' + email });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	addUser: async (req, res) => {
		try {
			const { email, password, username } = req.body;
			const user = new User({ email, password, username });
			await user.save();
			res.status(201).json(user);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	updateUser: async (req, res) => {
		try {
			const userId = req.params.userId;
			const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
			if (!user) {
				return res.status(404).json({ error: 'User not found by id ' + userId });
			}
			res.status(200).json(user);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	deleteUser: async (req, res) => {
		try {
			const userId = req.params.userId;
			const user = await User.findByIdAndDelete(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}
			res.status(200).json({ message: 'User deleted successfully' });
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
};
