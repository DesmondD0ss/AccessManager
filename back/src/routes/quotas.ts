import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';
import { quotaService } from '../services/quotaService.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/quotas/settings
 * @desc Récupérer les paramètres de quotas par défaut
 * @access Private (Admin)
 */
router.get('/settings', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const settings = {
    defaultDataQuotaMB: Math.round(appConfig.quotas.defaultData / 1024 / 1024),
    defaultTimeQuotaHours: Math.round(appConfig.quotas.defaultTime / 3600),
    maxConcurrentUsers: appConfig.quotas.maxConcurrentUsers,
    quotaEnforcement: {
      dataEnabled: true,
      timeEnabled: true,
      warningThresholds: {
        data: 80, // 80% du quota
        time: 80
      }
    }
  };

  res.json({
    success: true,
    data: { settings }
  });
}));

/**
 * @route PUT /api/quotas/settings
 * @desc Mettre à jour les paramètres de quotas par défaut
 * @access Private (Admin)
 */
router.put('/settings', authenticate, requireAdmin, [
  body('defaultDataQuotaMB').optional().isInt({ min: 1 }).withMessage('Quota data doit être positif'),
  body('defaultTimeQuotaHours').optional().isInt({ min: 1 }).withMessage('Quota temps doit être positif'),
  body('maxConcurrentUsers').optional().isInt({ min: 1 }).withMessage('Utilisateurs simultanés doit être positif')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de quotas invalides');
  }

  // Note: Ces paramètres seraient normalement sauvés dans une table de configuration
  // Pour l'instant, on retourne juste les nouvelles valeurs
  const { defaultDataQuotaMB, defaultTimeQuotaHours, maxConcurrentUsers } = req.body;

  const updatedSettings = {
    defaultDataQuotaMB: defaultDataQuotaMB || Math.round(appConfig.quotas.defaultData / 1024 / 1024),
    defaultTimeQuotaHours: defaultTimeQuotaHours || Math.round(appConfig.quotas.defaultTime / 3600),
    maxConcurrentUsers: maxConcurrentUsers || appConfig.quotas.maxConcurrentUsers,
    quotaEnforcement: {
      dataEnabled: true,
      timeEnabled: true,
      warningThresholds: {
        data: 80,
        time: 80
      }
    }
  };

  res.json({
    success: true,
    data: { settings: updatedSettings },
    message: 'Paramètres de quotas mis à jour'
  });

  logger.info('Quota settings updated', {
    adminUserId: (req as any).user?.id,
    newSettings: updatedSettings
  });
}));

/**
 * @route GET /api/quotas/users
 * @desc Liste des utilisateurs avec leur usage de quotas
 * @access Private (Admin)
 */
