const db = require('../models');

const Invitation = db.Invitation;
const Participant = db.Participant;

module.exports = {
	getAllInvitations: async (req, res) => {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			// lastModified, createdAt
			const { receiver, sender, status, sortBy = 'lastModified', sortOrder = 'desc' } = req.query;

			const sortOptions = {
				[sortBy]: sortOrder === 'desc' ? -1 : 1,
			};

			const skip = (page - 1) * limit;

			let query = {};

			if (receiver) {
				query.receiver = receiver;
			}

			if (status) {
				query.status = status;
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
			const { id } = req.params;
			const invitation = await Invitation.findById(id);
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
			const participant = await Participant.findOne({ user: receiver, mindmap: mindmap });
			if (participant) {
				return res.status(403).json({ message: 'Користувач вже є учасником.' });
			}

			const invitation = new Invitation({ sender, receiver, title, mindmap, message, accessLevel });
			await invitation.save();
			res.status(201).json({ message: 'Запрошення успішно відправлено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	updateInvitation: async (req, res) => {
		try {
			const { id } = req.params;
			const { status } = req.body;

			console.log('Updating invitation with ID:', id);

			const invitation = await Invitation.findByIdAndUpdate(id, req.body, { new: true });

			if (!invitation) {
				return res.status(404).json({ error: 'Запрошення не знайдено.' });
			}

			if (status === 'Принято') {
				const existingParticipant = await Participant.findOne({
					mindmap: invitation.mindmap,
					user: invitation.receiver,
				});

				if (existingParticipant) {
					existingParticipant.accessLevel = invitation.accessLevel;
					await existingParticipant.save();
				} else {
					const participant = new Participant({
						mindmap: invitation.mindmap,
						accessLevel: invitation.accessLevel,
						user: invitation.receiver,
					});
					await participant.save();
				}
			}

			return res.status(200).json(invitation);
		} catch (error) {
			console.error('Server error:', error);
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
