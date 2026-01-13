import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type AuthProvider = 'local' | 'google' | 'apple';

export interface IOAuthToken {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  householdId?: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  authProvider: AuthProvider;
  providerId?: string;
  oauthTokens?: IOAuthToken;
  profilePicture?: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  updateOAuthTokens(tokens: IOAuthToken): Promise<void>;
}

const oauthTokenSchema = new Schema<IOAuthToken>(
  {
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false, // Not required for OAuth users
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      default: null,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
      required: true,
    },
    providerId: {
      type: String,
      sparse: true,
      index: true,
    },
    oauthTokens: {
      type: oauthTokenSchema,
      default: null,
    },
    profilePicture: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
userSchema.index({ householdId: 1 });

// Hash password before saving (only for local auth users)
userSchema.pre('save', async function (next) {
  // Skip if no password or password not modified
  if (!this.passwordHash || !this.isModified('passwordHash')) {
    return next();
  }

  // Only hash if it's a local user and password is being set
  if (this.authProvider === 'local') {
    try {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Compare password method (only for local auth users)
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(password, this.passwordHash);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function (): string {
  const payload = {
    id: this._id,
    email: this.email,
    name: this.name,
    householdId: this.householdId,
    role: this.role,
    authProvider: this.authProvider,
  };

  const secret = process.env.JWT_SECRET || 'meal-mate-secret-key';

  return jwt.sign(payload, secret, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days in seconds
};

// Update OAuth tokens
userSchema.methods.updateOAuthTokens = async function (tokens: IOAuthToken): Promise<void> {
  this.oauthTokens = {
    ...this.oauthTokens,
    ...tokens,
  };
  this.lastLoginAt = new Date();
  await this.save();
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.oauthTokens;
  return obj;
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
