import mongoose, { Document, Schema } from 'mongoose';

export interface IUserInteraction extends Document {
  user: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  liked: boolean;
  watchLater: boolean;
  favorite: boolean;
  watched: boolean;
  watchTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const userInteractionSchema = new Schema<IUserInteraction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    liked: {
      type: Boolean,
      default: false,
    },
    watchLater: {
      type: Boolean,
      default: false,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    watched: {
      type: Boolean,
      default: false,
    },
    watchTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one interaction per user-video combination
userInteractionSchema.index({ user: 1, video: 1 }, { unique: true });

const UserInteraction =
  mongoose.models.UserInteraction || mongoose.model<IUserInteraction>('UserInteraction', userInteractionSchema);

export default UserInteraction;
