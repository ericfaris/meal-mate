import mongoose, { Schema, Document } from 'mongoose';

export interface IStaple extends Document {
  userId: mongoose.Types.ObjectId;
  // Household support: staples can be shared across household members
  householdId?: mongoose.Types.ObjectId;
  // Track who added the staple (for display and legacy support)
  addedBy?: mongoose.Types.ObjectId;
  name: string;
  quantity: string;
  category:
    | 'Produce'
    | 'Meat & Seafood'
    | 'Dairy & Eggs'
    | 'Pantry'
    | 'Frozen'
    | 'Bakery'
    | 'Household'
    | 'Other';
  lastUsedAt: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const stapleSchema = new Schema<IStaple>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Household support: staples can be shared across household members
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      index: true,
    },
    // Track who added the staple
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'Produce',
        'Meat & Seafood',
        'Dairy & Eggs',
        'Pantry',
        'Frozen',
        'Bakery',
        'Household',
        'Other',
      ],
      default: 'Other',
    },
    lastUsedAt: { type: Date, default: Date.now },
    usageCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Unique constraint: one staple per name per user (for personal staples)
// or one staple per name per household (for shared staples)
stapleSchema.index({ userId: 1, name: 1 }, { unique: true, sparse: true });
stapleSchema.index({ householdId: 1, name: 1 }, { unique: true, sparse: true });
// For querying household staples
stapleSchema.index({ householdId: 1, usageCount: -1 });

export default mongoose.model<IStaple>('Staple', stapleSchema);
