const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FavoriteSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mindmapId: {
        type: Schema.Types.ObjectId,
        ref: "Mindmap",
        required: true
    }
});

module.exports = mongoose.model("Participant, participantSchema);