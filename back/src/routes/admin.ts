import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.js';
import { asyncHandler, ValidationError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';
import { backupService } from '../services/backupService.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Tableau de bord administrateur
 *     description: Récupère les métriques principales du système pour le tableau de bord administrateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métriques du tableau de bord récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total: { type: integer, description: "Nombre total d'utilisateurs" }
 *                         active: { type: integer, description: "Utilisateurs actifs" }
 *                         newToday: { type: integer, description: "Nouveaux utilisateurs aujourd'hui" }
 *                         newThisWeek: { type: integer, description: "Nouveaux utilisateurs cette semaine" }
 *                         admins: { type: integer, description: "Nombre d'administrateurs" }
 *                     sessions:
 *                       type: object
 *                       properties:
 *                         active: { type: integer, description: "Sessions actives" }
 *                         today: { type: integer, description: "Sessions aujourd'hui" }
 *                         thisWeek: { type: integer, description: "Sessions cette semaine" }
 *                         total: { type: integer, description: "Total des sessions" }
 *                     consumption:
 *                       type: object
 *                       properties:
 *                         dataToday: { type: number, description: "Données consommées aujourd'hui (MB)" }
 *                         dataThisWeek: { type: number, description: "Données consommées cette semaine (MB)" }
 *                         dataThisMonth: { type: number, description: "Données consommées ce mois (MB)" }
 *                         timeToday: { type: number, description: "Temps utilisé aujourd'hui (minutes)" }
 *                         timeThisWeek: { type: number, description: "Temps utilisé cette semaine (minutes)" }
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         lockedUsers: { type: integer, description: "Utilisateurs bloqués" }
 *                         quotaExceeded: { type: integer, description: "Sessions avec quota dépassé" }
 *                         recentErrors: { type: integer, description: "Erreurs récentes" }
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime: { type: string, description: "Temps de fonctionnement" }
 *                         version: { type: string, description: "Version du système" }
 *                         environment: { type: string, description: "Environnement" }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/dashboard', authenticate, requirePermission('dashboard:read'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Métriques utilisateurs
  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek,
    adminUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } })
  ]);

  // Métriques sessions
  const [
    activeSessions,
    sessionsToday,
    sessionsThisWeek,
    totalSessionsEver
  ] = await Promise.all([
    prisma.accessSession.count({ where: { status: 'ACTIVE' } }),
    prisma.accessSession.count({ where: { startedAt: { gte: today } } }),
    prisma.accessSession.count({ where: { startedAt: { gte: thisWeek } } }),
    prisma.accessSession.count()
  ]);

  // Métriques de consommation
  const [
    dataUsageToday,
    dataUsageThisWeek,
    dataUsageThisMonth,
    timeUsageToday,
    timeUsageThisWeek
  ] = await Promise.all([
    prisma.accessSession.aggregate({
      where: { startedAt: { gte: today } },
      _sum: { dataUsedMB: true }
    }),
    prisma.accessSession.aggregate({
      where: { startedAt: { gte: thisWeek } },
      _sum: { dataUsedMB: true }
    }),
    prisma.accessSession.aggregate({
      where: { startedAt: { gte: thisMonth } },
      _sum: { dataUsedMB: true }
    }),
    prisma.accessSession.aggregate({
      where: { startedAt: { gte: today } },
      _sum: { timeUsedMinutes: true }
    }),
    prisma.accessSession.aggregate({
      where: { startedAt: { gte: thisWeek } },
      _sum: { timeUsedMinutes: true }
    })
  ]);

  // Alertes et problèmes
  const [
    lockedUsers,
    quotaExceededSessions,
    recentErrors
  ] = await Promise.all([
    prisma.user.count({
      where: {
        lockedUntil: { gt: now }
      }
    }),
    prisma.accessSession.count({
      where: { status: 'QUOTA_EXCEEDED' }
    }),
    // Simuler les erreurs récentes (à remplacer par une vraie table de logs)
    Promise.resolve(0)
  ]);

  // Métriques système
  const systemMetrics = {
    uptime: Math.round(process.uptime()),
    memoryUsage: {
      usedMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      totalMB: Math.round(process.memoryUsage().rss / 1024 / 1024), // Estimation
      usage: Math.round((process.memoryUsage().rss / (process.memoryUsage().rss * 1.2)) * 100)
    },
    nodeVersion: process.version,
    environment: appConfig.NODE_ENV
  };

  // Top utilisateurs par consommation cette semaine
  const topUsers = await prisma.accessSession.groupBy({
    by: ['userId'],
    where: { startedAt: { gte: thisWeek } },
    _sum: {
      dataUsedMB: true,
      timeUsedMinutes: true
    },
    orderBy: {
      _sum: {
        dataUsedMB: 'desc'
      }
    },
    take: 5
  });

  const enrichedTopUsers = await Promise.all(
    topUsers.map(async (item: any) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { username: true, email: true }
      });
      return {
        user,
        dataUsedMB: Math.round((item._sum.dataUsedMB || 0)),
        timeUsedHours: Math.round((item._sum.timeUsedMinutes || 0) / 60 * 10) / 10
      };
    })
  );

  // Sessions récentes (dernières 10)
  const recentSessions = await prisma.accessSession.findMany({
    take: 10,
    orderBy: { startedAt: 'desc' },
    include: {
      user: {
        select: { username: true, email: true }
      }
    }
  });

  const dashboard = {
    users: {
      total: totalUsers,
      active: activeUsers,
      newToday: newUsersToday,
      newThisWeek: newUsersThisWeek,
      admins: adminUsers,
      locked: lockedUsers,
      activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    },
    sessions: {
      active: activeSessions,
      today: sessionsToday,
      thisWeek: sessionsThisWeek,
      total: totalSessionsEver,
      quotaExceeded: quotaExceededSessions,
      averagePerDay: Math.round(sessionsThisWeek / 7)
    },
    dataUsage: {
      todayMB: Math.round((dataUsageToday._sum.dataUsedMB || 0)),
      thisWeekMB: Math.round((dataUsageThisWeek._sum.dataUsedMB || 0)),
      thisMonthMB: Math.round((dataUsageThisMonth._sum.dataUsedMB || 0)),
      averagePerDayMB: Math.round(((dataUsageThisWeek._sum.dataUsedMB || 0)) / 7),
      averagePerUserMB: activeUsers > 0 ? Math.round(((dataUsageThisWeek._sum.dataUsedMB || 0)) / activeUsers) : 0
    },
    timeUsage: {
      todayHours: Math.round((timeUsageToday._sum.timeUsedMinutes || 0) / 60 * 10) / 10,
      thisWeekHours: Math.round((timeUsageThisWeek._sum.timeUsedMinutes || 0) / 60 * 10) / 10,
      averagePerDayHours: Math.round(((timeUsageThisWeek._sum.timeUsedMinutes || 0) / 60) / 7 * 10) / 10
    },
    alerts: {
      lockedUsers,
      quotaExceeded: quotaExceededSessions,
      recentErrors,
      total: lockedUsers + quotaExceededSessions + recentErrors
    },
    system: systemMetrics,
    topUsers: enrichedTopUsers.filter(u => u.user),
    recentActivity: recentSessions.map((session: any) => ({
      id: session.id,
      user: session.user,
      startTime: session.startedAt,
      endTime: session.endedAt,
      dataUsedMB: Math.round((session.dataUsedMB || 0)),
      timeUsedMinutes: Math.round((session.timeUsedMinutes || 0)),
      status: session.status,
      ipAddress: session.ipAddress
    }))
  };

  res.json({
    success: true,
    data: { dashboard },
    timestamp: new Date().toISOString()
  });

  logger.info('Admin dashboard accessed', {
    adminUserId: (req as any).user?.id,
    metrics: {
      totalUsers,
      activeSessions,
      dataUsageTodayMB: dashboard.dataUsage.todayMB
    }
  });
}));

