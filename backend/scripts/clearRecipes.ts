import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../src/models/recipe';

dotenv.config();

async function clearRecipes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meal-mate';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const count = await Recipe.countDocuments();
    console.log(`Found ${count} recipes to delete`);

    const result = await Recipe.deleteMany({});
    console.log(`Deleted ${result.deletedCount} recipes`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing recipes:', error);
    process.exit(1);
  }
}

clearRecipes();
