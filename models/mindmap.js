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

const Mindmap = mongoose.model("Mindmap", mindmapSchema);

module.exports = Mindmap;