router.get('/users', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite entre 1 et 100'),
  query('status').optional().isIn(['normal', 'warning', 'exceeded', 'all']).withMessage('Statut: normal, warning, exceeded, all'),
  query('sortBy').optional().isIn(['dataUsage', 'timeUsage', 'username']).withMessage('Tri invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string || 'all';
  const sortBy = req.query.sortBy as string || 'dataUsage';
  const skip = (page - 1) * limit;

  // Récupération des utilisateurs avec leurs statistiques d'usage
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      accessSessions: {
        where: {
          startedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        },
        select: {
          dataUsedMB: true,
          timeUsedMinutes: true,
          status: true
        }
      }
    }
  });

  // Calcul des statistiques pour chaque utilisateur
  const usersWithQuotas = users.map((user: any) => {
    const totalDataUsed = user.accessSessions.reduce((sum: number, session: any) => sum + (session.dataUsedMB || 0), 0);
    const totalTimeUsed = user.accessSessions.reduce((sum: number, session: any) => sum + (session.timeUsedMinutes || 0), 0);
    
    // Utiliser des quotas par défaut (à améliorer avec UserQuota)
    const defaultDataQuotaMB = Math.round(appConfig.quotas.defaultData / 1024 / 1024);
    const defaultTimeQuotaMinutes = Math.round(appConfig.quotas.defaultTime / 60);
    
    const dataUsagePercent = Math.round((totalDataUsed / defaultDataQuotaMB) * 100);
    const timeUsagePercent = Math.round((totalTimeUsed / defaultTimeQuotaMinutes) * 100);
    
    let quotaStatus = 'normal';
    if (dataUsagePercent >= 100 || timeUsagePercent >= 100) {
      quotaStatus = 'exceeded';
    } else if (dataUsagePercent >= 80 || timeUsagePercent >= 80) {
      quotaStatus = 'warning';
    }

    const activeSessions = user.accessSessions.filter((s: any) => s.status === 'ACTIVE').length;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      quotas: {
        dataQuotaMB: defaultDataQuotaMB,
        timeQuotaHours: Math.round(defaultTimeQuotaMinutes / 60),
        dataUsedMB: Math.round(totalDataUsed),
        timeUsedHours: Math.round(totalTimeUsed / 60 * 10) / 10,
        dataUsagePercent,
        timeUsagePercent,
        status: quotaStatus
      },
      activeSessions,
      sortValue: sortBy === 'dataUsage' ? dataUsagePercent : 
                 sortBy === 'timeUsage' ? timeUsagePercent : 
                 user.username.toLowerCase()
    };
  });

  // Filtrage par statut
  let filteredUsers = usersWithQuotas;
  if (status !== 'all') {
    filteredUsers = usersWithQuotas.filter((user: any) => user.quotas.status === status);
  }

  // Tri
  if (sortBy === 'username') {
    filteredUsers.sort((a: any, b: any) => a.sortValue.localeCompare(b.sortValue));
  } else {
    filteredUsers.sort((a: any, b: any) => (b.sortValue as number) - (a.sortValue as number));
  }

  // Pagination
  const totalCount = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(skip, skip + limit);
  const totalPages = Math.ceil(totalCount / limit);

  // Supprimer sortValue du retour
  const cleanUsers = paginatedUsers.map((user: any) => {
    const { sortValue, ...cleanUser } = user;
    return cleanUser;
  });

  res.json({
    success: true,
    data: {
      users: cleanUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        total: usersWithQuotas.length,
        normal: usersWithQuotas.filter((u: any) => u.quotas.status === 'normal').length,
        warning: usersWithQuotas.filter((u: any) => u.quotas.status === 'warning').length,
        exceeded: usersWithQuotas.filter((u: any) => u.quotas.status === 'exceeded').length
      }
    }
  });
}));

/**
 * @route PUT /api/quotas/users/:id
 * @desc Modifier les quotas d'un utilisateur spécifique
 * @access Private (Admin)
 */
router.put('/users/:id', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis'),
  body('dataQuotaMB').optional().isInt({ min: 0 }).withMessage('Quota data doit être positif ou nul'),
  body('timeQuotaHours').optional().isInt({ min: 0 }).withMessage('Quota temps doit être positif ou nul'),
  body('resetUsage').optional().isBoolean().withMessage('Reset usage doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de quotas invalides');
  }

  const { id } = req.params;
  const { dataQuotaMB, timeQuotaHours, resetUsage } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Note: Pour l'instant, on simule les quotas avec des valeurs par défaut
  // À améliorer: utiliser la table UserQuota
  
  const updatedUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true
    }
  });

  // Optionnel: Reset de l'usage actuel
  if (resetUsage) {
    await prisma.accessSession.updateMany({
      where: { 
        userId: id,
        status: 'ACTIVE'
      },
      data: {
        dataUsedMB: 0,
        timeUsedMinutes: 0
      }
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: updatedUser!.id,
        username: updatedUser!.username,
        dataQuotaMB: dataQuotaMB || Math.round(appConfig.quotas.defaultData / 1024 / 1024),
        timeQuotaHours: timeQuotaHours || Math.round(appConfig.quotas.defaultTime / 3600)
      }
    },
    message: 'Quotas utilisateur mis à jour avec succès'
  });

  logger.info('User quotas updated', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    newDataQuota: dataQuotaMB,
    newTimeQuota: timeQuotaHours,
    resetUsage
  });
}));

