import { Request, Response } from 'express';

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} non trouvée`,
      timestamp: new Date().toISOString(),
    },
  });
};
