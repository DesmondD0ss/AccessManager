import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config/config.js';
import { AuthenticationError, AuthorizationError } from './error-handler.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Extension de l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Types de rôles utilisateur (équivalent aux enums SQLite)
 */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  USER: 'USER',
  GUEST: 'GUEST'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Interface pour l'utilisateur authentifié
 */
export interface AuthenticatedUser {
  id: string;
  email?: string | undefined;
  username?: string | undefined;
  role: string;
  isActive: boolean;
}

/**
 * Payload du JWT
 */
interface JWTPayload {
  userId: string;
  email?: string;
  username?: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware d'authentification JWT
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Token d\'authentification requis');
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      throw new AuthenticationError('Format de token invalide');
    }

    // Vérification du JWT
    const decoded = jwt.verify(token, appConfig.jwt.secret) as JWTPayload;

    // Récupération de l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Compte utilisateur désactivé');
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      ...(user.email && { email: user.email }),
      ...(user.username && { username: user.username }),
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Token d\'authentification invalide'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token d\'authentification expiré'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware de vérification des rôles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentification requise'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Tentative d\'accès non autorisé:', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return next(new AuthorizationError('Droits insuffisants pour accéder à cette ressource'));
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Middleware pour vérifier si l'utilisateur est super admin
 */
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

/**
 * Middleware pour vérifier si l'utilisateur accède à ses propres données
 */
export const requireOwnershipOrAdmin = (userIdField: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentification requise'));
    }

    // Les admins peuvent accéder à toutes les ressources
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Vérifier si l'utilisateur accède à ses propres données
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      logger.warn('Tentative d\'accès à des données d\'un autre utilisateur:', {
        userId: req.user.id,
        targetUserId: resourceUserId,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return next(new AuthorizationError('Accès autorisé uniquement à vos propres données'));
    }

    next();
  };
};

/**
 * Middleware optionnel d'authentification (n'échoue pas si pas de token)
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, appConfig.jwt.secret) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        ...(user.email && { email: user.email }),
        ...(user.username && { username: user.username }),
        role: user.role,
        isActive: user.isActive,
      };
    }

    next();
  } catch (error) {
    // En mode optionnel, on ignore les erreurs d'authentification
    next();
  }
};

/**
 * Utilitaire pour générer un JWT
 */
export const generateJWT = (user: AuthenticatedUser): string => {
  const payload = {
    userId: user.id,
    email: user.email || undefined,
    username: user.username || undefined,
    role: user.role,
  };

  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.expiresIn,
  } as jwt.SignOptions);
};

/**
 * Utilitaire pour générer un refresh token
 */
