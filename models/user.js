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
			default: function () {
				return this.email;
			},
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
		about: {
			type: String,
			default: 'No information',
		},
		lastLogin: {
			type: Date,
		},
	},
	{ strict: false }
);

module.exports = mongoose.model('User', UserSchema);
