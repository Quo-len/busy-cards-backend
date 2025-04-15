const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new mongoose.Schema({
	mindmapId: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
	writerId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	text: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	status: {
		type: String,
		enum: ['Активний', 'Вирішений'],
		default: 'Активний',
	},
});

module.exports = mongoose.model('Tag', tagSchema);
