import { Request, Response, NextFunction } from 'express';

// Custom interface to extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to authenticate users
 * In a real implementation, this would verify JWT tokens or session cookies
 * For now, it's a simple middleware that attaches a mock user to the request
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // In a real implementation, this would verify authentication
  // For now, just attach a mock user
  req.user = {
    id: 1, // Default user ID
    name: 'Demo User',
    email: 'user@example.com'
  };
  
  next();
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user exists (should be set by requireAuth)
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // In a real implementation, check admin status
  // For now, assume user ID 1 is an admin
  if (req.user.id === 1) {
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required' });
  }
};