export const generateRefreshToken = (user: AuthenticatedUser): string => {
  const payload = {
    userId: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, appConfig.jwt.refreshSecret, {
    expiresIn: appConfig.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

/**
 * Utilitaire pour vérifier un refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, appConfig.jwt.refreshSecret) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Type de token invalide');
    }

    return { userId: decoded.userId };
  } catch (error) {
    throw new AuthenticationError('Refresh token invalide');
  }
};

/**
 * Utilitaire pour générer un JWT avec options personnalisées
 */
export const generateCustomJWT = (payload: any, expiresIn: string = '1h'): string => {
  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
};

/**
 * Utilitaire pour vérifier un JWT personnalisé
 */
export const verifyCustomJWT = (token: string): any => {
  try {
    return jwt.verify(token, appConfig.jwt.secret);
  } catch (error) {
    throw new AuthenticationError('Token invalide ou expiré');
  }
};

// ==========================================
// AUTHENTIFICATION INVITÉS
// ==========================================

/**
 * Interface pour les sessions invités
 */
export interface GuestSession {
  id: string;
  accessCodeId: string;
  ipAddress: string;
  status: string;
  dataQuotaMB: number;
  timeQuotaMinutes: number;
  dataConsumedMB: number;
  timeConsumedMinutes: number;
  startedAt: Date;
  expiresAt?: Date;
}

/**
 * Middleware d'authentification pour les invités
 */
export const authenticateGuest = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Token de session invité requis');
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      throw new AuthenticationError('Format de token invalide');
    }

    // Vérification du JWT invité
    const decoded = jwt.verify(token, appConfig.jwt.secret) as any;

    // Vérifier que c'est bien un token invité
    if (decoded.type !== 'guest') {
      throw new AuthenticationError('Type de token invalide');
    }

    // Récupération de la session invité depuis la base de données
    const guestSession = await prisma.guestSession.findUnique({
      where: { 
        id: decoded.sessionId,
        sessionToken: token 
      },
      include: {
        accessCode: {
          select: {
            id: true,
            code: true,
            level: true,
            isActive: true,
            expiresAt: true
          }
        }
      }
    });

    if (!guestSession) {
      throw new AuthenticationError('Session invité non trouvée');
    }

    // Vérifier le statut de la session
    if (guestSession.status !== 'ACTIVE') {
      throw new AuthenticationError('Session invité inactive');
    }

    // Vérifier l'expiration
    if (guestSession.expiresAt && guestSession.expiresAt <= new Date()) {
      // Marquer la session comme expirée
      await prisma.guestSession.update({
        where: { id: guestSession.id },
        data: { 
          status: 'EXPIRED',
          terminatedAt: new Date()
        }
      });
      throw new AuthenticationError('Session invité expirée');
    }

    // Vérifier que le code d'accès est toujours valide
    if (!guestSession.accessCode.isActive || guestSession.accessCode.expiresAt <= new Date()) {
      throw new AuthenticationError('Code d\'accès invalide ou expiré');
    }

    // Mettre à jour la dernière activité
    await prisma.guestSession.update({
      where: { id: guestSession.id },
      data: { lastActivity: new Date() }
    });

    // Attacher les informations de session à la requête
    (req as any).guestSession = {
      id: guestSession.id,
      accessCodeId: guestSession.accessCodeId,
      ipAddress: guestSession.ipAddress,
      status: guestSession.status,
      dataQuotaMB: guestSession.dataQuotaMB,
      timeQuotaMinutes: guestSession.timeQuotaMinutes,
      dataConsumedMB: guestSession.dataConsumedMB,
      timeConsumedMinutes: guestSession.timeConsumedMinutes,
      startedAt: guestSession.startedAt,
      expiresAt: guestSession.expiresAt,
      accessCode: guestSession.accessCode
    };

    logger.debug('Guest session authenticated', {
      sessionId: guestSession.id,
      accessCodeLevel: guestSession.accessCode.level,
      ipAddress: req.ip
    });

    next();
  } catch (error: any) {
    logger.warn('Guest authentication failed', {
      error: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next(error);
  }
};

/**
 * Utilitaire pour générer un token de session invité
 */
export const generateGuestToken = (sessionId: string, expiresIn: string = '24h'): string => {
  const payload = {
    sessionId,
    type: 'guest',
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, appConfig.jwt.secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
};

/**
 * Vérifier les quotas d'une session invité
 */
export const checkGuestQuotas = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guestSession = (req as any).guestSession as GuestSession;
    
    if (!guestSession) {
      throw new AuthenticationError('Session invité requise');
    }

    // Vérifier les quotas de données
    if (guestSession.dataConsumedMB >= guestSession.dataQuotaMB) {
      // Marquer la session comme quota dépassé
      await prisma.guestSession.update({
        where: { id: guestSession.id },
        data: { 
          status: 'QUOTA_EXCEEDED',
          terminatedAt: new Date()
        }
      });
      throw new AuthorizationError('Quota de données dépassé');
    }

    // Vérifier les quotas de temps
    const sessionDurationMinutes = Math.floor((Date.now() - guestSession.startedAt.getTime()) / (1000 * 60));
    if (sessionDurationMinutes >= guestSession.timeQuotaMinutes) {
      // Marquer la session comme quota dépassé
      await prisma.guestSession.update({
        where: { id: guestSession.id },
        data: { 
          status: 'QUOTA_EXCEEDED',
          terminatedAt: new Date()
        }
      });
      throw new AuthorizationError('Quota de temps dépassé');
    }

    next();
  } catch (error: any) {
    logger.warn('Guest quota check failed', {
      error: error.message,
      sessionId: (req as any).guestSession?.id,
      ipAddress: req.ip
    });
    
    next(error);
  }
};
