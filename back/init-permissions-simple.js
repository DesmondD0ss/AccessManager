const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  // Permissions utilisateurs
  { name: 'users:read', displayName: 'Voir utilisateurs', description: 'Voir les utilisateurs', resource: 'users', action: 'read', category: 'users' },
  { name: 'users:create', displayName: 'Créer utilisateurs', description: 'Créer des utilisateurs', resource: 'users', action: 'create', category: 'users' },
  { name: 'users:update', displayName: 'Modifier utilisateurs', description: 'Modifier des utilisateurs', resource: 'users', action: 'update', category: 'users' },
  { name: 'users:delete', displayName: 'Supprimer utilisateurs', description: 'Supprimer des utilisateurs', resource: 'users', action: 'delete', category: 'users' },
  { name: 'users:manage_roles', displayName: 'Gérer rôles utilisateurs', description: 'Gérer les rôles des utilisateurs', resource: 'users', action: 'manage_roles', category: 'users' },

  // Permissions sessions
  { name: 'sessions:read', displayName: 'Voir sessions', description: 'Voir les sessions', resource: 'sessions', action: 'read', category: 'sessions' },
  { name: 'sessions:create', displayName: 'Créer sessions', description: 'Créer des sessions', resource: 'sessions', action: 'create', category: 'sessions' },
  { name: 'sessions:delete', displayName: 'Supprimer sessions', description: 'Supprimer des sessions', resource: 'sessions', action: 'delete', category: 'sessions' },

  // Permissions quotas
  { name: 'quotas:read', displayName: 'Voir quotas', description: 'Voir les quotas', resource: 'quotas', action: 'read', category: 'quotas' },
  { name: 'quotas:update', displayName: 'Modifier quotas', description: 'Modifier les quotas', resource: 'quotas', action: 'update', category: 'quotas' },
  { name: 'quotas:manage', displayName: 'Gérer quotas', description: 'Gérer tous les quotas', resource: 'quotas', action: 'manage', category: 'quotas' },

  // Permissions réseau
  { name: 'network:read', displayName: 'Voir réseau', description: 'Voir les informations réseau', resource: 'network', action: 'read', category: 'network' },
  { name: 'network:update', displayName: 'Modifier réseau', description: 'Modifier la configuration réseau', resource: 'network', action: 'update', category: 'network' },

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

const DEFAULT_ROLES = [
  {
    name: 'user',
    description: 'Utilisateur standard avec accès limité',
    permissions: ['sessions:read', 'sessions:create', 'quotas:read']
  },
  {
    name: 'moderator', 
    description: 'Modérateur avec permissions étendues',
    permissions: [
      'users:read', 'users:update',
      'sessions:read', 'sessions:create', 'sessions:delete',
      'quotas:read', 'quotas:update',
      'guests:read', 'guests:create', 'guests:update',
      'statistics:read', 'network:read'
    ]
  },
  {
    name: 'admin',
    description: 'Administrateur avec permissions avancées',
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage_roles',
      'sessions:read', 'sessions:create', 'sessions:delete',
      'quotas:read', 'quotas:update', 'quotas:manage',
      'guests:read', 'guests:create', 'guests:update', 'guests:delete',
      'network:read', 'network:update',
      'statistics:read', 'statistics:export',
      'audit:read', 'system:read', 'system:logs',
      'roles:read', 'permissions:read'
    ]
  },
  {
    name: 'super_admin',
    description: 'Super administrateur avec tous les droits',
    permissions: DEFAULT_PERMISSIONS.map(p => p.name) // Toutes les permissions
  }
];

async function initializePermissions() {
  try {
    console.log('🚀 Initialisation du système de permissions...');

    // Trouver ou créer un utilisateur système
    let systemUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'SUPER_ADMIN' },
          { username: 'system' }
        ]
      }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          email: 'system@localhost',
          role: 'SUPER_ADMIN',
          isActive: true,
          hashedPassword: 'system'
        }
      });
      console.log('👤 Utilisateur système créé');
    }

    // 1. Créer les permissions
    console.log('📝 Création des permissions...');
    for (const permission of DEFAULT_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {
          displayName: permission.displayName,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          category: permission.category
        },
        create: permission
      });
    }
    console.log(`✅ ${DEFAULT_PERMISSIONS.length} permissions créées/mises à jour`);

    // 2. Créer les rôles
    console.log('👥 Création des rôles...');
    for (const roleData of DEFAULT_ROLES) {
      const { permissions, ...roleInfo } = roleData;
      
      const role = await prisma.customRole.upsert({
        where: { name: roleData.name },
        update: {
          description: roleInfo.description
        },
        create: {
          ...roleInfo,
          createdBy: systemUser.id
        }
      });

      // Supprimer les anciennes permissions du rôle
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Assigner les nouvelles permissions
      for (const permName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName }
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
      console.log(`👥 Rôle ${role.name} créé avec ${permissions.length} permissions`);
    }

    // 3. Migrer les utilisateurs existants
    console.log('🔄 Migration des utilisateurs...');
    const users = await prisma.user.findMany({
      where: {
        NOT: { username: 'system' }
      }
    });

    for (const user of users) {
      // Vérifier si l'utilisateur a déjà des rôles
      const existingRoles = await prisma.userRole.findMany({
        where: { userId: user.id }
      });

      if (existingRoles.length === 0) {
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
              assignedBy: systemUser.id,
              assignedAt: new Date()
            }
          });
          console.log(`👤 Utilisateur ${user.username || user.email} assigné au rôle ${role.name}`);
        }
      }
    }

    // Statistiques finales
    const permissionCount = await prisma.permission.count();
    const roleCount = await prisma.customRole.count();
    const userRoleCount = await prisma.userRole.count();

    console.log('✅ Initialisation terminée !');
    console.log(`📊 Statistiques:`);
    console.log(`   - ${permissionCount} permissions`);
    console.log(`   - ${roleCount} rôles`);
    console.log(`   - ${userRoleCount} assignations de rôles`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Exécuter le script
initializePermissions();
