import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Enum SessionStatus local (à synchroniser avec Prisma)
enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

// Interface pour les paramètres de session
interface SessionParams {
  macAddress?: string;
  ipAddress?: string;
  deviceName?: string;
  userAgent?: string;
  location?: string;
}

/**
 * @route GET /api/sessions/current
 * @desc Obtenir la session active de l'utilisateur connecté
 * @access Private
 */
router.get('/current', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id; // Le middleware authenticate garantit que user existe
    
    const currentSession = await prisma.accessSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        accessCode: true,
      },
    });

    res.json({
      success: true,
      data: currentSession,
      message: currentSession ? 'Session active trouvée' : 'Aucune session active',
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la session courante:', error);
    next(new AppError('Erreur lors de la récupération de la session', 500));
  }
});

/**
 * @route GET /api/sessions/recent
 * @desc Obtenir les sessions récentes de l'utilisateur
 * @access Private
 */
router.get('/recent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id; // Le middleware authenticate garantit que user existe
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const recentSessions = await prisma.accessSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        accessCode: true,
      },
    });

    const totalSessions = await prisma.accessSession.count({
      where: { userId },
    });

    res.json({
      success: true,
      data: recentSessions,
      pagination: {
        total: totalSessions,
        limit,
        offset,
        hasMore: offset + limit < totalSessions,
      },
      message: 'Sessions récentes récupérées avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des sessions récentes:', error);
    next(new AppError('Erreur lors de la récupération des sessions', 500));
  }
});

/**
 * @route POST /api/sessions/connect
 * @desc Démarrer une nouvelle session d'accès
 * @access Private
 */
router.post('/connect', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id; // Le middleware authenticate garantit que user existe
    const sessionParams: SessionParams = req.body;

    // Vérifier s'il y a déjà une session active
    const existingSession = await prisma.accessSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
    });

    if (existingSession) {
      res.status(409).json({
        success: false,
        message: 'Une session est déjà active pour cet utilisateur',
        data: existingSession,
      });
      return;
    }

    // Récupérer les quotas de l'utilisateur
    const userQuota = await prisma.userQuota.findFirst({
      where: {
        userId,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
    });

    // Vérifier les quotas
    if (userQuota) {
      if (userQuota.dailyLimitMB && userQuota.currentDailyMB >= userQuota.dailyLimitMB) {
        res.status(429).json({
          success: false,
          message: 'Quota journalier épuisé',
        });
        return;
      }
    }

    // Créer une nouvelle session
    const newSession = await prisma.accessSession.create({
      data: {
        userId,
        ipAddress: sessionParams.ipAddress || req.ip || 'unknown',
        macAddress: sessionParams.macAddress || null,
        deviceName: sessionParams.deviceName || null,
        userAgent: sessionParams.userAgent || req.get('User-Agent') || null,
        location: sessionParams.location || null,
        status: SessionStatus.ACTIVE,
        startedAt: new Date(),
        lastActiveAt: new Date(),
        dataUsedMB: 0,
        timeUsedMinutes: 0,
        dataQuotaMB: userQuota?.dailyLimitMB || null,
        timeQuotaMinutes: userQuota?.dailyTimeMinutes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Autoriser l'accès réseau via le script
    if (sessionParams.macAddress && sessionParams.ipAddress) {
      try {
        await execAsync(`/opt/gais/scripts/network-manager.sh allow ${sessionParams.macAddress} ${sessionParams.ipAddress}`);
        logger.info(`Accès réseau autorisé pour ${sessionParams.macAddress}`);
      } catch (error) {
        logger.error('Erreur lors de l\'autorisation réseau:', error);
      }
    }

    logger.info(`Nouvelle session créée pour l'utilisateur ${userId}`);

    res.status(201).json({
      success: true,
      data: newSession,
      message: 'Session créée avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la création de session:', error);
    next(new AppError('Erreur lors de la création de session', 500));
  }
});

/**
 * @route POST /api/sessions/:sessionId/disconnect
 * @desc Terminer une session d'accès
 * @access Private
 */
router.post('/:sessionId/disconnect', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id; // Le middleware authenticate garantit que user existe

    const session = await prisma.accessSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session non trouvée',
      });
      return;
    }

    // Vérifier que l'utilisateur peut terminer cette session
    if (session.userId !== userId && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Non autorisé à terminer cette session',
      });
      return;
    }

    if (session.status !== SessionStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        message: 'La session n\'est pas active',
      });
      return;
    }

    // Calculer le temps de session
    const sessionDuration = Date.now() - session.startedAt.getTime();
    const timeUsedMinutes = Math.floor(sessionDuration / (1000 * 60));

    // Mettre à jour la session
    const updatedSession = await prisma.accessSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.TERMINATED,
        endedAt: new Date(),
        timeUsedMinutes: Math.max(session.timeUsedMinutes, timeUsedMinutes),
      },
    });

    // Révoquer l'accès réseau
    if (session.macAddress && session.ipAddress) {
      try {
        await execAsync(`/opt/gais/scripts/network-manager.sh deny ${session.macAddress} ${session.ipAddress}`);
        logger.info(`Accès réseau révoqué pour ${session.macAddress}`);
      } catch (error) {
        logger.error('Erreur lors de la révocation réseau:', error);
      }
    }

    logger.info(`Session ${sessionId} terminée par l'utilisateur ${userId}`);

    res.json({
      success: true,
      data: updatedSession,
      message: 'Session terminée avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error);
    next(new AppError('Erreur lors de la déconnexion', 500));
  }
});

