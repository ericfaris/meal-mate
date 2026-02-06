// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 3001;

// Read version from the root version.json
let appVersion = '1.0.0';
let buildNumber = 1;
try {
  const versionFilePath = path.join(__dirname, '..', '..', 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  appVersion = versionData.version || '1.0.0';
  buildNumber = versionData.buildNumber || 1;
} catch (error) {
  console.warn('Could not read version.json, using defaults');
}

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
