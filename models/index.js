const mongoose = require('mongoose');
const User = require('./User');
const Mindmap = require('./Mindmap');
const Participant = require('./Participant');
const Favorite = require('./Favorite');
const Invitation = require('./Invitation');

// Define the pre middleware here to avoid circular dependencies
if (mongoose.models.User) {
	mongoose.models.User.schema.pre('deleteOne', { document: true, query: false }, async function (next) {
		await mongoose.models.Mindmap.deleteMany({ owner: this._id });
		next();
	});
}

module.exports = {
	User,
	Mindmap,
	Participant,
	Favorite,
	Invitation,
};
