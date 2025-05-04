const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Favorite = require('./Favorite'); // adjust path if needed
const Participant = require('./Participant'); // adjust path if needed

const mindmapSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			default: 'Нова інтелект-карта без назви',
			required: true,
		},
		description: {
			default: 'Опис відсутній.',
			type: String,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		// Change from array to mixed object
		nodes: {
			type: Schema.Types.Mixed,
			default: {},
		},
		// Change from array to mixed object
		edges: {
			type: Schema.Types.Mixed,
			default: {},
		},
		isPublic: {
			type: Boolean,
			default: false,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true,
		strict: false,
	}
);

mindmapSchema.virtual('participants', {
	ref: 'Participant',
	localField: '_id',
	foreignField: 'mindmap',
});

mindmapSchema.pre('findOneAndDelete', async function (next) {
	try {
		const doc = await this.model.findOne(this.getFilter());
		if (doc) {
			await Favorite.deleteMany({ mindmap: doc.id });
			await Participant.deleteMany({ mindmap: doc.id });
		}
		next();
	} catch (err) {
		next(err);
	}
});

module.exports = mongoose.model('Mindmap', mindmapSchema);