/**
 * @route GET /api/admin/system-info
 * @desc Informations système détaillées
 * @access Private (Super Admin)
 */
router.get('/system-info', authenticate, requirePermission('system:read'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const systemInfo = {
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: {
        seconds: Math.round(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      environment: appConfig.NODE_ENV,
      port: appConfig.PORT
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
      unit: 'MB'
    },
    database: {
      type: 'SQLite', // ou PostgreSQL selon la config
      connected: true, // à vérifier dynamiquement
      version: 'Unknown', // à récupérer si possible
      tablesCount: await getDatabaseTablesCount()
    },
    configuration: {
      jwtExpiresIn: appConfig.jwt.expiresIn,
      corsOrigin: appConfig.cors.origin,
      rateLimitMax: appConfig.rateLimit.max,
      logLevel: appConfig.logs.level,
      defaultDataQuotaMB: Math.round(appConfig.quotas.defaultData / 1024 / 1024),
      defaultTimeQuotaHours: Math.round(appConfig.quotas.defaultTime / 3600),
      maxConcurrentUsers: appConfig.quotas.maxConcurrentUsers
    },
    features: {
      authentication: true,
      quotaManagement: true,
      realTimeUpdates: true,
      csvExport: true,
      adminPanel: true,
      logging: true
    }
  };

  res.json({
    success: true,
    data: { systemInfo }
  });

  logger.info('System info accessed', {
    adminUserId: (req as any).user?.id
  });
}));

/**
 * @route GET /api/admin/logs
 * @desc Récupérer les logs système (simulation)
 * @access Private (Super Admin)
 */