/**
 * @route POST /api/quotas/users/:id/reset
 * @desc Réinitialiser l'usage des quotas pour un utilisateur
 * @access Private (Admin)
 */
router.post('/users/:id/reset', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis'),
  body('resetData').optional().isBoolean().withMessage('Reset data doit être un booléen'),
  body('resetTime').optional().isBoolean().withMessage('Reset time doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { resetData = true, resetTime = true } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const updateData: any = {};
  if (resetData) updateData.dataUsedMB = 0;
  if (resetTime) updateData.timeUsedMinutes = 0;

  // Reset des sessions actives
  await prisma.accessSession.updateMany({
    where: { 
      userId: id,
      status: 'ACTIVE'
    },
    data: updateData
  });

  // Stats avant/après reset pour le log
  const sessionsUpdated = await prisma.accessSession.count({
    where: { 
      userId: id,
      status: 'ACTIVE'
    }
  });

  res.json({
    success: true,
    data: {
      userId: id,
      username: user.username,
      resetData,
      resetTime,
      sessionsAffected: sessionsUpdated
    },
    message: 'Usage des quotas réinitialisé avec succès'
  });

  logger.info('User quota usage reset', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    targetUsername: user.username,
    resetData,
    resetTime,
    sessionsAffected: sessionsUpdated
  });
}));

/**
 * @route POST /api/quotas/bulk-update
 * @desc Mise à jour en masse des quotas
 * @access Private (Admin)
 */
router.post('/bulk-update', authenticate, requireAdmin, [
  body('userIds').isArray({ min: 1 }).withMessage('Liste d\'IDs utilisateurs requise'),
  body('userIds.*').isString().withMessage('Chaque ID utilisateur doit être une chaîne'),
  body('dataQuotaMB').optional().isInt({ min: 0 }).withMessage('Quota data doit être positif ou nul'),
  body('timeQuotaHours').optional().isInt({ min: 0 }).withMessage('Quota temps doit être positif ou nul')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de mise à jour invalides');
  }

  const { userIds, dataQuotaMB, timeQuotaHours } = req.body;

  if (!dataQuotaMB && !timeQuotaHours) {
    throw new ValidationError('Au moins un quota doit être spécifié');
  }

  const updateData: any = {};
  if (dataQuotaMB !== undefined) {
    updateData.dataQuota = dataQuotaMB * 1024 * 1024;
  }
  if (timeQuotaHours !== undefined) {
    updateData.timeQuota = timeQuotaHours * 3600;
  }

  // Vérifier que tous les utilisateurs existent
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true }
  });

  if (existingUsers.length !== userIds.length) {
    const missingIds = userIds.filter((id: string) => !existingUsers.find((u: any) => u.id === id));
    throw new NotFoundError(`Utilisateurs non trouvés: ${missingIds.join(', ')}`);
  }

  // Mise à jour en masse
  const updateResult = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      usersUpdated: updateResult.count,
      updatedQuotas: {
        dataQuotaMB: dataQuotaMB || 'unchanged',
        timeQuotaHours: timeQuotaHours || 'unchanged'
      }
    },
    message: `${updateResult.count} utilisateurs mis à jour avec succès`
  });

  logger.info('Bulk quota update', {
    adminUserId: (req as any).user?.id,
    userIds,
    usersUpdated: updateResult.count,
    newDataQuota: updateData.dataQuota,
    newTimeQuota: updateData.timeQuota
  });
}));

/**
 * @route GET /api/quotas/analytics
 * @desc Analyses et statistiques des quotas
 * @access Private (Admin)
 */
