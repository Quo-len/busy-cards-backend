const db = require('../models');

const Invitation = db.Invitation;

module.exports = {
	getAllInvitations: async (req, res) => {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			// lastModified, createdAt
			const { receiver, sender, sortBy = 'lastModified', sortOrder = 'desc', isPublic, favorite } = req.query;

			const sortOptions = {
				[sortBy]: sortOrder === 'desc' ? -1 : 1,
			};

			const skip = (page - 1) * limit;

			let query = {};

			if (isPublic) {
				if (isPublic === 'true') {
					query.isPublic = true;
				} else if (isPublic === 'false') {
					query.isPublic = false;
				}
			}

			if (receiver) {
				query.receiver = receiver;
			}

			if (sender) {
				query.sender = sender;
			}

			const invitations = await Invitation.find(query)
				.sort(sortOptions)
				.skip(skip)
				.limit(limit)
				.populate({
					path: 'mindmap',
					model: 'Mindmap',
				})
				.populate({
					path: 'sender',
					model: 'User',
					select: '_id username email avatar',
				})
				.populate({
					path: 'receiver',
					model: 'User',
					select: '_id username email avatar',
				});

			const totalInvitations = await Invitation.countDocuments(query);

			const totalPages = Math.ceil(totalInvitations / limit);

			res.status(200).json({
				invitations,
				pagination: {
					currentPage: page,
					totalPages,
					totalInvitations,
					itemsPerPage: limit,
				},
			});
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	getInvitation: async (req, res) => {
		try {
			const invitation = await Invitation.findById(req.params.id);
			if (!invitation) {
				return res.status(404).json({ error: 'Запрошення не знайдено.' });
			}
			res.status(200).json(invitation);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	sendInvitation: async (req, res) => {
		try {
			const { sender, receiver, title, message, accessLevel } = req.body;
			const invitation = new Invitation(sender, receiver, title, message, accessLevel);
			await invitation.save();
			res.status(201).json(invitation);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	updateInvitation: async (req, res) => {
		try {
			res.status(200).json({ message: 'Запрошення успішно оновлено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	deleteInvitation: async (req, res) => {
		try {
			const invitation = await Invitation.findByIdAndDelete(req.params.id);
			if (!invitation) {
				return res.status(404).json({ error: 'Запрошення не знайдено.' });
			}
			res.status(200).json({ message: 'Запрошення успішно видалено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
};
