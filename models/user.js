const mongoose = require('mongoose');
const Mindmap = require('./mindmap');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        default: function () {
            return this.email;
        }
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    info: {
        type: String,
        default: 'No information'
    },
    lastLogin: Date
});

UserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await Mindmap.deleteMany({ userId: this._id });
    next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;