/**
 * @route GET /api/sessions/active
 * @desc Obtenir toutes les sessions actives (Admin)
 * @access Admin
 */
router.get('/active', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const activeSessions = await prisma.accessSession.findMany({
      where: { status: SessionStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        accessCode: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    res.json({
      success: true,
      data: activeSessions,
      message: 'Sessions actives récupérées avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des sessions actives:', error);
    next(new AppError('Erreur lors de la récupération des sessions', 500));
  }
});

/**
 * @route POST /api/sessions/:sessionId/update-usage
 * @desc Mettre à jour l'utilisation d'une session (tâche automatique)
 * @access Private (API Key)
 */
router.post('/:sessionId/update-usage', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { dataUsedMB, timeUsedMinutes } = req.body;

    const session = await prisma.accessSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session non trouvée',
      });
      return;
    }

    if (session.status !== SessionStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        message: 'La session n\'est pas active',
      });
      return;
    }

    // Mettre à jour la session
    const updatedSession = await prisma.accessSession.update({
      where: { id: sessionId },
      data: {
        dataUsedMB: Math.max(session.dataUsedMB, dataUsedMB || 0),
        timeUsedMinutes: Math.max(session.timeUsedMinutes, timeUsedMinutes || 0),
        lastActiveAt: new Date(),
      },
    });

    // Mettre à jour les quotas utilisateur
    if (session.userId) {
      await updateUserQuotaUsage(session.userId, dataUsedMB || 0);
    }

    // Vérifier les limites de quota
    if (session.dataQuotaMB && updatedSession.dataUsedMB >= session.dataQuotaMB) {
      await prisma.accessSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.QUOTA_EXCEEDED },
      });

      // Révoquer l'accès réseau
      if (session.macAddress && session.ipAddress) {
        try {
          await execAsync(`/opt/gais/scripts/network-manager.sh deny ${session.macAddress} ${session.ipAddress}`);
        } catch (error) {
          logger.error('Erreur lors de la révocation pour quota dépassé:', error);
        }
      }
    }

    res.json({
      success: true,
      data: updatedSession,
      message: 'Utilisation mise à jour avec succès',
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour d\'utilisation:', error);
    next(new AppError('Erreur lors de la mise à jour', 500));
  }
});

/**
 * Fonction utilitaire pour mettre à jour l'utilisation des quotas
 */
async function updateUserQuotaUsage(userId: string, additionalDataMB: number) {
  const userQuota = await prisma.userQuota.findFirst({
    where: {
      userId,
      isActive: true,
      validFrom: { lte: new Date() },
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } },
      ],
    },
  });

  if (userQuota) {
    await prisma.userQuota.update({
      where: { id: userQuota.id },
      data: {
        currentDailyMB: { increment: additionalDataMB },
        currentWeeklyMB: { increment: additionalDataMB },
        currentMonthlyMB: { increment: additionalDataMB },
      },
    });
  }
}

export default router;
