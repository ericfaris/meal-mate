import mongoose from 'mongoose';
import Plan from './src/models/plan';

const MONGODB_URI = 'mongodb+srv://meal-mate-admin:REDACTED@cluster0.blwxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function deletePlans() {
  try {
    await mongoose.connect(MONGODB_URI);
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
