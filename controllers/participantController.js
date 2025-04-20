const db = require('../models');

const Participant = db.Participant;
const User = db.User;
const Mindmap = db.Mindmap;

module.exports = {
	getAllParticipants: async (req, res) => {
		try {
			const mindmapId = req.query.mindmapId;
			const participantId = req.query.userId;

			let filter = {};
			if (mindmapId) {
				filter.mindmap = mindmapId;
			}
			if (participantId) {
				filter.user = participantId;
			}

			const participants = await Participant.find(filter).populate('user').select('-__v');

			const result = participants.map((p) => ({
				_id: p._id,
				mindmap: p.mindmap,
				user: p.user.id,
				username: p.user.username,
				email: p.user.email,
				accessLevel: p.accessLevel,
				joinedAt: p.joinedAt,
			}));
			res.status(200).json(result);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	getParticipant: async (req, res) => {
		try {
			const participant = await Participant.findOne({ mindmap: req.params.mindmapId, user: req.params.userId });
			if (!participant) {
				res.status(404).json({ error: 'Participant not found by id ' + req.params.id });
			}
			res.status(200).json(participant);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	addParticipant: async (req, res) => {
		try {
			const { mindmapId, userId } = req.params;
			const { accessLevel } = req.body;

			const user = await User.findById(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found with id ' + userId });
			}
			const mindmap = await Mindmap.findById(mindmapId);
			if (!mindmap) {
				return res.status(404).json({ error: 'Mindmap not found with id ' + mindmapId });
			}
			const existingParticipant = await Participant.findOne({ mindmap: mindmapId, user: userId });
			if (existingParticipant) {
				return res.status(400).json({ error: 'User is already a participant' });
			}
			const participant = new Participant({
				mindmap: mindmapId,
				user: userId,
				accessLevel,
			});
			await participant.save();
			res.status(201).json(participant);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	updateParticipant: async (req, res) => {
		try {
			const { mindmapId, userId } = req.params;
			const { accessLevel } = req.body;
			const participant = await Participant.findOneAndUpdate(
				{ mindmap: mindmapId, user: userId },
				{ accessLevel },
				{
					new: true,
				}
			);
			if (!participant) {
				res.status(404).json({ error: 'Participant not found by id ' + req.params.id });
			}
			res.status(200).json(participant);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	deleteParticipant: async (req, res) => {
		try {
			const participant = await Participant.findOneAndDelete({
				mindmap: req.params.mindmapId,
				user: req.params.userId,
			});
			if (!participant) {
				return res.status(404).json({ error: 'Participant not found' });
			}
			res.status(200).json({ message: 'Participant deleted successfully' });
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
};
