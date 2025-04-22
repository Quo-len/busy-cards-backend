const db = require('../models');
const { populate } = require('../models/User');

const Favorite = db.Favorite;
const User = db.User;
const Mindmap = db.Mindmap;

module.exports = {
	getAllFavorites: async (req, res) => {
		try {
			const favorites = await Favorite.find({ user: req.query.userId })
				.populate('mindmap')
				.populate({
					path: 'mindmap',
					populate: {
						path: 'participants',
						model: 'Participants',
						populate: {
							path: 'user',
							model: 'User',
							select: 'username email avatar _id',
						},
					},
				})
				.populate({
					path: 'mindmap',
					populate: {
						path: 'owner',
						model: 'User',
						select: 'username email avatar _id',
					},
				})
				.select('-__v');

			const result = favorites.map((f) => ({
				mindmap: f.mindmap,
			}));
			res.status(200).json(result);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	getFavorite: async (req, res) => {
		try {
			const { userId, mindmapId } = req.params;
			const favorite = await Favorite.findOne({ user: userId, mindmap: mindmapId });

			if (!favorite) {
				return res.status(404).json({ error: 'Favorite not found' });
			}

			res.status(200).json(favorite);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	addFavorite: async (req, res) => {
		try {
			const { userId, mindmapId } = req.body;
			const favoriteExists = await Favorite.findOne({ user: userId, mindmap: mindmapId });
			if (favoriteExists) {
				return res.status(400).json({ error: 'Favorite already exists' });
			}
			const favorite = new Favorite({ user: userId, mindmap: mindmapId });
			await favorite.save();
			res.status(201).json(favorite);
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
	deleteFavorite: async (req, res) => {
		try {
			const { userId, mindmapId } = req.body;
			const favorite = await Favorite.findOneAndDelete({ user: userId, mindmap: mindmapId });
			if (!favorite) {
				return res.status(404).json({ error: 'Favorite not found' });
			}
			res.status(200).json({ message: 'Favorite deleted successfully' });
		} catch (error) {
			res.status(500).json({ error: `Internal server error: ${error.message}` });
		}
	},
};
