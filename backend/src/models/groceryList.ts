import mongoose, { Schema, Document } from 'mongoose';

export interface IGroceryItem {
  name: string;
  quantity: string;
  category: 'Produce' | 'Meat & Seafood' | 'Dairy & Eggs' | 'Pantry' | 'Frozen' | 'Bakery' | 'Household' | 'Other';
  recipeIds: mongoose.Types.ObjectId[];
  recipeNames: string[];
  isChecked: boolean;
  originalTexts: string[];
}

export interface IGroceryList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  status: 'active' | 'archived';
  startDate: string;
  endDate: string;
  planIds: mongoose.Types.ObjectId[];
  items: IGroceryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const groceryItemSchema = new Schema<IGroceryItem>(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Bakery', 'Household', 'Other'],
      default: 'Other',
    },
    recipeIds: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
    recipeNames: [{ type: String }],
    isChecked: { type: Boolean, default: false },
    originalTexts: [{ type: String }],
  },
  { _id: false }
);

const groceryListSchema = new Schema<IGroceryList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    endDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    planIds: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],
    items: [groceryItemSchema],
  },
  {
    timestamps: true,
  }
);

groceryListSchema.index({ userId: 1, status: 1 });
groceryListSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IGroceryList>('GroceryList', groceryListSchema);