router.get('/analytics', authenticate, requireAdmin, [
  query('period').optional().isIn(['today', 'week', 'month']).withMessage('Période: today, week, month')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const period = req.query.period as string || 'month';
  
  let startDate: Date;
  switch (period) {
    case 'today':
      startDate = new Date(new Date().setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Statistiques générales
  const [totalUsers, activeUsers, totalSessions] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ 
      where: { 
        isActive: true,
        accessSessions: {
          some: {
            startedAt: { gte: startDate }
          }
        }
      }
    }),
    prisma.accessSession.count({
      where: { startedAt: { gte: startDate } }
    })
  ]);

  // Consommation totale
  const totalUsage = await prisma.accessSession.aggregate({
    where: { startedAt: { gte: startDate } },
    _sum: {
      dataUsedMB: true,
      timeUsedMinutes: true
    }
  });

  // Utilisateurs par statut de quota
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      accessSessions: {
        where: { startedAt: { gte: startDate } },
        select: {
          dataUsedMB: true,
          timeUsedMinutes: true
        }
      }
    }
  });

  let normalUsers = 0;
  let warningUsers = 0;
  let exceededUsers = 0;

  allUsers.forEach((user: any) => {
    const totalDataUsed = user.accessSessions.reduce((sum: number, s: any) => sum + (s.dataUsedMB || 0), 0);
    const totalTimeUsed = user.accessSessions.reduce((sum: number, s: any) => sum + (s.timeUsedMinutes || 0), 0);
    
    // Utiliser quotas par défaut
    const defaultDataQuotaMB = Math.round(appConfig.quotas.defaultData / 1024 / 1024);
    const defaultTimeQuotaMinutes = Math.round(appConfig.quotas.defaultTime / 60);
    
    const dataPercent = (totalDataUsed / defaultDataQuotaMB) * 100;
    const timePercent = (totalTimeUsed / defaultTimeQuotaMinutes) * 100;
    
    if (dataPercent >= 100 || timePercent >= 100) {
      exceededUsers++;
    } else if (dataPercent >= 80 || timePercent >= 80) {
      warningUsers++;
    } else {
      normalUsers++;
    }
  });

  // Top utilisateurs consommateurs
  const topDataUsers = await prisma.accessSession.groupBy({
    by: ['userId'],
    where: { startedAt: { gte: startDate } },
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
    topDataUsers.map(async (item: any) => {
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

  const analytics = {
    period,
    dateRange: {
      start: startDate.toISOString(),
      end: new Date().toISOString()
    },
    overview: {
      totalUsers,
      activeUsers,
      totalSessions,
      totalDataUsedMB: Math.round((totalUsage._sum?.dataUsedMB || 0)),
      totalTimeUsedHours: Math.round((totalUsage._sum?.timeUsedMinutes || 0) / 60 * 10) / 10,
      averageDataPerUserMB: activeUsers > 0 ? Math.round(((totalUsage._sum?.dataUsedMB || 0)) / activeUsers) : 0,
      averageTimePerUserHours: activeUsers > 0 ? Math.round(((totalUsage._sum?.timeUsedMinutes || 0) / 60) / activeUsers * 10) / 10 : 0
    },
    quotaStatus: {
      normal: normalUsers,
      warning: warningUsers,
      exceeded: exceededUsers,
      normalPercent: Math.round((normalUsers / totalUsers) * 100),
      warningPercent: Math.round((warningUsers / totalUsers) * 100),
      exceededPercent: Math.round((exceededUsers / totalUsers) * 100)
    },
    topConsumers: enrichedTopUsers.filter(u => u.user) // Filtrer les utilisateurs supprimés
  };

  res.json({
    success: true,
    data: { analytics }
  });

  logger.info('Quota analytics generated', {
    adminUserId: (req as any).user?.id,
    period,
    totalUsers,
    exceededUsers
  });
}));

/**
 * @route GET /api/quotas/users/:id/detailed
 * @desc Obtenir les quotas détaillés d'un utilisateur avec le nouveau service
 * @access Private (Admin)
 */
router.get('/users/:id/detailed', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Utiliser le nouveau service de quotas
  const quotaDetails = await quotaService.getUserQuotas(id);
  const canStart = await quotaService.canStartSession(id);

  res.json({
    success: true,
    data: {
      user,
      quotas: quotaDetails,
      sessionPermission: canStart
    }
  });

  logger.info('Detailed quota info retrieved', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    quotaStatus: quotaDetails.status
  });
}));

