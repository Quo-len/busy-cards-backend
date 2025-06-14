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
							select: 'username email avatar id',
						},
					},
				})
				.populate({
					path: 'mindmap',
					populate: {
						path: 'owner',
						model: 'User',
						select: 'username email avatar id',
					},
				})
				.select('-__v');

			const result = favorites.map((f) => ({
				mindmap: f.mindmap,
			}));
			res.status(200).json(result);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	getFavorite: async (req, res) => {
		try {
			const { userId, mindmapId } = req.params;
			const favorite = await Favorite.findOne({ user: userId, mindmap: mindmapId });

			if (!favorite) {
				return res.status(404).json({ error: 'Улюблене не знайдено.' });
			}

			res.status(200).json(favorite);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	addFavorite: async (req, res) => {
		try {
			const { userId, mindmapId } = req.body;
			const existingFavorite = await Favorite.findOne({ user: userId, mindmap: mindmapId });
			if (existingFavorite) {
				return res.status(400).json({ error: 'Улюблене вже існує.' });
			}
			const favorite = new Favorite({ user: userId, mindmap: mindmapId });
			await favorite.save();
			res.status(201).json(favorite);
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
	deleteFavorite: async (req, res) => {
		try {
			const { userId, mindmapId } = req.body;
			const favorite = await Favorite.findOneAndDelete({ user: userId, mindmap: mindmapId });
			if (!favorite) {
				return res.status(404).json({ error: 'Улюблене не знайдено.' });
			}
			res.status(200).json({ message: 'Улюблене успішно видалено.' });
		} catch (error) {
			res.status(500).json({ error: `Помилка серверу: ${error.message}` });
		}
	},
};