router.get('/logs', authenticate, requirePermission('system:logs'), [
  query('level').optional().isIn(['error', 'warn', 'info', 'debug']).withMessage('Niveau de log invalide'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limite entre 1 et 1000'),
  query('search').optional().isLength({ max: 100 }).withMessage('Recherche max 100 caractères')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const level = req.query.level as string || 'info';
  const limit = parseInt(req.query.limit as string) || 100;
  const search = req.query.search as string;

  // Simulation de logs (à remplacer par une vraie lecture de fichiers de logs)
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      message: 'User login successful',
      meta: { userId: 'user123', ip: '192.168.1.100' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'warn',
      message: 'High memory usage detected',
      meta: { memoryUsage: '85%' }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      level: 'error',
      message: 'Database connection timeout',
      meta: { error: 'Connection timeout after 5 seconds' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      level: 'info',
      message: 'User quota exceeded',
      meta: { userId: 'user456', dataUsed: '1024MB' }
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'debug',
      message: 'Session cleanup completed',
      meta: { sessionsRemoved: 5 }
    }
  ];

  // Filtrage par niveau
  let filteredLogs = mockLogs.filter(log => {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(level);
    const logLevelIndex = levels.indexOf(log.level);
    return logLevelIndex <= currentLevelIndex;
  });

  // Filtrage par recherche
  if (search) {
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.meta).toLowerCase().includes(search.toLowerCase())
    );
  }

  // Limitation
  const logs = filteredLogs.slice(0, limit);

  res.json({
    success: true,
    data: {
      logs,
      filters: { level, search, limit },
      totalFound: filteredLogs.length
    }
  });

  logger.info('Admin logs accessed', {
    adminUserId: (req as any).user?.id,
    level,
    search: search || 'none',
    limit
  });
}));

/**
 * @route POST /api/admin/actions/broadcast
 * @desc Diffuser un message à tous les utilisateurs connectés
 * @access Private (Super Admin)
 */
router.post('/actions/broadcast', authenticate, requireAdmin, [
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message requis (max 500 caractères)'),
  body('type').optional().isIn(['info', 'warning', 'error']).withMessage('Type: info, warning, error'),
  body('persistent').optional().isBoolean().withMessage('Persistent doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de diffusion invalides');
  }

  const { message, type = 'info', persistent = false } = req.body;

  // Récupérer les utilisateurs avec sessions actives
  const activeUsers = await prisma.user.findMany({
    where: {
      accessSessions: {
        some: { status: 'ACTIVE' }
      }
    },
    select: {
      id: true,
      username: true,
      accessSessions: {
        where: { status: 'ACTIVE' },
        select: { id: true }
      }
    }
  });

  const broadcast = {
    id: `broadcast_${Date.now()}`,
    message,
    type,
    persistent,
    timestamp: new Date().toISOString(),
    targetUsers: activeUsers.length,
    sentBy: (req as any).user?.username || 'Admin'
  };

  // Ici, on diffuserait normalement via WebSocket
  // Pour l'instant, on simule juste la diffusion

  res.json({
    success: true,
    data: { broadcast },
    message: `Message diffusé à ${activeUsers.length} utilisateurs connectés`
  });

  logger.info('Admin broadcast sent', {
    adminUserId: (req as any).user?.id,
    message,
    type,
    targetUsers: activeUsers.length
  });
}));

/**
 * @route POST /api/admin/actions/disconnect-user
 * @desc Déconnecter un utilisateur spécifique
 * @access Private (Super Admin)
 */
router.post('/actions/disconnect-user', authenticate, requireAdmin, [
  body('userId').isString().notEmpty().withMessage('ID utilisateur requis'),
  body('reason').optional().isLength({ max: 200 }).withMessage('Raison max 200 caractères')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, reason = 'Déconnexion administrative' } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new ValidationError('Utilisateur non trouvé');
  }

  // Fermer toutes les sessions actives
  const updatedSessions = await prisma.accessSession.updateMany({
    where: { 
      userId,
      status: 'ACTIVE'
    },
    data: {
      status: 'TERMINATED',
      endedAt: new Date()
    }
  });

  res.json({
    success: true,
    data: {
      userId,
      username: user.username,
      sessionsTerminated: updatedSessions.count,
      reason
    },
    message: `Utilisateur ${user.username} déconnecté (${updatedSessions.count} sessions fermées)`
  });

  logger.info('User disconnected by admin', {
    adminUserId: (req as any).user?.id,
    targetUserId: userId,
    targetUsername: user.username,
    sessionsTerminated: updatedSessions.count,
    reason
  });
}));

/**
 * @route POST /api/admin/actions/maintenance-mode
 * @desc Activer/désactiver le mode maintenance
 * @access Private (Super Admin)
 */
