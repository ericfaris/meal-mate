// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './config/db';
import { readVersionInfo } from './utils/version';

const PORT = process.env.PORT || 3001;
const { version: appVersion, buildNumber } = readVersionInfo();

const startServer = async () => {
  try {
    // Validate required environment variables before starting
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
      process.exit(1);
    }

    // Log version info at startup
    console.log(`\n🍽️  Meal Mate Backend v${appVersion} (build ${buildNumber})`);
    console.log('━'.repeat(50));

    // Connect to MongoDB
    await connectDB();

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('━'.repeat(50) + '\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
