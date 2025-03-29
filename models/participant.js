const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const participantSchema = new mongoose.Schema({
    mindmap: {
        type: Schema.Types.ObjectId,
        ref: "Mindmap",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    accessLevel: {
        type: String,
        enum: ['owner', 'editor', 'commenter', 'viewer'],
        required: true
    },
    sharedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Participant", participantSchema);