const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FavoriteSchema = Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		mindmap: { type: Schema.Types.ObjectId, ref: 'Mindmap', required: true },
	},
	{ toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Favorite', FavoriteSchema);
