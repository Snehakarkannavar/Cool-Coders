import mongoose, { Schema, Document } from 'mongoose';

// User Interface
export interface IUser extends Document {
  email: string;
  name?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: Date,
});

// Indexes
UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
