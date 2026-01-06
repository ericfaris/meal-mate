import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Plan from './src/models/plan';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

async function deletePlans() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    const result = await Plan.deleteMany({});
    console.log(`Deleted ${result.deletedCount} plans from the database`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error deleting plans:', error);
    process.exit(1);
  }
}

deletePlans();
