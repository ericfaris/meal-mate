import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipes';
import recipeImportRoutes from './routes/recipeImport';
import planRoutes from './routes/plans';
import suggestionRoutes from './routes/suggestions';
import imageSearchRoutes from './routes/imageSearch';
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

  // Auth routes (public)
  app.use('/api/auth', authRoutes);

  // Protected API Routes - require authentication
  app.use('/api/recipes', authenticate, recipeRoutes);
  app.use('/api/recipes', authenticate, recipeImportRoutes);
  app.use('/api/plans', authenticate, planRoutes);
  app.use('/api/suggestions', authenticate, suggestionRoutes);
  app.use('/api/images', authenticate, imageSearchRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
};
