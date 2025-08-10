/**
 * Service de gestion des permissions
 * Gère la vérification des permissions et l'attribution des rôles
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { PermissionUtils, PERMISSIONS, ROLE_PERMISSIONS, Permission } from '../models/permissions.js';

const prisma = new PrismaClient();

export class PermissionService {
  /**
   * Obtient toutes les permissions d'un utilisateur
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Récupérer l'utilisateur avec ses rôles personnalisés
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
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
          }
        }
      });

      if (!user) {
        return [];
      }

      const permissions: string[] = [];

      // Ajouter les permissions du rôle principal (legacy)
      const legacyPermissions = PermissionUtils.getPermissionsForRole(user.role);
      permissions.push(...legacyPermissions);

      // Ajouter les permissions des rôles personnalisés
      if (user.userRoles) {
        user.userRoles.forEach((userRole: any) => {
          if (userRole.role && userRole.role.rolePermissions) {
            userRole.role.rolePermissions.forEach((rolePermission: any) => {
              if (rolePermission.permission) {
                permissions.push(rolePermission.permission.name);
              }
            });
          }
        });
      }

      // Supprimer les doublons
      return [...new Set(permissions)];
    } catch (error) {
      logger.error('Error getting user permissions', { userId, error });
      return [];
    }
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return PermissionUtils.hasPermission(userPermissions, permission);
  }

  /**
   * Vérifie si un utilisateur a au moins une des permissions requises
   */
  static async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return PermissionUtils.hasAnyPermission(userPermissions, permissions);
  }

  /**
   * Vérifie si un utilisateur a toutes les permissions requises
   */
  static async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return PermissionUtils.hasAllPermissions(userPermissions, permissions);
  }

  /**
   * Crée un nouveau rôle personnalisé
   */
  static async createCustomRole(data: {
    name: string;
    description: string;
    permissions: string[];
    createdBy: string;
  }): Promise<any> {
    try {
      // Vérifier que toutes les permissions existent
      const validPermissions = PERMISSIONS.map(p => p.id);
      const invalidPermissions = data.permissions.filter(p => !validPermissions.includes(p));
      
      if (invalidPermissions.length > 0) {
        throw new Error(`Permissions invalides: ${invalidPermissions.join(', ')}`);
      }

      // Créer le rôle
      const role = await prisma.customRole.create({
        data: {
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          isActive: true
        }
      });

      // Ajouter les permissions au rôle
      const rolePermissions = data.permissions.map(permissionId => ({
        roleId: role.id,
        permissionId: permissionId
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions
      });

      logger.info('Custom role created', {
        roleId: role.id,
        name: data.name,
        permissions: data.permissions,
        createdBy: data.createdBy
      });

      return role;
    } catch (error) {
      logger.error('Error creating custom role', { data, error });
      throw error;
    }
  }

  /**
   * Assigne un rôle personnalisé à un utilisateur
   */
  static async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<void> {
    try {
      // Vérifier que l'utilisateur et le rôle existent
      const [user, role] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.customRole.findUnique({ where: { id: roleId } })
      ]);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      if (!role) {
        throw new Error('Rôle non trouvé');
      }

      // Vérifier si l'utilisateur a déjà ce rôle
      const existingUserRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: roleId
          }
        }
      });

      if (existingUserRole) {
        throw new Error('L\'utilisateur a déjà ce rôle');
      }

      // Assigner le rôle
      await prisma.userRole.create({
        data: {
          userId: userId,
          roleId: roleId,
          assignedBy: assignedBy,
          assignedAt: new Date()
        }
      });

      logger.info('Role assigned to user', {
        userId,
        roleId,
        roleName: role.name,
        assignedBy
      });
    } catch (error) {
      logger.error('Error assigning role to user', { userId, roleId, assignedBy, error });
      throw error;
    }
  }

  /**
   * Retire un rôle personnalisé d'un utilisateur
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: roleId
          }
        }
      });

      logger.info('Role removed from user', { userId, roleId });
    } catch (error) {
      logger.error('Error removing role from user', { userId, roleId, error });
      throw error;
    }
  }

  /**
   * Obtient tous les rôles personnalisés
   */
  static async getCustomRoles(): Promise<any[]> {
    try {
      return await prisma.customRole.findMany({
        where: { isActive: true },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          },
          createdByUser: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              userRoles: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      logger.error('Error getting custom roles', { error });
      throw error;
    }
  }

  /**
   * Met à jour les permissions d'un rôle personnalisé
   */
  static async updateRolePermissions(roleId: string, permissions: string[], updatedBy: string): Promise<void> {
    try {
      // Vérifier que toutes les permissions existent
      const validPermissions = PERMISSIONS.map(p => p.id);
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      
      if (invalidPermissions.length > 0) {
        throw new Error(`Permissions invalides: ${invalidPermissions.join(', ')}`);
      }

      // Supprimer toutes les permissions existantes du rôle
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleId }
      });

      // Ajouter les nouvelles permissions
      const rolePermissions = permissions.map(permissionId => ({
        roleId: roleId,
        permissionId: permissionId
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions
      });

      // Mettre à jour le rôle
      await prisma.customRole.update({
        where: { id: roleId },
        data: {
          updatedAt: new Date(),
          updatedBy: updatedBy
        }
      });

      logger.info('Role permissions updated', {
        roleId,
        permissions,
        updatedBy
      });
    } catch (error) {
      logger.error('Error updating role permissions', { roleId, permissions, updatedBy, error });
      throw error;
    }
  }

  /**
   * Obtient toutes les permissions disponibles organisées par catégorie
   */
  static getAvailablePermissions(): { [key: string]: Permission[] } {
    const permissionsByCategory: { [key: string]: Permission[] } = {};

    PERMISSIONS.forEach(permission => {
      if (!permissionsByCategory[permission.category]) {
        permissionsByCategory[permission.category] = [];
      }
      permissionsByCategory[permission.category].push(permission);
    });

    return permissionsByCategory;
  }

  /**
   * Initialise les permissions système (à appeler au démarrage)
   */
  static async initializePermissions(): Promise<void> {
    try {
      // Créer les permissions qui n'existent pas encore
      for (const permission of PERMISSIONS) {
        const existingPermission = await prisma.permission.findUnique({
          where: { name: permission.id }
        });

        if (!existingPermission) {
          await prisma.permission.create({
            data: {
              name: permission.id,
              displayName: permission.name,
              description: permission.description,
              resource: permission.resource,
              action: permission.action,
              category: permission.category
            }
          });
        }
      }

      logger.info('Permissions initialized successfully');
    } catch (error) {
      logger.error('Error initializing permissions', { error });
      throw error;
    }
  }
}
