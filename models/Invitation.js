const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new Schema(
	{
		sender: {
			type: Schema.Types.ObjectId,
			ref: 'User',
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

		status: {
			type: String,
			enum: ['Очікує', 'Принято', 'Відхилено'],
			default: 'Очікує',
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true,
	}
);

module.exports = mongoose.model('Invitation', invitationSchema);
