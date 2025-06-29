const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Favorite = require('./Favorite');
const Participant = require('./Participant');
const Invitation = require('./Invitation');

const mindmapSchema = new Schema(
	{
		title: { type: String, default: 'Нова інтелект-карта без назви', required: true },
		description: { default: 'Опис відсутній.', type: String },
		owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		nodes: { type: Schema.Types.Mixed, default: {} },
		edges: { type: Schema.Types.Mixed, default: {} },
		isPublic: { type: Boolean, default: false },
	},
	{ toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true, strict: false }
);

mindmapSchema.virtual('participants', {
	ref: 'Participant',
	localField: '_id',
	foreignField: 'mindmap',
});

mindmapSchema.pre(['deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function (next) {
	try {
		const mindmapId = this.getQuery()._id;

		await Participant.deleteMany({ mindmap: mindmapId });
		await Invitation.deleteMany({ mindmap: mindmapId });
		await Favorite.deleteMany({ mindmap: mindmapId });

		console.log(`Cleaned up data for mindmap: ${mindmapId}`);
		next();
	} catch (error) {
		console.error('Error in Mindmap pre-delete middleware:', error);
		next(error);
	}
});

module.exports = mongoose.model('Mindmap', mindmapSchema);
