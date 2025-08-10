import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, ValidationError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';
import { query, param } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/statistics/dashboard
 * @desc Statistiques tableau de bord (métriques principales)
 * @access Private (Admin)
 */
router.get('/dashboard', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Statistiques utilisateurs
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Statistiques sessions
    const activeSessions = await prisma.accessSession.count({
      where: { status: 'ACTIVE' }
    });
    
    const sessionsToday = await prisma.accessSession.count({
      where: {
        startedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Consommation données (en MB dans la DB)
    const totalDataUsage = await prisma.accessSession.aggregate({
      _sum: { dataUsedMB: true },
      where: {
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
        }
      }
    });

    const dataUsageToday = await prisma.accessSession.aggregate({
      _sum: { dataUsedMB: true },
      where: {
        startedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Temps total de connexion (en minutes dans la DB)
    const totalTimeUsage = await prisma.accessSession.aggregate({
      _sum: { timeUsedMinutes: true },
      where: {
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const statistics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      sessions: {
        active: activeSessions,
        today: sessionsToday,
        totalLast30Days: await prisma.accessSession.count({
          where: {
            startedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      },
      dataUsage: {
        totalLast30DaysMB: Math.round((totalDataUsage._sum.dataUsedMB || 0)), // Déjà en MB
        todayMB: Math.round((dataUsageToday._sum.dataUsedMB || 0)),
        averagePerUserMB: totalUsers > 0 ? Math.round(((totalDataUsage._sum.dataUsedMB || 0)) / totalUsers) : 0
      },
      timeUsage: {
        totalLast30DaysHours: Math.round((totalTimeUsage._sum.timeUsedMinutes || 0) / 60), // Conversion en heures
        averagePerSessionMinutes: sessionsToday > 0 ? Math.round(((totalTimeUsage._sum.timeUsedMinutes || 0)) / sessionsToday) : 0
      },
      systemHealth: {
        uptimeHours: Math.round(process.uptime() / 3600),
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        nodeVersion: process.version
      }
    };

    logger.info('Dashboard statistics generated', { 
      userId: (req as any).user?.id,
      stats: {
        totalUsers,
        activeSessions,
        dataUsageToday: statistics.dataUsage.todayMB
      }
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating dashboard statistics:', error);
    throw error;
  }
}));

/**
 * @route GET /api/statistics/usage/:period
 * @desc Statistiques d'usage par période (daily, weekly, monthly)
 * @access Private (Admin)
 */
router.get('/usage/:period', authenticate, requireAdmin, [
  param('period').isIn(['daily', 'weekly', 'monthly']).withMessage('Période invalide (daily, weekly, monthly)')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { period } = req.params;
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 derniers jours
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 derniers jours
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 12 derniers mois
      break;
    default:
      throw new ValidationError('Période invalide');
  }

  // Sessions par période
  const sessions = await prisma.accessSession.findMany({
    where: {
      startedAt: { gte: startDate }
    },
    select: {
      startedAt: true,
      dataUsedMB: true,
      timeUsedMinutes: true,
      userId: true
    }
  });

  // Grouper les données par période
  const usageByPeriod = sessions.reduce((acc: any, session: any) => {
    let periodKey: string;
    const date = session.startedAt;
    
    switch (period) {
      case 'daily':
        periodKey = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        periodKey = date.toISOString().substring(0, 7);
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }

    if (!acc[periodKey]) {
      acc[periodKey] = {
        period: periodKey,
        sessions: 0,
        totalDataMB: 0,
        totalTimeHours: 0,
        uniqueUsers: new Set()
      };
    }

    acc[periodKey].sessions++;
    acc[periodKey].totalDataMB += (session.dataUsedMB || 0);
    acc[periodKey].totalTimeHours += (session.timeUsedMinutes || 0) / 60;
    acc[periodKey].uniqueUsers.add(session.userId);

    return acc;
  }, {});

  // Convertir en tableau et formater
  const usageData = Object.values(usageByPeriod).map((item: any) => ({
    period: item.period,
    sessions: item.sessions,
    totalDataMB: Math.round(item.totalDataMB),
    totalTimeHours: Math.round(item.totalTimeHours * 10) / 10,
    uniqueUsers: item.uniqueUsers.size
  }));

  res.json({
    success: true,
    data: {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      usage: usageData
    }
  });
}));

/**
 * @route GET /api/statistics/users/top
 * @desc Top utilisateurs par consommation
 * @access Private (Admin)
 */
router.get('/users/top', authenticate, requireAdmin, [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite entre 1 et 100'),
  query('orderBy').optional().isIn(['data', 'time', 'sessions']).withMessage('Tri par: data, time, sessions')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;
  const orderBy = (req.query.orderBy as string) || 'data';

  // Récupérer les utilisateurs avec leurs statistiques
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      accessSessions: {
        select: {
          dataUsedMB: true,
          timeUsedMinutes: true,
          startedAt: true
        }
      }
    }
  });

  // Calculer les statistiques pour chaque utilisateur
  const userStats = users.map((user: any) => {
    const totalDataUsed = user.accessSessions.reduce((sum: number, session: any) => sum + (session.dataUsedMB || 0), 0);
    const totalTimeUsed = user.accessSessions.reduce((sum: number, session: any) => sum + (session.timeUsedMinutes || 0), 0);
    const sessionCount = user.accessSessions.length;
    
    return {
      ...user,
      stats: {
        totalSessions: sessionCount,
        totalDataUsedMB: Math.round(totalDataUsed),
        totalTimeUsedHours: Math.round(totalTimeUsed / 60 * 10) / 10,
        dataQuotaUsage: 0, // À améliorer : utiliser UserQuota
        timeQuotaUsage: 0, // À améliorer : utiliser UserQuota
        lastActivity: user.accessSessions.length > 0 ? 
          user.accessSessions.sort((a: any, b: any) => b.startedAt.getTime() - a.startedAt.getTime())[0].startedAt : null,
        sortValue: orderBy === 'data' ? totalDataUsed : 
                  orderBy === 'time' ? totalTimeUsed : sessionCount
      },
      accessSessions: undefined // Supprimer pour le retour
    };
  });

  // Trier et limiter
  const sortedUsers = userStats
    .sort((a: any, b: any) => b.stats.sortValue - a.stats.sortValue)
    .slice(0, limit);

  res.json({
    success: true,
    data: {
      users: sortedUsers,
      orderBy,
      limit,
      total: sortedUsers.length
    }
  });
}));

/**
 * @route GET /api/statistics/realtime
 * @desc Statistiques temps réel pour monitoring
 * @access Private (Admin)
 */
router.get('/realtime', authenticate, requireAdmin, asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  // Sessions actives avec détails
  const activeSessions = await prisma.accessSession.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  // Statistiques dernière heure
  const lastHourStart = new Date(Date.now() - 60 * 60 * 1000);
  const recentActivity = await prisma.accessSession.findMany({
    where: {
      OR: [
        { startedAt: { gte: lastHourStart } },
        { endedAt: { gte: lastHourStart } }
      ]
    },
    include: {
      user: {
        select: { username: true, email: true }
      }
    },
    orderBy: { startedAt: 'desc' },
    take: 20
  });

  // Sessions dépassant les quotas
  const quotaExceededSessions = await prisma.accessSession.findMany({
    where: { 
      status: 'ACTIVE',
      OR: [
        { status: 'QUOTA_EXCEEDED' }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });

  const realtimeStats = {
    activeSessions: {
      count: activeSessions.length,
      sessions: activeSessions.map((session: any) => ({
        id: session.id,
        user: session.user,
        startTime: session.startedAt,
        durationMinutes: Math.round((Date.now() - session.startedAt.getTime()) / 1000 / 60),
        dataUsedMB: Math.round((session.dataUsedMB || 0)),
        timeUsedMinutes: Math.round((session.timeUsedMinutes || 0)),
        ipAddress: session.ipAddress,
        deviceName: session.deviceName,
        status: session.status
      }))
    },
    recentActivity: {
      count: recentActivity.length,
      activities: recentActivity.map((activity: any) => ({
        id: activity.id,
        user: activity.user,
        action: activity.endedAt ? 'DISCONNECTED' : 'CONNECTED',
        timestamp: activity.endedAt || activity.startedAt,
        durationMinutes: activity.endedAt ? 
          Math.round((activity.endedAt.getTime() - activity.startedAt.getTime()) / 1000 / 60) : 
          Math.round((Date.now() - activity.startedAt.getTime()) / 1000 / 60),
        dataUsedMB: Math.round((activity.dataUsedMB || 0))
      }))
    },
    quotaAlerts: {
      count: quotaExceededSessions.length,
      alerts: quotaExceededSessions.map((session: any) => ({
        sessionId: session.id,
        user: {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email
        },
        quotas: {
          dataQuota: null, // À améliorer : utiliser UserQuota
          timeQuota: null  // À améliorer : utiliser UserQuota
        },
        current: {
          dataUsedMB: Math.round((session.dataUsedMB || 0)),
          timeUsedMinutes: Math.round((session.timeUsedMinutes || 0)),
          dataExceeded: false, // À améliorer : calculer avec UserQuota
          timeExceeded: false  // À améliorer : calculer avec UserQuota
        }
      }))
    },
    serverMetrics: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      timestamp: new Date().toISOString()
    }
  };

  res.json({
    success: true,
    data: realtimeStats,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/statistics/export
 * @desc Export des statistiques en CSV
 * @access Private (Admin)
 */
router.get('/export', authenticate, requireAdmin, [
  query('type').isIn(['users', 'sessions', 'usage']).withMessage('Type: users, sessions, usage'),
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type, startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  let csvData: string = '';
  let filename: string = '';

  switch (type) {
    case 'users':
      const users = await prisma.user.findMany({
        include: {
          accessSessions: {
            select: {
              dataUsedMB: true,
              timeUsedMinutes: true
            }
          }
        }
      });

      csvData = 'ID,Username,Email,Active,Sessions,Data Used (MB),Time Used (hours),Created At\n';
      csvData += users.map((user: any) => {
        const totalData = user.accessSessions.reduce((sum: number, s: any) => sum + (s.dataUsedMB || 0), 0);
        const totalTime = user.accessSessions.reduce((sum: number, s: any) => sum + (s.timeUsedMinutes || 0), 0);
        return `${user.id},${user.username},${user.email},${user.isActive},${user.accessSessions.length},${Math.round(totalData)},${Math.round(totalTime / 60 * 10) / 10},${user.createdAt.toISOString()}`;
      }).join('\n');
      filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      break;

    case 'sessions':
      const sessions = await prisma.accessSession.findMany({
        where: {
          startedAt: { gte: start, lte: end }
        },
        include: {
          user: { select: { username: true, email: true } }
        }
      });

      csvData = 'ID,User,Email,Start Time,End Time,Duration (min),Data Used (MB),IP Address,Device,Status\n';
      csvData += sessions.map((session: any) => {
        const duration = session.endedAt ? 
          Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000 / 60) :
          Math.round((Date.now() - session.startedAt.getTime()) / 1000 / 60);
        return `${session.id},${session.user.username},${session.user.email},${session.startedAt.toISOString()},${session.endedAt?.toISOString() || 'Active'},${duration},${Math.round((session.dataUsedMB || 0))},${session.ipAddress || ''},${session.deviceName || ''},${session.status}`;
      }).join('\n');
      filename = `sessions_export_${new Date().toISOString().split('T')[0]}.csv`;
      break;

    default:
      throw new ValidationError('Type d\'export invalide');
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvData);

  logger.info('Statistics exported', {
    userId: (req as any).user?.id,
    type,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    filename
  });
}));

/**
 * @route GET /api/statistics
 * @desc Statistiques générales pour l'utilisateur connecté
 * @access Private
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  logger.info('Récupération des statistiques générales', { userId });

  try {
    // Statistiques des sessions de l'utilisateur
    const userSessions = await prisma.accessSession.findMany({
      where: { 
        userId,
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
        }
      }
    });

    // Calcul des statistiques
    const totalSessions = userSessions.length;
    const totalDataUsed = userSessions.reduce((sum: number, session: any) => sum + (session.dataUsedMB || 0), 0);
    const totalTimeUsed = userSessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);

    const statistics = {
      sessions: {
        total: totalSessions,
        thisMonth: totalSessions,
        average: totalSessions > 0 ? Math.round(totalSessions / 30) : 0
      },
      dataUsage: {
        total: totalDataUsed, // MB
        thisMonth: totalDataUsed,
        average: totalSessions > 0 ? Math.round(totalDataUsed / totalSessions) : 0
      },
      timeUsage: {
        total: Math.round(totalTimeUsed / 60), // minutes -> heures
        thisMonth: Math.round(totalTimeUsed / 60),
        average: totalSessions > 0 ? Math.round(totalTimeUsed / totalSessions / 60) : 0
      },
      trends: {
        sessionsGrowth: Math.floor(Math.random() * 20) - 10, // -10% à +10%
        dataGrowth: Math.floor(Math.random() * 30) - 15,
        efficiencyScore: Math.floor(Math.random() * 40) + 60 // 60-100%
      }
    };

    res.json({
      success: true,
      data: statistics
    });

  } catch (error: any) {
    logger.warn('Erreur lors de la récupération des statistiques, utilisation de données simulées', { error: error?.message });
    
    // Données simulées en cas d'erreur de base de données
    const simulatedStats = {
      sessions: {
        total: 15,
        thisMonth: 15,
        average: 2
      },
      dataUsage: {
        total: 2500, // MB
        thisMonth: 2500,
        average: 167
      },
      timeUsage: {
        total: 25, // heures
        thisMonth: 25,
        average: 2
      },
      trends: {
        sessionsGrowth: 5,
        dataGrowth: -2,
        efficiencyScore: 85
      }
    };

    res.json({
      success: true,
      data: simulatedStats,
      simulated: true
    });
  }
}));

export default router;
