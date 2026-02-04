import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  name: string;
  householdId?: string;
  role: string;
}

/**
 * Authentication middleware - requires valid JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const secret = process.env.JWT_SECRET || 'meal-mate-secret-key';

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Optionally fetch full user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'Invalid token. User not found.' });
      return;
    }

    req.user = user;
    req.userId = decoded.id;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired. Please login again.' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

/**
 * Require user to be a member of a household
 * Must be used after authenticate middleware
 */
export const requireHousehold = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!req.user.householdId) {
      res.status(403).json({ error: 'You must be in a household to access this resource.' });
      return;
    }

    next();
  } catch (error) {
    console.error('Household check error:', error);
    res.status(500).json({ error: 'Failed to verify household membership.' });
  }
};

/**
 * Require user to have admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can perform this action.' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin role.' });
  }
};

/**
 * Require admin role only if user is in a household.
 * Users not in a household can proceed (personal use).
 * Must be used after authenticate middleware.
 */
export const requireAdminIfInHousehold = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // If user is in a household, require admin role
    if (req.user.householdId && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Only household admins can perform this action.' });
      return;
    }

    // User is either not in household (personal use) or is admin
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin role.' });
  }
};

/**
 * Optional authentication middleware - allows both authenticated and unauthenticated requests
 * Sets req.user if valid token is provided, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'meal-mate-secret-key';

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = user;
      req.userId = decoded.id;
    }

    next();
  } catch {
    // Token invalid or expired, continue without user
    next();
  }
};
