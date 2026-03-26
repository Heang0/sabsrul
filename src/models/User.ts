import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  avatar: string | null;
  bio: string;
  role: 'user' | 'admin';
  firebaseUid: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetConfirmToken?: string;
  resetConfirmExpires?: Date;
  watchLater: mongoose.Types.ObjectId[];
  favorites: mongoose.Types.ObjectId[];
  likedVideos: mongoose.Types.ObjectId[];
  watchHistory: {
    video: mongoose.Types.ObjectId;
    watchedAt: Date;
    progress: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      validate: {
        validator: function (username: string) {
          return /^[a-zA-Z0-9_]+$/.test(username);
        },
        message: 'Username can only contain letters, numbers, and underscores',
      },
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetConfirmToken: String,
    resetConfirmExpires: Date,
    watchLater: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    likedVideos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    watchHistory: [
      {
        video: {
          type: Schema.Types.ObjectId,
          ref: 'Video',
        },
        watchedAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for case-insensitive username lookup
userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
