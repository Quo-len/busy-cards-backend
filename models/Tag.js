const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new mongoose.Schema({
	mindmapId: {
		type: Schema.Types.ObjectId,
		ref: 'Mindmap',
		required: true,
	},
	title: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: false,
	},
	color: {
		type: String,
	},
});

module.exports = mongoose.model('Tag', tagSchema);