/**
 * @route PUT /api/quotas/users/:id/custom
 * @desc Configurer des quotas personnalisés pour un utilisateur
 * @access Private (Admin)
 */
router.put('/users/:id/custom', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis'),
  body('dailyLimitMB').optional().isInt({ min: 1 }).withMessage('Limite quotidienne data doit être positive'),
  body('dailyTimeMinutes').optional().isInt({ min: 1 }).withMessage('Limite quotidienne temps doit être positive'),
  body('weeklyLimitMB').optional().isInt({ min: 1 }).withMessage('Limite hebdomadaire data doit être positive'),
  body('monthlyLimitMB').optional().isInt({ min: 1 }).withMessage('Limite mensuelle data doit être positive'),
  body('validFrom').optional().isISO8601().withMessage('Date de début invalide'),
  body('validUntil').optional().isISO8601().withMessage('Date de fin invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de quotas personnalisés invalides');
  }

  const { id } = req.params;
  const { 
    dailyLimitMB, 
    dailyTimeMinutes, 
    weeklyLimitMB, 
    monthlyLimitMB, 
    validFrom, 
    validUntil 
  } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Configurer les quotas personnalisés
  await quotaService.setUserQuota({
    userId: id,
    dailyLimitMB,
    dailyTimeMinutes,
    weeklyLimitMB,
    monthlyLimitMB,
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : null
  });

  // Récupérer les quotas mis à jour
  const updatedQuotas = await quotaService.getUserQuotas(id);

  res.json({
    success: true,
    data: {
      user,
      quotas: updatedQuotas
    },
    message: 'Quotas personnalisés configurés avec succès'
  });

  logger.info('Custom quotas configured', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    targetUsername: user.username,
    dailyLimitMB,
    dailyTimeMinutes
  });
}));

/**
 * @route GET /api/quotas
 * @desc Obtenir les quotas de l'utilisateur connecté
 * @access Private
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  logger.info('Récupération des quotas utilisateur', { userId });

  // Récupérer les quotas depuis la base de données
  const userQuotas = await prisma.userQuota.findFirst({
    where: { userId }
  });

  // Si pas de quotas définis, retourner des valeurs par défaut
  const defaultQuotas = {
    dataLimit: Math.round(appConfig.quotas.defaultData / 1024 / 1024), // MB
    timeLimit: Math.round(appConfig.quotas.defaultTime / 60), // minutes
    dataUsed: 0,
    timeUsed: 0
  };

  const quotas = userQuotas ? {
    dataLimit: Math.round((userQuotas.dailyLimitMB || appConfig.quotas.defaultData / 1024 / 1024)),
    timeLimit: Math.round((userQuotas.dailyTimeMinutes || appConfig.quotas.defaultTime / 60)),
    dataUsed: Math.round((userQuotas.currentDailyMB || 0)),
    timeUsed: Math.round((userQuotas.currentDailyMinutes || 0))
  } : defaultQuotas;

  // Créer un tableau de quotas avec des données par défaut pour l'affichage
  const quotasArray = [
    {
      id: 'data_quota',
      type: 'data',
      name: 'Quota de données',
      limit: quotas.dataLimit,
      used: quotas.dataUsed,
      unit: 'MB',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Reset demain
      isActive: true
    },
    {
      id: 'time_quota',
      type: 'time', 
      name: 'Quota de temps',
      limit: quotas.timeLimit,
      used: quotas.timeUsed,
      unit: 'min',
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Reset demain
      isActive: true
    }
  ];

  res.json({
    success: true,
    data: quotasArray
  });
}));

export default router;
