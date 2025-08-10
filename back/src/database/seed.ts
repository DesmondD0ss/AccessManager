import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation de la base de données...');

  // Supprimer les données existantes
  await prisma.accessSession.deleteMany();
  await prisma.userQuota.deleteMany();
  await prisma.accessCode.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Données existantes supprimées');

  // Créer un utilisateur administrateur
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@gais.local',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'GAIS',
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true,
      hashedPassword: hashedPassword,
    },
  });

  console.log('👤 Utilisateur admin créé:', adminUser.email);

  // Créer quelques utilisateurs de test
  const users = [];
  
  for (let i = 1; i <= 3; i++) {
    const userPassword = await bcrypt.hash(`user${i}23`, 10);
    const user = await prisma.user.create({
      data: {
        email: `user${i}@gais.local`,
        username: `user${i}`,
        firstName: `Utilisateur`,
        lastName: `${i}`,
        role: 'USER',
        isActive: true,
        isEmailVerified: true,
        hashedPassword: userPassword,
      },
    });
    users.push(user);
  }

  console.log('👥 Utilisateurs de test créés');

  // Créer des quotas pour les utilisateurs
  for (const user of users) {
    await prisma.userQuota.create({
      data: {
        userId: user.id,
        quotaType: 'DAILY',
        dailyLimitMB: 1000, // 1GB par jour
        weeklyLimitMB: 5000, // 5GB par semaine
        monthlyLimitMB: 20000, // 20GB par mois
        dailyTimeMinutes: 480, // 8h par jour
        currentDailyMB: Math.floor(Math.random() * 500), // Usage aléatoire
        currentWeeklyMB: Math.floor(Math.random() * 2000),
        currentMonthlyMB: Math.floor(Math.random() * 8000),
        currentDailyMinutes: Math.floor(Math.random() * 240),
        currentWeeklyMinutes: Math.floor(Math.random() * 1200),
        currentMonthlyMinutes: Math.floor(Math.random() * 5000),
        isActive: true,
        validFrom: new Date(),
      },
    });
  }

  console.log('📊 Quotas créés pour les utilisateurs');

  // Créer quelques codes d'accès
  const accessCodes = [
    {
      code: 'GUEST001',
      description: 'Code pour invités - 1 jour',
      dataQuotaMB: 500,
      timeQuotaMinutes: 120,
      maxUses: 5,
    },
    {
      code: 'VISITOR1',
      description: 'Code visiteur - accès limité',
      dataQuotaMB: 200,
      timeQuotaMinutes: 60,
      maxUses: 1,
    },
    {
      code: 'DEMO2024',
      description: 'Code de démonstration',
      dataQuotaMB: 1000,
      timeQuotaMinutes: 240,
      maxUses: 10,
    },
  ];

  for (const codeData of accessCodes) {
    await prisma.accessCode.create({
      data: {
        ...codeData,
        createdBy: adminUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire dans 7 jours
      },
    });
  }

  console.log('🎫 Codes d\'accès créés');

  // Créer quelques sessions de test
  const now = new Date();
  const sessions = [
    {
      userId: users[0].id,
      ipAddress: '192.168.1.100',
      macAddress: 'aa:bb:cc:dd:ee:f1',
      deviceName: 'iPhone de Utilisateur 1',
      status: 'ACTIVE',
      startedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Il y a 2h
      dataUsedMB: 150,
      timeUsedMinutes: 120,
    },
    {
      userId: users[1].id,
      ipAddress: '192.168.1.101',
      macAddress: 'aa:bb:cc:dd:ee:f2',
      deviceName: 'Laptop de Utilisateur 2',
      status: 'TERMINATED',
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Hier
      endedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
      dataUsedMB: 300,
      timeUsedMinutes: 180,
    },
  ];

  for (const sessionData of sessions) {
    await prisma.accessSession.create({
      data: {
        ...sessionData,
        lastActiveAt: sessionData.endedAt || now,
      },
    });
  }

  console.log('🔗 Sessions de test créées');

  console.log('\n✅ Base de données initialisée avec succès !');
  console.log('\n📝 Informations de connexion :');
  console.log('👤 Admin: admin@gais.local / admin123');
  console.log('👤 User1: user1@gais.local / user123');
  console.log('👤 User2: user2@gais.local / user223');
  console.log('👤 User3: user3@gais.local / user323');
  console.log('\n🎫 Codes d\'accès disponibles :');
  console.log('- GUEST001 (500MB, 2h)');
  console.log('- VISITOR1 (200MB, 1h)');
  console.log('- DEMO2024 (1GB, 4h)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
