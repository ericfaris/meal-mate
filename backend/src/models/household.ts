import mongoose, { Document, Schema } from 'mongoose';

export interface IHousehold extends Document {
  name: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const householdSchema = new Schema<IHousehold>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient member lookups
householdSchema.index({ members: 1 });
householdSchema.index({ createdBy: 1 });

const Household = mongoose.model<IHousehold>('Household', householdSchema);

export default Household;