router.post('/actions/maintenance-mode', authenticate, requirePermission('system:maintenance'), [
  body('enabled').isBoolean().withMessage('Enabled doit être un booléen'),
  body('message').optional().isLength({ max: 200 }).withMessage('Message max 200 caractères'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Durée en minutes')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { enabled, message = 'Maintenance en cours', duration } = req.body;

  // Ici, on sauvegarderait normalement l'état de maintenance en base
  // Pour l'instant, on simule juste la réponse

  const maintenanceMode = {
    enabled,
    message,
    startTime: enabled ? new Date().toISOString() : null,
    endTime: enabled && duration ? new Date(Date.now() + duration * 60000).toISOString() : null,
    setBy: (req as any).user?.username || 'Admin'
  };

  if (enabled) {
    // En mode maintenance, on pourrait déconnecter tous les utilisateurs non-admin
    const nonAdminSessions = await prisma.accessSession.updateMany({
      where: {
        status: 'ACTIVE',
        user: {
          role: 'USER'
        }
      },
      data: {
        status: 'TERMINATED',
        endedAt: new Date()
      }
    });

    logger.info('Maintenance mode enabled', {
      adminUserId: (req as any).user?.id,
      message,
      duration,
      sessionsTerminated: nonAdminSessions.count
    });
  } else {
    logger.info('Maintenance mode disabled', {
      adminUserId: (req as any).user?.id
    });
  }

  res.json({
    success: true,
    data: { maintenanceMode },
    message: enabled ? 'Mode maintenance activé' : 'Mode maintenance désactivé'
  });
}));

/**
 * @route GET /api/admin/audit-logs
 * @desc Récupérer les logs d'audit des actions admin
 * @access Private (Super Admin)
 */
router.get('/audit-logs', authenticate, requirePermission('audit:read'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite entre 1 et 100'),
  query('action').optional().isString().withMessage('Action doit être une chaîne'),
  query('userId').optional().isString().withMessage('UserID doit être une chaîne')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const action = req.query.action as string;
  const userId = req.query.userId as string;

  // Simulation d'audit logs (à remplacer par une vraie table d'audit)
  const mockAuditLogs = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      adminId: 'admin123',
      adminUsername: 'admin',
      action: 'USER_CREATED',
      targetUserId: 'user789',
      targetUsername: 'newuser',
      details: { username: 'newuser', email: 'new@example.com', role: 'USER' },
      ipAddress: '192.168.1.10'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      adminId: 'admin123',
      adminUsername: 'admin',
      action: 'QUOTA_UPDATED',
      targetUserId: 'user456',
      targetUsername: 'testuser',
      details: { dataQuota: '2048MB', timeQuota: '4hours' },
      ipAddress: '192.168.1.10'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      adminId: 'admin123',
      adminUsername: 'admin',
      action: 'USER_DISCONNECTED',
      targetUserId: 'user789',
      targetUsername: 'problemuser',
      details: { reason: 'Policy violation', sessionsTerminated: 2 },
      ipAddress: '192.168.1.10'
    }
  ];

  // Filtrage
  let filteredLogs = mockAuditLogs;
  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
  }
  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.targetUserId === userId);
  }

  // Pagination
  const totalCount = filteredLogs.length;
  const skip = (page - 1) * limit;
  const logs = filteredLogs.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: { action, userId }
    }
  });

  logger.info('Audit logs accessed', {
    adminUserId: (req as any).user?.id,
    filters: { action, userId },
    page
  });
}));

// Fonctions utilitaires
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

