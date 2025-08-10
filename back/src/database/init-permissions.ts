/**
 * Script d'initialisation du système de permissions granulaires
 * Crée les rôles et permissions de base pour l'application
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Définition des permissions de base
const DEFAULT_PERMISSIONS = [
  // Permissions utilisateurs
  { name: 'users:read', displayName: 'Voir utilisateurs', description: 'Voir les utilisateurs', resource: 'users', action: 'read', category: 'users' },
  { name: 'users:create', displayName: 'Créer utilisateurs', description: 'Créer des utilisateurs', resource: 'users', action: 'create', category: 'users' },
  { name: 'users:update', displayName: 'Modifier utilisateurs', description: 'Modifier des utilisateurs', resource: 'users', action: 'update', category: 'users' },
  { name: 'users:delete', displayName: 'Supprimer utilisateurs', description: 'Supprimer des utilisateurs', resource: 'users', action: 'delete', category: 'users' },
  { name: 'users:manage_roles', displayName: 'Gérer rôles', description: 'Gérer les rôles utilisateurs', resource: 'users', action: 'manage_roles', category: 'users' },

  // Permissions sessions
  { name: 'sessions:read', displayName: 'Voir sessions', description: 'Voir les sessions', resource: 'sessions', action: 'read', category: 'sessions' },
  { name: 'sessions:create', displayName: 'Créer sessions', description: 'Créer des sessions', resource: 'sessions', action: 'create', category: 'sessions' },
  { name: 'sessions:update', displayName: 'Modifier sessions', description: 'Modifier des sessions', resource: 'sessions', action: 'update', category: 'sessions' },
  { name: 'sessions:delete', displayName: 'Supprimer sessions', description: 'Supprimer des sessions', resource: 'sessions', action: 'delete', category: 'sessions' },
  { name: 'sessions:terminate', displayName: 'Terminer sessions', description: 'Terminer des sessions', resource: 'sessions', action: 'terminate', category: 'sessions' },

  // Permissions quotas
  { name: 'quotas:read', displayName: 'Voir quotas', description: 'Voir les quotas', resource: 'quotas', action: 'read', category: 'quotas' },
  { name: 'quotas:create', displayName: 'Créer quotas', description: 'Créer des quotas', resource: 'quotas', action: 'create', category: 'quotas' },
  { name: 'quotas:update', displayName: 'Modifier quotas', description: 'Modifier des quotas', resource: 'quotas', action: 'update', category: 'quotas' },
  { name: 'quotas:delete', displayName: 'Supprimer quotas', description: 'Supprimer des quotas', resource: 'quotas', action: 'delete', category: 'quotas' },
  { name: 'quotas:reset', displayName: 'Réinitialiser quotas', description: 'Réinitialiser des quotas', resource: 'quotas', action: 'reset', category: 'quotas' },

  // Permissions réseau
  { name: 'network:read', displayName: 'Voir réseau', description: 'Voir les règles réseau', resource: 'network', action: 'read', category: 'network' },
  { name: 'network:create', displayName: 'Créer règles réseau', description: 'Créer des règles réseau', resource: 'network', action: 'create', category: 'network' },
  { name: 'network:update', displayName: 'Modifier réseau', description: 'Modifier des règles réseau', resource: 'network', action: 'update', category: 'network' },
  { name: 'network:delete', displayName: 'Supprimer réseau', description: 'Supprimer des règles réseau', resource: 'network', action: 'delete', category: 'network' },

  // Permissions statistiques
  { name: 'statistics:read', displayName: 'Voir statistiques', description: 'Voir les statistiques', resource: 'statistics', action: 'read', category: 'statistics' },
  { name: 'statistics:export', displayName: 'Exporter statistiques', description: 'Exporter les statistiques', resource: 'statistics', action: 'export', category: 'statistics' },

  // Permissions audit
  { name: 'audit:read', displayName: 'Voir audit', description: 'Voir les logs d\'audit', resource: 'audit', action: 'read', category: 'audit' },
  { name: 'audit:export', displayName: 'Exporter audit', description: 'Exporter les logs d\'audit', resource: 'audit', action: 'export', category: 'audit' },

  // Permissions système
  { name: 'system:read', displayName: 'Voir système', description: 'Voir les informations système', resource: 'system', action: 'read', category: 'system' },
  { name: 'system:update', displayName: 'Modifier système', description: 'Modifier la configuration système', resource: 'system', action: 'update', category: 'system' },
  { name: 'system:maintenance', displayName: 'Mode maintenance', description: 'Mode maintenance', resource: 'system', action: 'maintenance', category: 'system' },
  { name: 'system:logs', displayName: 'Logs système', description: 'Accès aux logs système', resource: 'system', action: 'logs', category: 'system' },

  // Permissions invités
  { name: 'guests:read', displayName: 'Voir invités', description: 'Voir les invités', resource: 'guests', action: 'read', category: 'guests' },
  { name: 'guests:create', displayName: 'Créer codes invités', description: 'Créer des codes d\'accès invités', resource: 'guests', action: 'create', category: 'guests' },
  { name: 'guests:update', displayName: 'Modifier invités', description: 'Modifier des codes d\'accès invités', resource: 'guests', action: 'update', category: 'guests' },
  { name: 'guests:delete', displayName: 'Supprimer invités', description: 'Supprimer des codes d\'accès invités', resource: 'guests', action: 'delete', category: 'guests' },

  // Permissions rôles et permissions
  { name: 'roles:read', displayName: 'Voir rôles', description: 'Voir les rôles', resource: 'roles', action: 'read', category: 'roles' },
  { name: 'roles:create', displayName: 'Créer rôles', description: 'Créer des rôles', resource: 'roles', action: 'create', category: 'roles' },
  { name: 'roles:update', displayName: 'Modifier rôles', description: 'Modifier des rôles', resource: 'roles', action: 'update', category: 'roles' },
  { name: 'roles:delete', displayName: 'Supprimer rôles', description: 'Supprimer des rôles', resource: 'roles', action: 'delete', category: 'roles' },
  { name: 'permissions:read', displayName: 'Voir permissions', description: 'Voir les permissions', resource: 'permissions', action: 'read', category: 'permissions' },
  { name: 'permissions:manage', displayName: 'Gérer permissions', description: 'Gérer les permissions', resource: 'permissions', action: 'manage', category: 'permissions' }
];

// Définition des rôles par défaut avec leurs permissions
const DEFAULT_ROLES = [
  {
    name: 'user',
    displayName: 'Utilisateur',
    description: 'Utilisateur standard avec accès limité',
    isSystem: true,
    permissions: [
      'sessions:read', 'sessions:create', 'quotas:read'
    ]
  },
  {
    name: 'moderator',
    displayName: 'Modérateur',
    description: 'Modérateur avec permissions étendues',
    isSystem: true,
    permissions: [
      'users:read', 'sessions:read', 'sessions:update', 'sessions:terminate',
      'quotas:read', 'quotas:update', 'network:read', 'statistics:read',
      'audit:read', 'guests:read', 'guests:create', 'guests:update'
    ]
  },
  {
    name: 'admin',
    displayName: 'Administrateur',
    description: 'Administrateur avec permissions complètes',
    isSystem: true,
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'sessions:read', 'sessions:create', 'sessions:update', 'sessions:delete', 'sessions:terminate',
      'quotas:read', 'quotas:create', 'quotas:update', 'quotas:delete', 'quotas:reset',
      'network:read', 'network:create', 'network:update', 'network:delete',
      'statistics:read', 'statistics:export',
      'audit:read', 'audit:export',
      'system:read', 'system:update', 'system:logs',
      'guests:read', 'guests:create', 'guests:update', 'guests:delete',
      'roles:read', 'permissions:read'
    ]
  },
  {
    name: 'super_admin',
    displayName: 'Super Administrateur',
    description: 'Super administrateur avec tous les droits',
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map(p => p.name) // Toutes les permissions
  }
];

/**
 * Initialise le système de permissions
 */
