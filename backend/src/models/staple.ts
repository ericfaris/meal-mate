import mongoose, { Schema, Document } from 'mongoose';

export interface IStaple extends Document {
  userId: mongoose.Types.ObjectId;
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

stapleSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<IStaple>('Staple', stapleSchema);
