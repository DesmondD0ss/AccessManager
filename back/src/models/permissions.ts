/**
 * Système de permissions granulaires
 * Définit les ressources, actions et permissions pour un contrôle d'accès fin
 */

// Ressources du système
export enum Resource {
  USER = 'user',
  ADMIN = 'admin',
  GUEST = 'guest',
  SESSION = 'session',
  QUOTA = 'quota',
  NETWORK = 'network',
  AUDIT = 'audit',
  BACKUP = 'backup',
  SYSTEM = 'system',
  NOTIFICATION = 'notification'
}

// Actions possibles sur les ressources
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  MANAGE = 'manage', // Action spéciale = toutes les actions
  EXECUTE = 'execute' // Pour les actions système
}

// Permissions spécifiques par ressource
export interface Permission {
  id: string;
  resource: Resource;
  action: Action;
  name: string;
  description: string;
  category: string;
}

// Définition de toutes les permissions du système
export const PERMISSIONS: Permission[] = [
  // PERMISSIONS UTILISATEURS
  {
    id: 'user.create',
    resource: Resource.USER,
    action: Action.CREATE,
    name: 'Créer des utilisateurs',
    description: 'Créer de nouveaux comptes utilisateurs',
    category: 'users'
  },
  {
    id: 'user.read',
    resource: Resource.USER,
    action: Action.READ,
    name: 'Consulter les utilisateurs',
    description: 'Voir les détails des utilisateurs',
    category: 'users'
  },
  {
    id: 'user.update',
    resource: Resource.USER,
    action: Action.UPDATE,
    name: 'Modifier les utilisateurs',
    description: 'Modifier les informations des utilisateurs',
    category: 'users'
  },
  {
    id: 'user.delete',
    resource: Resource.USER,
    action: Action.DELETE,
    name: 'Supprimer des utilisateurs',
    description: 'Supprimer des comptes utilisateurs',
    category: 'users'
  },
  {
    id: 'user.list',
    resource: Resource.USER,
    action: Action.LIST,
    name: 'Lister les utilisateurs',
    description: 'Voir la liste de tous les utilisateurs',
    category: 'users'
  },
  {
    id: 'user.manage',
    resource: Resource.USER,
    action: Action.MANAGE,
    name: 'Gestion complète des utilisateurs',
    description: 'Toutes les actions sur les utilisateurs',
    category: 'users'
  },

  // PERMISSIONS ADMINISTRATION
  {
    id: 'admin.read',
    resource: Resource.ADMIN,
    action: Action.READ,
    name: 'Accès au panel admin',
    description: 'Accéder au tableau de bord administrateur',
    category: 'admin'
  },
  {
    id: 'admin.manage',
    resource: Resource.ADMIN,
    action: Action.MANAGE,
    name: 'Administration complète',
    description: 'Accès complet aux fonctions d\'administration',
    category: 'admin'
  },

  // PERMISSIONS INVITÉS
  {
    id: 'guest.create',
    resource: Resource.GUEST,
    action: Action.CREATE,
    name: 'Créer des codes invités',
    description: 'Générer des codes d\'accès temporaires',
    category: 'guests'
  },
  {
    id: 'guest.read',
    resource: Resource.GUEST,
    action: Action.READ,
    name: 'Consulter les invités',
    description: 'Voir les sessions et codes d\'invités',
    category: 'guests'
  },
  {
    id: 'guest.update',
    resource: Resource.GUEST,
    action: Action.UPDATE,
    name: 'Modifier les codes invités',
    description: 'Modifier les codes d\'accès temporaires',
    category: 'guests'
  },
  {
    id: 'guest.delete',
    resource: Resource.GUEST,
    action: Action.DELETE,
    name: 'Supprimer des codes invités',
    description: 'Supprimer des codes d\'accès temporaires',
    category: 'guests'
  },
  {
    id: 'guest.manage',
    resource: Resource.GUEST,
    action: Action.MANAGE,
    name: 'Gestion complète des invités',
    description: 'Toutes les actions sur les invités',
    category: 'guests'
  },

  // PERMISSIONS SESSIONS
  {
    id: 'session.read',
    resource: Resource.SESSION,
    action: Action.READ,
    name: 'Consulter les sessions',
    description: 'Voir les sessions actives et historique',
    category: 'sessions'
  },
  {
    id: 'session.update',
    resource: Resource.SESSION,
    action: Action.UPDATE,
    name: 'Modifier les sessions',
    description: 'Terminer ou modifier des sessions',
    category: 'sessions'
  },
  {
    id: 'session.delete',
    resource: Resource.SESSION,
    action: Action.DELETE,
    name: 'Supprimer des sessions',
    description: 'Terminer des sessions utilisateurs',
    category: 'sessions'
  },
  {
    id: 'session.manage',
    resource: Resource.SESSION,
    action: Action.MANAGE,
    name: 'Gestion complète des sessions',
    description: 'Toutes les actions sur les sessions',
    category: 'sessions'
  },

  // PERMISSIONS QUOTAS
  {
    id: 'quota.read',
    resource: Resource.QUOTA,
    action: Action.READ,
    name: 'Consulter les quotas',
    description: 'Voir les quotas et leur utilisation',
    category: 'quotas'
  },
  {
    id: 'quota.update',
    resource: Resource.QUOTA,
    action: Action.UPDATE,
    name: 'Modifier les quotas',
    description: 'Modifier les quotas des utilisateurs',
    category: 'quotas'
  },
  {
    id: 'quota.manage',
    resource: Resource.QUOTA,
    action: Action.MANAGE,
    name: 'Gestion complète des quotas',
    description: 'Toutes les actions sur les quotas',
    category: 'quotas'
  },

  // PERMISSIONS RÉSEAU
  {
    id: 'network.read',
    resource: Resource.NETWORK,
    action: Action.READ,
    name: 'Consulter le réseau',
    description: 'Voir les informations réseau et règles',
    category: 'network'
  },
  {
    id: 'network.update',
    resource: Resource.NETWORK,
    action: Action.UPDATE,
    name: 'Modifier les règles réseau',
    description: 'Créer et modifier des règles réseau',
    category: 'network'
  },
  {
    id: 'network.manage',
    resource: Resource.NETWORK,
    action: Action.MANAGE,
    name: 'Gestion complète du réseau',
    description: 'Toutes les actions sur le réseau',
    category: 'network'
  },

  // PERMISSIONS AUDIT
  {
    id: 'audit.read',
    resource: Resource.AUDIT,
    action: Action.READ,
    name: 'Consulter les logs d\'audit',
    description: 'Voir les logs et traces d\'activité',
    category: 'audit'
  },
  {
    id: 'audit.manage',
    resource: Resource.AUDIT,
    action: Action.MANAGE,
    name: 'Gestion complète des audits',
    description: 'Toutes les actions sur les audits',
    category: 'audit'
  },

  // PERMISSIONS SAUVEGARDES
  {
    id: 'backup.create',
    resource: Resource.BACKUP,
    action: Action.CREATE,
    name: 'Créer des sauvegardes',
    description: 'Créer des sauvegardes de la base',
    category: 'backup'
  },
  {
    id: 'backup.read',
    resource: Resource.BACKUP,
    action: Action.READ,
    name: 'Consulter les sauvegardes',
    description: 'Voir la liste des sauvegardes',
    category: 'backup'
  },
  {
    id: 'backup.execute',
    resource: Resource.BACKUP,
    action: Action.EXECUTE,
    name: 'Restaurer des sauvegardes',
    description: 'Restaurer des sauvegardes',
    category: 'backup'
  },
  {
    id: 'backup.delete',
    resource: Resource.BACKUP,
    action: Action.DELETE,
    name: 'Supprimer des sauvegardes',
    description: 'Supprimer des fichiers de sauvegarde',
    category: 'backup'
  },
  {
    id: 'backup.manage',
    resource: Resource.BACKUP,
    action: Action.MANAGE,
    name: 'Gestion complète des sauvegardes',
    description: 'Toutes les actions sur les sauvegardes',
    category: 'backup'
  },

  // PERMISSIONS SYSTÈME
  {
    id: 'system.read',
    resource: Resource.SYSTEM,
    action: Action.READ,
    name: 'Consulter le système',
    description: 'Voir les informations système',
    category: 'system'
  },
  {
    id: 'system.update',
    resource: Resource.SYSTEM,
    action: Action.UPDATE,
    name: 'Modifier la configuration',
    description: 'Modifier la configuration système',
    category: 'system'
  },
  {
    id: 'system.execute',
    resource: Resource.SYSTEM,
    action: Action.EXECUTE,
    name: 'Actions système',
    description: 'Exécuter des actions système (maintenance, etc.)',
    category: 'system'
  },
  {
    id: 'system.manage',
    resource: Resource.SYSTEM,
    action: Action.MANAGE,
    name: 'Administration système complète',
    description: 'Toutes les actions système',
    category: 'system'
  },

  // PERMISSIONS NOTIFICATIONS
  {
    id: 'notification.create',
    resource: Resource.NOTIFICATION,
    action: Action.CREATE,
    name: 'Créer des notifications',
    description: 'Envoyer des notifications aux utilisateurs',
    category: 'notifications'
  },
  {
    id: 'notification.read',
    resource: Resource.NOTIFICATION,
    action: Action.READ,
    name: 'Consulter les notifications',
    description: 'Voir les notifications envoyées',
    category: 'notifications'
  },
  {
    id: 'notification.manage',
    resource: Resource.NOTIFICATION,
    action: Action.MANAGE,
    name: 'Gestion complète des notifications',
    description: 'Toutes les actions sur les notifications',
    category: 'notifications'
  }
];

