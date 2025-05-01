const db = require('../models');

const Invitation = db.Invitation;
const Participant = db.Participant;

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
					populate: {
						path: 'owner',
						model: 'User',
						select: 'id username email avatar',
					},
				})
				.populate({
					path: 'sender',
					model: 'User',
					select: 'id username email avatar',
				})
				.populate({
					path: 'receiver',
					model: 'User',
					select: 'id username email avatar',
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
			const { sender, receiver, title, mindmap, message, accessLevel } = req.body;
			if (sender === receiver) {
				return res.status(406).json({ error: 'Відправник не може співпадати з отримувачем.' });
			}
			console.log(receiver);
			const participant = await Participant.findOne({ user: receiver, mindmap: mindmap });
			if (participant) {
				return res.status(403).json({ message: 'Користувач вже є учасником.' });
			}
			console.log(participant);

			const invitation = new Invitation({ sender, receiver, title, mindmap, message, accessLevel });
			await invitation.save();
			res.status(201).json({ message: 'Запрошення успішно відправлено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	updateInvitation: async (req, res) => {
		try {
			const { id } = req.params.id;
			const { accessLevel, receiver, mindmap, status } = req.body;
			const invitation = await Invitation.findByIdAndUpdate(
				id,
				{ accessLevel, receiver, mindmap, status },
				{ new: true }
			);
			if (!invitation) {
				return res.status(404).json({ error: 'Запрошення не знайдено.' });
			}
			if (status === 'Принято') {
				const participant = new Participant({
					mindmap,
					accessLevel,
					user: receiver,
				});
				await participant.save();
			} else res.status(200).json(invitation);
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
