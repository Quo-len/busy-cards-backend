const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Favorite = require('./Favorite');
const Participant = require('./Participant');
const Invitation = require('./Invitation');
const Mindmap = require('./Mindmap');

const UserSchema = new Schema(
	{
		email: { type: String, required: true, unique: true, index: true },
		username: { type: String, required: true },
		avatar: { type: String, default: '' },
		password: { type: String, required: true },
		bio: { type: String, default: 'Опис відсутній' },
	},
	{ toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true, strict: false }
);

UserSchema.pre(['deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function (next) {
	try {
		const userId = this.getQuery()._id;

		await Mindmap.deleteMany({ owner: userId });
		await Invitation.deleteMany({
			$or: [{ sender: userId }, { receiver: userId }],
		});
		await Participant.deleteMany({ user: userId });
		await Favorite.deleteMany({ user: userId });

		console.log(`Cleaned up data for user: ${userId}`);
		next();
	} catch (error) {
		console.error('Error in User pre-delete middleware:', error);
		next(error);
	}
});

module.exports = mongoose.model('User', UserSchema);
