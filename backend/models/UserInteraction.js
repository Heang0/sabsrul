const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    liked: {
        type: Boolean,
        default: false
    },
    watchLater: {
        type: Boolean,
        default: false
    },
    favorite: {
        type: Boolean,
        default: false
    },
    watched: {
        type: Boolean,
        default: false
    },
    watchTime: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Ensure one interaction per user-video combination
userInteractionSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model('UserInteraction', userInteractionSchema);