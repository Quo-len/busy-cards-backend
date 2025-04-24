const db = require('../models');

const Invitation = db.Invitation;

module.exports = {
	getAllInvitations: async (req, res) => {
		try {
			res.status(200).json({ message: '' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	sendInvitation: async (req, res) => {
		try {
			res.status(201).json({ message: '' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	updateInvitation: async (req, res) => {
		try {
			res.status(200).json({ message: '' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	cancelInvitation: async (req, res) => {
		try {
			res.status(200).json({ message: '' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
};
