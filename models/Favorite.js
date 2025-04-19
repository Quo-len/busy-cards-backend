const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FavoriteSchema = new mongoose.Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	mindmap: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
});

module.exports = mongoose.model('Favorite', FavoriteSchema);
