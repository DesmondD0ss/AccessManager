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

/**
 * Middleware pour vérifier si l'utilisateur a une permission spécifique
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      // Super admin a tous les droits
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const userPermissions = await getUserPermissions(user.id);
      
      if (!userPermissions.has(permission)) {
        logger.warn('Accès refusé - Permission manquante', {
          userId: user.id,
          username: user.username,
          requiredPermission: permission,
          userPermissions: Array.from(userPermissions)
        });
        
        return res.status(403).json({
          success: false,
          message: 'Permission insuffisante',
          required: permission
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur dans requirePermission middleware', {
        permission,
        error: error instanceof Error ? error.message : error
      });
      
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };
}

/**
 * Middleware pour vérifier si l'utilisateur a au moins une des permissions spécifiées
 */
export function requireAnyPermission(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      // Super admin a tous les droits
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const userPermissions = await getUserPermissions(user.id);
      
      const hasPermission = permissions.some(permission => userPermissions.has(permission));
      
      if (!hasPermission) {
        logger.warn('Accès refusé - Aucune permission requise', {
          userId: user.id,
          username: user.username,
          requiredPermissions: permissions,
          userPermissions: Array.from(userPermissions)
        });
        
        return res.status(403).json({
          success: false,
          message: 'Permission insuffisante',
          required: permissions
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur dans requireAnyPermission middleware', {
        permissions,
        error: error instanceof Error ? error.message : error
      });
      
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };
}

/**
 * Middleware pour vérifier si l'utilisateur a toutes les permissions spécifiées
 */
export function requireAllPermissions(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      // Super admin a tous les droits
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      const userPermissions = await getUserPermissions(user.id);
      
      const hasAllPermissions = permissions.every(permission => userPermissions.has(permission));
      
      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(permission => !userPermissions.has(permission));
        
        logger.warn('Accès refusé - Permissions manquantes', {
          userId: user.id,
          username: user.username,
          requiredPermissions: permissions,
          missingPermissions,
          userPermissions: Array.from(userPermissions)
        });
        
        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes',
          required: permissions,
          missing: missingPermissions
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur dans requireAllPermissions middleware', {
        permissions,
        error: error instanceof Error ? error.message : error
      });
      
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };
}

/**
 * Utilitaire pour invalider le cache des permissions d'un utilisateur
 */
export function invalidateUserPermissionsCache(userId: string) {
  userPermissionsCache.delete(userId);
  logger.debug('Cache des permissions invalidé pour l\'utilisateur', { userId });
}

/**
 * Utilitaire pour vider complètement le cache des permissions
 */
export function clearPermissionsCache() {
  userPermissionsCache.clear();
  logger.debug('Cache des permissions vidé complètement');
}

/**
 * Récupère les permissions d'un utilisateur (utilitaire public)
 */
export async function getPermissionsForUser(userId: string): Promise<string[]> {
  const permissions = await getUserPermissions(userId);
  return Array.from(permissions);
}
