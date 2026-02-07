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

// Note: Email index is automatically created by unique: true on the email field
// No need for explicit index creation

export const User = mongoose.model<IUser>('User', UserSchema);
