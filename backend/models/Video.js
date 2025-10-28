const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  category: {
    type: String,
    required: true,
    lowercase: true
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  }
}, {
  timestamps: true
});

// Index for search and filtering
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
