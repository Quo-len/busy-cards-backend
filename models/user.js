const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		username: {
			type: String,
			required: true,
		},
		avatar: {
			type: String,
			default: '',
		},
		password: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		bio: {
			type: String,
			default: 'Опис відсутній',
		},
		lastLogin: {
			type: Date,
		},
	},
	{ strict: false }
);

module.exports = mongoose.model('User', UserSchema);
