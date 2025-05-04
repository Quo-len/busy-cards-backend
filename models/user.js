const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
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
		bio: {
			type: String,
			default: 'Опис відсутній',
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true,
		strict: false,
	}
);

module.exports = mongoose.model('User', UserSchema);
