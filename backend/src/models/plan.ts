import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  recipeId?: mongoose.Types.ObjectId;
  label?: string; // "Eat out", "Leftovers", etc.
  isConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
    },
    label: {
      type: String,
      trim: true,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: each user can only have one plan per date
planSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IPlan>('Plan', planSchema);
