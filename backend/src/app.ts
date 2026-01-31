import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipes';
import recipeImportRoutes from './routes/recipeImport';
import planRoutes from './routes/plans';
import suggestionRoutes from './routes/suggestions';
import imageSearchRoutes from './routes/imageSearch';
import householdRoutes from './routes/household';
import recipeSubmissionRoutes from './routes/recipeSubmission';
import userRoutes from './routes/user';
import groceryListRoutes from './routes/groceryList';
import stapleRoutes from './routes/staples';
import storeRoutes from './routes/stores';
import { authenticate } from './middleware/auth';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Health check (public)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Version endpoint (public)
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({
      version: process.env.APP_VERSION || '1.0.0',
      buildNumber: parseInt(process.env.BUILD_NUMBER || '1', 10),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Auth routes (public)
  app.use('/api/auth', authRoutes);

  // Protected API Routes - require authentication
  app.use('/api/recipes', authenticate, recipeRoutes);
  app.use('/api/recipes', authenticate, recipeImportRoutes);
  app.use('/api/plans', authenticate, planRoutes);
  app.use('/api/suggestions', authenticate, suggestionRoutes);
  app.use('/api/images', authenticate, imageSearchRoutes);
  app.use('/api/household', authenticate, householdRoutes);
  app.use('/api/submissions', authenticate, recipeSubmissionRoutes);
  app.use('/api/users', authenticate, userRoutes);
  app.use('/api/grocery-lists', authenticate, groceryListRoutes);
  app.use('/api/staples', authenticate, stapleRoutes);
  app.use('/api/stores', authenticate, storeRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
};
