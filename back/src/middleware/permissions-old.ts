/**
 * Middleware de vérification des permissions granulaires
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Cache pour les permissions d'utilisateur (TTL: 5 minutes)
const userPermissionsCache = new Map<string, { permissions: Set<string>, expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Nettoie le cache des permissions expirées
 */
function cleanPermissionsCache() {
  const now = Date.now();
  for (const [userId, cached] of userPermissionsCache.entries()) {
    if (cached.expires < now) {
      userPermissionsCache.delete(userId);
    }
  }
}

/**
 * Récupère les permissions d'un utilisateur depuis la base de données
 */
async function getUserPermissions(userId: string): Promise<Set<string>> {
  try {
    // Vérifier le cache
    const cached = userPermissionsCache.get(userId);
    if (cached && cached.expires > Date.now()) {
      return cached.permissions;
    }

    // Récupérer depuis la DB
    const userRoles = await prisma.userRole.findMany({
      where: { 
        userId,
        role: { isActive: true }
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions = new Set<string>();
    
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        permissions.add(rolePermission.permission.name);
      }
    }

    // Mettre en cache
    userPermissionsCache.set(userId, {
      permissions,
      expires: Date.now() + CACHE_TTL
    });

    // Nettoyer le cache périodiquement
    if (Math.random() < 0.01) { // 1% de chance
      cleanPermissionsCache();
    }

    return permissions;
  } catch (error) {
    logger.error('Erreur lors de la récupération des permissions utilisateur', {
      userId,
      error: error instanceof Error ? error.message : error
    });
    return new Set<string>();
  }
}

        return next(new AuthorizationError(`Permission requise: ${permission}`));
      }

      next();
    } catch (error) {
      logger.error('Error checking permission', {
        userId: req.user?.id,
        permission,
        error
      });
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier au moins une des permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentification requise'));
      }

      const hasAnyPermission = await PermissionService.hasAnyPermission(req.user.id, permissions);

      if (!hasAnyPermission) {
        logger.warn('Access denied - missing any required permission', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions: permissions,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
        });

        return next(new AuthorizationError(`Au moins une permission requise parmi: ${permissions.join(', ')}`));
      }

      next();
    } catch (error) {
      logger.error('Error checking permissions', {
        userId: req.user?.id,
        permissions,
        error
      });
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier toutes les permissions
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentification requise'));
      }

      const hasAllPermissions = await PermissionService.hasAllPermissions(req.user.id, permissions);

      if (!hasAllPermissions) {
        logger.warn('Access denied - missing required permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermissions: permissions,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
        });

        return next(new AuthorizationError(`Toutes les permissions requises: ${permissions.join(', ')}`));
      }

      next();
    } catch (error) {
      logger.error('Error checking permissions', {
        userId: req.user?.id,
        permissions,
        error
      });
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier les permissions de ressource (CRUD)
 * Combine resource + action pour créer la permission
 */
export const requireResourcePermission = (resource: string, action: string) => {
  const permission = `${resource}.${action}`;
  return requirePermission(permission);
};

/**
 * Middleware pour les permissions dynamiques basées sur les paramètres de la requête
 */
export const requireDynamicPermission = (getPermission: (req: Request) => string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentification requise'));
      }

      const permission = getPermission(req);
      const hasPermission = await PermissionService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        logger.warn('Access denied - missing dynamic permission', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermission: permission,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
        });

        return next(new AuthorizationError(`Permission requise: ${permission}`));
      }

      next();
    } catch (error) {
      logger.error('Error checking dynamic permission', {
        userId: req.user?.id,
        error
      });
      next(error);
    }
  };
};

/**
 * Middleware de permission avec fallback sur les rôles legacy
 * Vérifie d'abord la permission granulaire, puis le rôle legacy
 */
export const requirePermissionOrRole = (permission: string, allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentification requise'));
      }

      // Vérifier d'abord la permission granulaire
      const hasPermission = await PermissionService.hasPermission(req.user.id, permission);
      
      if (hasPermission) {
        return next();
      }

      // Fallback sur le rôle legacy
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      logger.warn('Access denied - missing permission and role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermission: permission,
        allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return next(new AuthorizationError(`Permission '${permission}' ou rôle parmi [${allowedRoles.join(', ')}] requis`));
    } catch (error) {
      logger.error('Error checking permission or role', {
        userId: req.user?.id,
        permission,
        allowedRoles,
        error
      });
      next(error);
    }
  };
};
