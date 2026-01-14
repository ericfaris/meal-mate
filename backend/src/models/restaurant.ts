import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  name: string;
  cuisine?: string;
  priceRange?: 1 | 2 | 3 | 4;
  notes?: string;
  lastVisitedDate?: string; // YYYY-MM-DD format
  visitCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cuisine: {
      type: String,
      trim: true,
    },
    priceRange: {
      type: Number,
      enum: [1, 2, 3, 4],
    },
    notes: {
      type: String,
      trim: true,
    },
    lastVisitedDate: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
restaurantSchema.index({ userId: 1 });
restaurantSchema.index({ userId: 1, householdId: 1 });
restaurantSchema.index({ householdId: 1 });
restaurantSchema.index({ lastVisitedDate: 1 });

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema);