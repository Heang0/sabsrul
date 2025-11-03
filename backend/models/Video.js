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
  // ADD THIS - shortId field
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => Math.random().toString(36).substr(2, 9) // Auto-generate if not provided
  },
  // MAIN video URL (for backward compatibility)
  videoUrl: {
    type: String,
    required: true
  },
  // MULTIPLE QUALITY URLs
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
  }
}, {
  timestamps: true
});

// Index for search and filtering
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1, createdAt: -1 });

// FIX THIS LINE - change VideoSchema to videoSchema
module.exports = mongoose.model('Video', videoSchema); // ✅ CORRECT