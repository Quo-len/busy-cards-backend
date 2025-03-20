const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mindmapSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

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

const Mindmap = mongoose.model("Mindmap", mindmapSchema);
const Participant = mongoose.model("Participant", participantSchema);

module.exports = Mindmap;