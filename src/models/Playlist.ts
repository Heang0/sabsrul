import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description: string;
  isPublic: boolean;
  user: mongoose.Types.ObjectId;
  videos: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better performance
playlistSchema.index({ user: 1, updatedAt: -1 });

const Playlist = mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', playlistSchema);

export default Playlist;
