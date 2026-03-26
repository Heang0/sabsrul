import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description: string;
  shortId: string;
  videoUrl: string;
  qualities: {
    '1080'?: string;
    '720'?: string;
    '480'?: string;
    '360'?: string;
  };
  originalQuality: '360' | '480' | '720' | '1080';
  thumbnail: string;
  duration: number;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  originalFileSize?: number;
  thumbnails: string[];
  status: 'published' | 'draft';
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  comments?: Array<{
    user: mongoose.Types.ObjectId;
    username: string;
    avatar?: string;
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    shortId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => Math.random().toString(36).substr(2, 9),
    },
    videoUrl: {
      type: String,
      required: true,
    },
    qualities: {
      '1080': { type: String },
      '720': { type: String },
      '480': { type: String },
      '360': { type: String },
    },
    originalQuality: {
      type: String,
      enum: ['360', '480', '720', '1080'],
      default: '480',
    },
    thumbnail: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
    },
    tags: [String],
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    originalFileSize: {
      type: Number,
    },
    thumbnails: [String],
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        avatar: String,
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ category: 1, createdAt: -1 });

const Video = mongoose.models.Video || mongoose.model<IVideo>('Video', videoSchema);

export default Video;
