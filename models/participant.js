const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const participantSchema = new Schema({
    mindmap: {
        type: Schema.Type.ObjectId,
        ref: "Mindmap",
        required: true
    },
    user: {
        type: Schema.Type.ObjectId,
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

const Participant = mongoose.model("Participant", participantSchema);

module.exports = Participant;