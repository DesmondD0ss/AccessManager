const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('📊 Vérification des données...\n');
    
    // Compter les permissions
    const permissionCount = await prisma.permission.count();
    console.log(`✅ ${permissionCount} permissions créées`);
    
    // Lister les rôles avec permissions
    const roles = await prisma.customRole.findMany({
      include: {
        rolePermissions: {
          include: { permission: true }
        },
        userRoles: {
          include: { user: true }
        }
      }
    });
    
    console.log(`\n👥 ${roles.length} rôles créés:`);
    for (const role of roles) {
      console.log(`  - ${role.name}: ${role.description}`);
      console.log(`    └─ ${role.rolePermissions.length} permissions`);
      console.log(`    └─ ${role.userRoles.length} utilisateurs assignés`);
    }
    
    // Lister les utilisateurs
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });
    
    console.log(`\n👤 ${users.length} utilisateurs:`);
    for (const user of users) {
      console.log(`  - ${user.username || user.email} (role legacy: ${user.role})`);
      if (user.userRoles.length > 0) {
        console.log(`    └─ Rôles: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
      } else {
        console.log(`    └─ Aucun rôle assigné`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
  }
}

checkData();
