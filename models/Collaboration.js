const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const docSchema = new mongoose.Schema(
	{
		version: String,
		action: String,
		docName: String,
		clock: Schema.Types.Int32,
		part: String,
		value: Schema.Types.Buffer,
	},
	{ strict: false }
);

docSchema.createIndex({
	version: 1,
	docName: 1,
	action: 1,
	clock: 1,
	part: 1,
});

module.exports = mongoose.model('yjs-transactions', docSchema);