// Rôles prédéfinis avec leurs permissions
export interface RoleDefinition {
  role: string;
  permissions: string[];
  description: string;
}

export const ROLE_PERMISSIONS: RoleDefinition[] = [
  {
    role: 'USER',
    permissions: [
      // Les utilisateurs normaux n'ont pas de permissions admin
    ],
    description: 'Utilisateur standard sans permissions administratives'
  },
  {
    role: 'MODERATOR',
    permissions: [
      'user.read',
      'user.list',
      'session.read',
      'quota.read',
      'guest.read',
      'audit.read'
    ],
    description: 'Modérateur avec accès en lecture seule'
  },
  {
    role: 'ADMIN',
    permissions: [
      'admin.read',
      'user.manage',
      'guest.manage',
      'session.manage',
      'quota.manage',
      'network.read',
      'network.update',
      'audit.read',
      'backup.create',
      'backup.read',
      'notification.create',
      'notification.read'
    ],
    description: 'Administrateur avec la plupart des permissions'
  },
  {
    role: 'SUPER_ADMIN',
    permissions: [
      'admin.manage',
      'user.manage',
      'guest.manage',
      'session.manage',
      'quota.manage',
      'network.manage',
      'audit.manage',
      'backup.manage',
      'system.manage',
      'notification.manage'
    ],
    description: 'Super administrateur avec toutes les permissions'
  }
];

// Utilitaires pour les permissions
export class PermissionUtils {
  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Vérifie si un utilisateur a au moins une des permissions requises
   */
  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Vérifie si un utilisateur a toutes les permissions requises
   */
  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Obtient les permissions pour un rôle
   */
  static getPermissionsForRole(role: string): string[] {
    const roleDefinition = ROLE_PERMISSIONS.find(r => r.role === role);
    return roleDefinition ? roleDefinition.permissions : [];
  }

  /**
   * Obtient toutes les permissions d'une catégorie
   */
  static getPermissionsByCategory(category: string): Permission[] {
    return PERMISSIONS.filter(p => p.category === category);
  }

  /**
   * Obtient toutes les permissions pour une ressource
   */
  static getPermissionsForResource(resource: Resource): Permission[] {
    return PERMISSIONS.filter(p => p.resource === resource);
  }
}
