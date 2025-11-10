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
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => Math.random().toString(36).substr(2, 9)
  },
  videoUrl: {
    type: String,
    required: true
  },
  qualities: {
    '1080': { type: String },
    '720': { type: String },  
    '480': { type: String },
    '360': { type: String }
  },
  originalQuality: {
    type: String,
    enum: ['360', '480', '720', '1080'],
    default: '480'
  },
  thumbnail: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
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
  // ADD: Track which users liked this video
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  originalFileSize: {
    type: Number,
    required: false
  },
  thumbnails: [{ type: String }],
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  // ADD: Uploaded by user/admin
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for search and filtering
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);