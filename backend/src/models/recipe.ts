import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
  ingredientsText: string;
  directionsText: string;
  notes?: string;
  tags: string[];
  lastUsedDate?: Date;
  complexity?: 'simple' | 'medium' | 'complex';
  isVegetarian: boolean;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    ingredientsText: {
      type: String,
      required: false,
    },
    directionsText: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    lastUsedDate: {
      type: Date,
    },
    complexity: {
      type: String,
      enum: ['simple', 'medium', 'complex'],
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    prepTime: {
      type: Number,
    },
    cookTime: {
      type: Number,
    },
    servings: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for searching
recipeSchema.index({ userId: 1, title: 'text' });
recipeSchema.index({ userId: 1, tags: 1 });
recipeSchema.index({ userId: 1, lastUsedDate: 1 });

export default mongoose.model<IRecipe>('Recipe', recipeSchema);
