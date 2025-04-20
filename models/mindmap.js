const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
	}
);

mindmapSchema.virtual('participants', {
	ref: 'Participant',
	localField: '_id',
	foreignField: 'mindmap',
});

module.exports = mongoose.model('Mindmap', mindmapSchema);
