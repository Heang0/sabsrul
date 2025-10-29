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
  // MAIN video URL (for backward compatibility)
  videoUrl: {
    type: String,
    required: true
  },
  // MULTIPLE QUALITY URLs - ADD THIS
  qualities: {
    '1080': { type: String },  // 1080p URL
    '720': { type: String },   // 720p URL  
    '480': { type: String },   // 480p URL
    '360': { type: String }    // 360p URL
  },
  // Store the original video resolution
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
  thumbnails: [{ type: String }],
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  },
  fileSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search and filtering
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);