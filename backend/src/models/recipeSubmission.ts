import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 'pending' | 'approved' | 'denied';

export interface IRecipeSubmission extends Document {
  householdId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  recipeUrl: string;
  status: SubmissionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSubmissionSchema = new Schema<IRecipeSubmission>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipeUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
recipeSubmissionSchema.index({ householdId: 1, status: 1 });
recipeSubmissionSchema.index({ householdId: 1, createdAt: -1 });

const RecipeSubmission = mongoose.model<IRecipeSubmission>('RecipeSubmission', recipeSubmissionSchema);

export default RecipeSubmission;