export async function initializePermissions() {
  try {
    logger.info('🚀 Initialisation du système de permissions...');

    // Vérifier s'il existe déjà un utilisateur système pour créer les rôles
    let systemUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'SUPER_ADMIN' },
          { username: 'system' }
        ]
      }
    });

    // Si aucun utilisateur système n'existe, créer un utilisateur système temporaire
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@localhost',
          role: 'SUPER_ADMIN',
          isActive: true,
          hashedPassword: 'system' // Sera désactivé plus tard
        }
      });
      logger.info('👤 Utilisateur système créé');
    }

    // 1. Créer les permissions
    logger.info('📝 Création des permissions...');
    for (const permission of DEFAULT_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {
          description: permission.description,
          resource: permission.resource
        },
        create: permission
      });
    }
    logger.info(`✅ ${DEFAULT_PERMISSIONS.length} permissions créées/mises à jour`);

    // 2. Créer les rôles
    logger.info('👥 Création des rôles...');
    for (const roleData of DEFAULT_ROLES) {
      const { permissions, ...roleInfo } = roleData;
      
      const role = await prisma.customRole.upsert({
        where: { name: roleData.name },
        update: {
          displayName: roleInfo.displayName,
          description: roleInfo.description,
          isSystem: roleInfo.isSystem
        },
        create: roleInfo
      });

      // 3. Associer les permissions au rôle
      logger.info(`🔗 Association des permissions au rôle ${role.displayName}...`);
      
      // Supprimer les associations existantes
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Créer les nouvelles associations
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }
    logger.info(`✅ ${DEFAULT_ROLES.length} rôles créés/mis à jour avec leurs permissions`);

    // 4. Migrer les utilisateurs existants vers le nouveau système
    logger.info('🔄 Migration des utilisateurs vers le nouveau système de rôles...');
    const users = await prisma.user.findMany({
      include: { userRoles: true }
    });

    for (const user of users) {
      // Si l'utilisateur n'a pas encore de rôles assignés
      if (user.userRoles.length === 0) {
        let roleName = 'user'; // Par défaut

        // Mapper l'ancien système de rôles
        switch (user.role) {
          case 'SUPER_ADMIN':
            roleName = 'super_admin';
            break;
          case 'ADMIN':
            roleName = 'admin';
            break;
          case 'MODERATOR':
            roleName = 'moderator';
            break;
          default:
            roleName = 'user';
        }

        const role = await prisma.customRole.findUnique({
          where: { name: roleName }
        });

        if (role) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              assignedAt: new Date()
            }
          });
          logger.info(`👤 Utilisateur ${user.username || user.email} assigné au rôle ${role.displayName}`);
        }
      }
    }

    logger.info('🎉 Système de permissions initialisé avec succès !');
    
    // Afficher un résumé
    const permissionCount = await prisma.permission.count();
    const roleCount = await prisma.role.count();
    const userRoleCount = await prisma.userRole.count();
    
    logger.info('📊 Résumé :');
    logger.info(`   • ${permissionCount} permissions disponibles`);
    logger.info(`   • ${roleCount} rôles configurés`);
    logger.info(`   • ${userRoleCount} attributions de rôles`);

  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation des permissions:', error);
    throw error;
  }
}

/**
 * Script principal d'exécution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  initializePermissions()
    .then(() => {
      logger.info('✅ Initialisation terminée');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Initialisation échouée:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
