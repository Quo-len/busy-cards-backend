const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new mongoose.Schema({
	senderId: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
	receiverId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: false,
	},
	mindmapId: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	message: {
		type: String,
	},
	invitedUserEmail: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		enum: ['Очікує', 'Принято', 'Відхилено', 'Просрочено'],
		default: 'Очікує',
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	expiresAt: {
		type: Date,
	},
	acceptedAt: {
		type: Date,
	},
});

//invitationSchema.virtual('Mindmap', {
//    ref: 'Mindmap',
//    localField: '_id',
//    foreignField: 'mindmap'
//});

module.exports = mongoose.model('Invitation', invitationSchema);
