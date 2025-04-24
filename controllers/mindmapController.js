const db = require('../models');

const Mindmap = db.Mindmap;
const Participant = db.Participant;

module.exports = {
	getAllMindmaps: async (req, res) => {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			// lastModified, createdAt
			const { owner, participant, sortBy = 'lastModified', order = 'desc' } = req.query;

			const sortOptions = {
				[sortBy]: order === 'desc' ? -1 : 1,
			};

			const skip = (page - 1) * limit;

			let query = {};
			if (owner && participant) {
				const participantEntries = await Participant.find({ user: participant }).select('mindmap');

				const participantMindmapIds = participantEntries.map((entry) => entry.mindmap);

				query.$or = [{ owner }, { _id: { $in: participantMindmapIds } }];
			} else {
				if (owner) {
					query.owner = owner;
				}

				if (participant) {
					const participantEntries = await Participant.find({ user: participant }).select('mindmap');

					const participantMindmapIds = participantEntries.map((entry) => entry.mindmap);

					query._id = { $in: participantMindmapIds };
				}
			}

			const mindmaps = await Mindmap.find(query)
				.sort(sortOptions)
				.skip(skip)
				.limit(limit)
				.populate({
					path: 'participants',
					model: 'Participant',
					populate: {
						path: 'user',
						model: 'User',
						select: 'username email avatar',
					},
				})
				.populate({
					path: 'owner',
					model: 'User',
					select: '_id username email avatar',
				});

			const totalMindmaps = await Mindmap.countDocuments(query);

			const totalPages = Math.ceil(totalMindmaps / limit);

			res.status(200).json({
				mindmaps,
				pagination: {
					currentPage: page,
					totalPages,
					totalMindmaps,
					itemsPerPage: limit,
				},
			});
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	getMindmap: async (req, res) => {
		try {
			const mindmap = await Mindmap.findById(req.params.id);
			if (!mindmap) {
				res.status(404).json({ error: 'Інтелект-карту не знайдено.' });
			}
			res.status(200).json(mindmap);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	addMindmap: async (req, res) => {
		try {
			const { title, description, owner } = req.body;
			const mindmap = new Mindmap({ title, description, owner });
			await mindmap.save();
			res.status(201).json(mindmap);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	updateMindmap: async (req, res) => {
		try {
			const mindmap = await Mindmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
			if (!mindmap) {
				res.status(404).json({ error: 'Інтелект-карту не знайдено.' });
			}
			res.status(200).json(mindmap);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	deleteMindmap: async (req, res) => {
		try {
			const mindmap = await Mindmap.findByIdAndDelete(req.params.id);
			if (!mindmap) {
				return res.status(404).json({ error: 'Інтелект-карту не знайдено.' });
			}
			res.status(200).json({ message: 'Інтелект-карту успішно видалено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	// all mindmaps that user has access to
	// all mindmaps that user owns
};
