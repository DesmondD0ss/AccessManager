import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Types d'erreurs personnalisées pour GAIS
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (code) {
      this.code = code;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs spécialisées
 */
export class ValidationError extends AppError {
  constructor(message: string, _details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflit détecté') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota dépassé') {
    super(message, 429, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Erreur interne du serveur') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

/**
 * Middleware de gestion d'erreurs global
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: any = undefined;

  // Gestion des erreurs personnalisées
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  }
  
  // Gestion des erreurs Prisma
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Cette ressource existe déjà';
        code = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Ressource non trouvée';
        code = 'NOT_FOUND';
        break;
      default:
        statusCode = 400;
        message = 'Erreur de base de données';
        code = 'DATABASE_ERROR';
    }
  }
  
  // Gestion des erreurs de validation Zod
  else if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Données de requête invalides';
    code = 'VALIDATION_ERROR';
    details = (error as any).errors;
  }
  
  // Gestion des erreurs JWT
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token d\'authentification invalide';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token d\'authentification expiré';
    code = 'TOKEN_EXPIRED';
  }
  
  // Gestion des erreurs de syntaxe JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Format JSON invalide';
    code = 'INVALID_JSON';
  }

  // Log de l'erreur
  if (statusCode >= 500) {
    logger.error('Erreur serveur:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
      },
    });
  } else {
    logger.warn('Erreur client:', {
      error: {
        name: error.name,
        message: error.message,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: (req as any).user?.id,
      },
    });
  }

  // Réponse d'erreur
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  // Ajouter les détails en développement
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    if (details) {
      errorResponse.error.details = details;
    }
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper pour les fonctions async dans les routes
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
