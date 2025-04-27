const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new mongoose.Schema({
	sender: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
	receiver: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: false,
	},
	mindmap: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	accessLevel: {
		type: String,
		enum: ['Редактор', 'Коментатор', 'Глядач'],
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
		enum: ['Очікує', 'Принято', 'Відхилено'],
		default: 'Очікує',
	},
	expiresAt: {
		type: Date,
		default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
	},
});

module.exports = mongoose.model('Invitation', invitationSchema);
