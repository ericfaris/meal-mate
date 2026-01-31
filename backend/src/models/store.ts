import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  categoryOrder: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    categoryOrder: {
      type: [String],
      default: ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Bakery', 'Household', 'Other'],
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

storeSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<IStore>('Store', storeSchema);