async function getDatabaseTablesCount(): Promise<number> {
  try {
    // Pour SQLite, on peut compter les tables via une requête
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ` as any[];
    return result[0]?.count || 0;
  } catch (error) {
    logger.error('Error counting database tables:', error);
    return 0;
  }
}

// ==========================================
// ROUTES GESTION DES CODES D'ACCÈS INVITÉS
// ==========================================

/**
 * @route GET /api/admin/guest-codes
 * @desc Liste tous les codes d'accès invités avec filtres
 * @access Private (Admin+)
/**
 * @swagger
 * /api/admin/guest-codes:
 *   get:
 *     summary: Liste des codes d'accès invités
 *     description: Récupère la liste paginée des codes d'accès pour invités avec filtres
 *     tags: [Admin, Guest Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - name: level
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PREMIUM, STANDARD, BASIC, CUSTOM]
 *         description: Filtrer par niveau d'accès
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif/inactif
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Recherche dans le code ou la description
 *     responses:
 *       200:
 *         description: Liste des codes d'accès récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         codes:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/GuestAccessCode'
 *                               - type: object
 *                                 properties:
 *                                   createdByUser:
 *                                     type: object
 *                                     properties:
 *                                       id: { type: string }
 *                                       username: { type: string }
 *                                       firstName: { type: string }
 *                                       lastName: { type: string }
 *                                   guestSessions:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/GuestSession'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/guest-codes', authenticate, requirePermission('guests:read'), [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('level').optional().isIn(['PREMIUM', 'STANDARD', 'BASIC', 'CUSTOM']),
  query('isActive').optional().isBoolean().toBoolean(),
  query('search').optional().isString().trim()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de requête invalides');
  }

  const { 
    page = 1, 
    limit = 20, 
    level, 
    isActive, 
    search 
  } = req.query as any;

  // Construction des filtres
  const where: any = {};
  
  if (level) {
    where.level = level;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { description: { contains: search } }
    ];
  }

  // Requêtes en parallèle
  const [codes, totalCount] = await Promise.all([
    prisma.guestAccessCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        guestSessions: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            dataConsumedMB: true,
            timeConsumedMinutes: true
          },
          orderBy: { startedAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            guestSessions: true
          }
        }
      }
    }),
    prisma.guestAccessCode.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: {
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        level: code.level,
        description: code.description,
        isActive: code.isActive,
        expiresAt: code.expiresAt,
        maxUses: code.maxUses,
        currentUses: code.currentUses,
        customQuotas: code.customQuotas ? JSON.parse(code.customQuotas) : null,
        createdAt: code.createdAt,
        lastUsedAt: code.lastUsedAt,
        createdBy: {
          id: code.createdByUser.id,
          username: code.createdByUser.username,
          name: `${code.createdByUser.firstName || ''} ${code.createdByUser.lastName || ''}`.trim()
        },
        statistics: {
          totalSessions: code._count.guestSessions,
          recentSessions: code.guestSessions
        }
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });

  logger.info('Guest codes listed', {
    adminUserId: (req as any).user?.id,
    filters: { level, isActive, search },
    page,
    count: codes.length
  });
}));

/**
 * @swagger
 * /api/admin/guest-codes:
 *   post:
 *     summary: Créer un code d'accès invité
 *     description: Crée un nouveau code d'accès temporaire pour les invités
 *     tags: [Admin, Guest Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - expiresAt
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [PREMIUM, STANDARD, BASIC, CUSTOM]
 *                 description: Niveau d'accès du code
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 description: Description optionnelle du code
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'expiration du code (doit être dans le futur)
 *               maxUses:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 description: Nombre maximum d'utilisations (optionnel)
 *               customQuotas:
 *                 type: object
 *                 description: Quotas personnalisés pour niveau CUSTOM
 *                 properties:
 *                   dataQuotaMB:
 *                     type: integer
 *                     minimum: 1
 *                     description: Quota de données en MB
 *                   timeQuotaMinutes:
 *                     type: integer
 *                     minimum: 1
 *                     description: Quota de temps en minutes
 *           example:
 *             level: "PREMIUM"
 *             description: "Code pour invité VIP"
 *             expiresAt: "2024-12-31T23:59:59Z"
 *             maxUses: 5
 *     responses:
 *       201:
 *         description: Code d'accès créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Code d'accès invité créé avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/GuestAccessCode'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/guest-codes', authenticate, requirePermission('guests:create'), [
  body('level')
    .isIn(['PREMIUM', 'STANDARD', 'BASIC', 'CUSTOM'])
    .withMessage('Niveau de code invalide'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Description trop longue'),
  body('expiresAt')
    .isISO8601()
    .withMessage('Date d\'expiration invalide')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date d\'expiration doit être dans le futur');
      }
      return true;
    }),
  body('maxUses')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Nombre d\'utilisations invalide'),
  body('customQuotas')
    .optional()
    .isObject()
    .withMessage('Quotas personnalisés invalides'),
  body('customQuotas.dataQuotaMB')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quota de données invalide'),
  body('customQuotas.timeQuotaMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Quota de temps invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { 
    level, 
    description, 
    expiresAt, 
    maxUses = 1, 
    customQuotas 
  } = req.body;

  const adminUserId = (req as any).user.id;

  // Validation pour niveau CUSTOM
  if (level === 'CUSTOM' && (!customQuotas || !customQuotas.dataQuotaMB || !customQuotas.timeQuotaMinutes)) {
    throw new ValidationError('Quotas personnalisés requis pour le niveau CUSTOM');
  }

  // Génération du code unique
  const generateUniqueCode = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let code = '';
      
      for (let i = 0; i < 8; i++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      // Vérifier l'unicité
      const existing = await prisma.guestAccessCode.findUnique({
        where: { code }
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new Error('Impossible de générer un code unique');
  };

  const code = await generateUniqueCode();

  // Création du code
  const newCode = await prisma.guestAccessCode.create({
    data: {
      code,
      level,
      description,
      createdBy: adminUserId,
      expiresAt: new Date(expiresAt),
      maxUses,
      customQuotas: level === 'CUSTOM' ? JSON.stringify(customQuotas) : null,
      isActive: true
    },
    include: {
      createdByUser: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Code d\'accès invité créé avec succès',
    data: {
      id: newCode.id,
      code: newCode.code,
      level: newCode.level,
      description: newCode.description,
      isActive: newCode.isActive,
      expiresAt: newCode.expiresAt,
      maxUses: newCode.maxUses,
      currentUses: newCode.currentUses,
      customQuotas: newCode.customQuotas ? JSON.parse(newCode.customQuotas) : null,
      createdAt: newCode.createdAt,
      createdBy: {
        username: newCode.createdByUser.username,
        name: `${newCode.createdByUser.firstName || ''} ${newCode.createdByUser.lastName || ''}`.trim()
      }
    }
  });

  logger.info('Guest access code created', {
    codeId: newCode.id,
    level,
    createdBy: adminUserId,
    code: code.substring(0, 3) + '*****' // Log partiel pour sécurité
  });
}));

/**
 * @route PUT /api/admin/guest-codes/:id
 * @desc Met à jour un code d'accès invité
 * @access Private (Admin+)
 */
router.put('/guest-codes/:id', authenticate, requireAdmin, [
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Description trop longue'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Statut actif invalide'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Date d\'expiration invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { id } = req.params;
  const { description, isActive, expiresAt } = req.body;

  // Vérifier que le code existe
  const existingCode = await prisma.guestAccessCode.findUnique({
    where: { id }
  });

  if (!existingCode) {
    res.status(404).json({
      success: false,
      message: 'Code d\'accès introuvable'
    });
    return;
  }

  // Préparer les données de mise à jour
  const updateData: any = { updatedAt: new Date() };

  if (description !== undefined) {
    updateData.description = description;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  if (expiresAt !== undefined) {
    updateData.expiresAt = new Date(expiresAt);
  }

  // Mise à jour
  const updatedCode = await prisma.guestAccessCode.update({
    where: { id },
    data: updateData,
    include: {
      createdByUser: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Code d\'accès mis à jour avec succès',
    data: {
      id: updatedCode.id,
      code: updatedCode.code,
      level: updatedCode.level,
      description: updatedCode.description,
      isActive: updatedCode.isActive,
      expiresAt: updatedCode.expiresAt,
      maxUses: updatedCode.maxUses,
      currentUses: updatedCode.currentUses,
      customQuotas: updatedCode.customQuotas ? JSON.parse(updatedCode.customQuotas) : null,
      createdAt: updatedCode.createdAt,
      updatedAt: updatedCode.updatedAt,
      createdBy: {
        username: updatedCode.createdByUser.username,
        name: `${updatedCode.createdByUser.firstName || ''} ${updatedCode.createdByUser.lastName || ''}`.trim()
      }
    }
  });

  logger.info('Guest access code updated', {
    codeId: id,
    updatedBy: (req as any).user.id,
    changes: Object.keys(updateData)
  });
}));

/**
 * @route DELETE /api/admin/guest-codes/:id
 * @desc Supprime un code d'accès invité
 * @access Private (Admin+)
 */
router.delete('/guest-codes/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Vérifier que le code existe
  const existingCode = await prisma.guestAccessCode.findUnique({
    where: { id },
    include: {
      guestSessions: {
        where: { status: 'ACTIVE' }
      }
    }
  });

  if (!existingCode) {
    res.status(404).json({
      success: false,
      message: 'Code d\'accès introuvable'
    });
    return;
  }

  // Vérifier s'il y a des sessions actives
  if (existingCode.guestSessions.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Impossible de supprimer un code avec des sessions actives',
      data: {
        activeSessions: existingCode.guestSessions.length
      }
    });
    return;
  }

  // Suppression
  await prisma.guestAccessCode.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Code d\'accès supprimé avec succès'
  });

  logger.info('Guest access code deleted', {
    codeId: id,
    deletedBy: (req as any).user.id,
    code: existingCode.code.substring(0, 3) + '*****'
  });
}));

/**
 * @route GET /api/admin/guest-sessions
 * @desc Liste toutes les sessions invités actives
 * @access Private (Admin+)
 */
router.get('/guest-sessions', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['ACTIVE', 'EXPIRED', 'TERMINATED', 'QUOTA_EXCEEDED']),
  query('search').optional().isString().trim()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de requête invalides');
  }

  const { 
    page = 1, 
    limit = 20, 
    status, 
    search 
  } = req.query as any;

  // Construction des filtres
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { ipAddress: { contains: search } },
      { accessCode: { code: { contains: search } } }
    ];
  }

  // Requêtes en parallèle
  const [sessions, totalCount] = await Promise.all([
    prisma.guestSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        accessCode: {
          select: {
            id: true,
            code: true,
            level: true,
            description: true
          }
        }
      }
    }),
    prisma.guestSession.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: {
      sessions: sessions.map(session => ({
        id: session.id,
        accessCode: {
          id: session.accessCode.id,
          code: session.accessCode.code,
          level: session.accessCode.level,
          description: session.accessCode.description
        },
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location,
        status: session.status,
        startedAt: session.startedAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        terminatedAt: session.terminatedAt,
        quotas: {
          dataQuotaMB: session.dataQuotaMB,
          timeQuotaMinutes: session.timeQuotaMinutes
        },
        consumption: {
          dataConsumedMB: session.dataConsumedMB,
          timeConsumedMinutes: session.timeConsumedMinutes
        },
        warnings: session.warningsSent ? JSON.parse(session.warningsSent) : null
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });

  logger.info('Guest sessions listed', {
    adminUserId: (req as any).user?.id,
    filters: { status, search },
    page,
    count: sessions.length
  });
}));

/**
 * @route DELETE /api/admin/guest-sessions/:id
 * @desc Termine une session invité
 * @access Private (Admin+)
 */
router.delete('/guest-sessions/:id', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Vérifier que la session existe
  const session = await prisma.guestSession.findUnique({
    where: { id },
    include: {
      accessCode: {
        select: { code: true }
      }
    }
  });

  if (!session) {
    res.status(404).json({
      success: false,
      message: 'Session introuvable'
    });
    return;
  }

  // Terminer la session
  const terminatedSession = await prisma.guestSession.update({
    where: { id },
    data: {
      status: 'TERMINATED',
      terminatedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Session terminée avec succès',
    data: {
      sessionId: terminatedSession.id,
      terminatedAt: terminatedSession.terminatedAt
    }
  });

  logger.info('Guest session terminated by admin', {
    sessionId: id,
    terminatedBy: (req as any).user.id,
    accessCode: session.accessCode.code.substring(0, 3) + '*****'
  });
}));

/**
 * @route GET /api/admin/guest-statistics
 * @desc Statistiques des codes d'accès et sessions invités
 * @access Private (Admin+)
 */
router.get('/guest-statistics', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Statistiques des codes
  const [
    totalCodes,
    activeCodes,
    expiredCodes,
    usedCodes,
    codesCreatedToday,
    codesCreatedThisWeek,
    codesByLevel
  ] = await Promise.all([
    prisma.guestAccessCode.count(),
    prisma.guestAccessCode.count({ where: { isActive: true, expiresAt: { gt: now } } }),
    prisma.guestAccessCode.count({ where: { expiresAt: { lte: now } } }),
    prisma.guestAccessCode.count({ where: { currentUses: { gt: 0 } } }),
    prisma.guestAccessCode.count({ where: { createdAt: { gte: today } } }),
    prisma.guestAccessCode.count({ where: { createdAt: { gte: thisWeek } } }),
    prisma.guestAccessCode.groupBy({
      by: ['level'],
      _count: { level: true }
    })
  ]);

  // Statistiques des sessions
  const [
    totalSessions,
    activeSessions,
    sessionsToday,
    sessionsThisWeek,
    sessionsByStatus
  ] = await Promise.all([
    prisma.guestSession.count(),
    prisma.guestSession.count({ where: { status: 'ACTIVE' } }),
    prisma.guestSession.count({ where: { startedAt: { gte: today } } }),
    prisma.guestSession.count({ where: { startedAt: { gte: thisWeek } } }),
    prisma.guestSession.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  // Calcul de la consommation totale
  const consumptionStats = await prisma.guestSession.aggregate({
    _sum: {
      dataConsumedMB: true,
      timeConsumedMinutes: true
    },
    _avg: {
      dataConsumedMB: true,
      timeConsumedMinutes: true
    }
  });

  // Top 10 des codes les plus utilisés
  const topCodes = await prisma.guestAccessCode.findMany({
    where: { currentUses: { gt: 0 } },
    orderBy: { currentUses: 'desc' },
    take: 10,
    select: {
      id: true,
      code: true,
      level: true,
      currentUses: true,
      maxUses: true,
      createdAt: true
    }
  });

  // Formatage des statistiques par niveau et statut
  const levelStats: Record<string, number> = {
    PREMIUM: 0,
    STANDARD: 0,
    BASIC: 0,
    CUSTOM: 0
  };

  codesByLevel.forEach(item => {
    levelStats[item.level] = item._count.level;
  });

  const statusStats: Record<string, number> = {
    ACTIVE: 0,
    EXPIRED: 0,
    TERMINATED: 0,
    QUOTA_EXCEEDED: 0
  };

  sessionsByStatus.forEach(item => {
    statusStats[item.status] = item._count.status;
  });

  res.json({
    success: true,
    data: {
      codes: {
        total: totalCodes,
        active: activeCodes,
        expired: expiredCodes,
        used: usedCodes,
        createdToday: codesCreatedToday,
        createdThisWeek: codesCreatedThisWeek,
        byLevel: levelStats,
        top: topCodes.map(code => ({
          id: code.id,
          code: code.code.substring(0, 3) + '*****',
          level: code.level,
          usageRate: `${code.currentUses}/${code.maxUses}`,
          createdAt: code.createdAt
        }))
      },
      sessions: {
        total: totalSessions,
        active: activeSessions,
        today: sessionsToday,
        thisWeek: sessionsThisWeek,
        byStatus: statusStats
      },
      consumption: {
        totalDataMB: consumptionStats._sum.dataConsumedMB || 0,
        totalTimeMinutes: consumptionStats._sum.timeConsumedMinutes || 0,
        avgDataMB: Math.round((consumptionStats._avg.dataConsumedMB || 0) * 100) / 100,
        avgTimeMinutes: Math.round((consumptionStats._avg.timeConsumedMinutes || 0) * 100) / 100
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          today: today.toISOString(),
          thisWeek: thisWeek.toISOString(),
          thisMonth: thisMonth.toISOString()
        }
      }
    }
  });

  logger.info('Guest statistics accessed', {
    adminUserId: (req as any).user?.id
  });
}));

// ==========================================
// ROUTES GESTION DES SAUVEGARDES
// ==========================================

/**
 * @swagger
 * /api/admin/backups:
 *   get:
 *     summary: Liste des sauvegardes
 *     description: Récupère la liste de toutes les sauvegardes disponibles avec leurs statistiques
 *     tags: [Admin, Backups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sauvegardes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     backups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Backup'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalBackups:
 *                           type: integer
 *                           description: Nombre total de sauvegardes
 *                         totalSize:
 *                           type: integer
 *                           description: Taille totale en octets
 *                         totalSizeFormatted:
 *                           type: string
 *                           description: Taille totale formatée
 *                         oldestBackup:
 *                           type: string
 *                           format: date-time
 *                           description: Date de la plus ancienne sauvegarde
 *                         newestBackup:
 *                           type: string
 *                           format: date-time
 *                           description: Date de la plus récente sauvegarde
 *                         compressionRatio:
 *                           type: number
 *                           description: Ratio de compression moyen
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/backups', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const backups = await backupService.listBackups();
  const stats = await backupService.getBackupStatistics();

  res.json({
    success: true,
    data: {
      backups: backups.map(backup => ({
        fileName: backup.fileName,
        size: backup.size,
        sizeFormatted: formatFileSize(backup.size),
        createdAt: backup.createdAt,
        compressed: backup.compressed,
        metadata: backup.metadata
      })),
      statistics: {
        totalBackups: stats.totalBackups,
        totalSize: stats.totalSize,
        totalSizeFormatted: formatFileSize(stats.totalSize),
        oldestBackup: stats.oldestBackup,
        newestBackup: stats.newestBackup,
        compressionRatio: stats.compressionRatio
      }
    }
  });

  logger.info('Backups listed', {
    adminUserId: (req as any).user?.id,
    backupCount: backups.length
  });
}));

/**
 * @swagger
 * /api/admin/backups:
 *   post:
 *     summary: Créer une sauvegarde
 *     description: Crée une nouvelle sauvegarde de la base de données
 *     tags: [Admin, Backups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 description: Description optionnelle de la sauvegarde
 *           example:
 *             description: "Sauvegarde avant migration"
 *     responses:
 *       201:
 *         description: Sauvegarde créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sauvegarde créée avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/Backup'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Erreur lors de la création de la sauvegarde
 */
router.post('/backups', authenticate, requireAdmin, [
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Description trop longue')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const { description } = req.body;

  const result = await backupService.createBackup(description);

  if (result.success) {
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        backupFile: result.backupFile,
        size: result.size,
        sizeFormatted: formatFileSize(result.size || 0),
        duration: result.duration
      }
    });

    logger.info('Backup created by admin', {
      adminUserId: (req as any).user?.id,
      backupFile: result.backupFile,
      size: result.size,
      description
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.message
    });
  }
}));

/**
 * @route POST /api/admin/backups/:fileName/restore
 * @desc Restaure une sauvegarde
 * @access Private (Super Admin)
 */
router.post('/backups/:fileName/restore', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { fileName } = req.params;

  // Validation du nom de fichier pour éviter les attaques de traversée de répertoire
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    res.status(400).json({
      success: false,
      message: 'Nom de fichier invalide'
    });
    return;
  }

  const result = await backupService.restoreBackup(fileName);

  if (result.success) {
    res.json({
      success: true,
      message: result.message,
      data: {
        tablesRestored: result.tablesRestored
      }
    });

    logger.info('Backup restored by admin', {
      adminUserId: (req as any).user?.id,
      backupFile: fileName,
      tablesRestored: result.tablesRestored
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.message
    });
  }
}));

/**
 * @route DELETE /api/admin/backups/:fileName
 * @desc Supprime une sauvegarde
 * @access Private (Super Admin)
 */
router.delete('/backups/:fileName', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { fileName } = req.params;

  // Validation du nom de fichier
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    res.status(400).json({
      success: false,
      message: 'Nom de fichier invalide'
    });
    return;
  }

  const result = await backupService.deleteBackup(fileName);

  if (result.success) {
    res.json({
      success: true,
      message: result.message
    });

    logger.info('Backup deleted by admin', {
      adminUserId: (req as any).user?.id,
      backupFile: fileName
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.message
    });
  }
}));

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default router;
