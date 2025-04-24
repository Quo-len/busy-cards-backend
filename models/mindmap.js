const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Favorite = require('./Favorite'); // adjust path if needed
const Participant = require('./Participant'); // adjust path if needed

const mindmapSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		nodes: [
			{
				id: String,
				type: String,
				position: {
					x: Number,
					y: Number,
				},
				data: Schema.Types.Mixed,
			},
		],
		edges: [
			{
				id: String,
				source: String,
				target: String,
				type: String,
				sourceHandle: String,
				targetHandle: String,
			},
		],
		isPublic: {
			type: Boolean,
			default: false,
		},
		lastModified: {
			type: Date,
			default: Date.now,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
	{ strict: false }
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
			await Favorite.deleteMany({ mindmap: doc._id });
			await Participant.deleteMany({ mindmap: doc._id });
		}
		next();
	} catch (err) {
		next(err);
	}
});

module.exports = mongoose.model('Mindmap', mindmapSchema);
