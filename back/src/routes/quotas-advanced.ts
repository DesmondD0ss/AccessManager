import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/quotas/advanced/users/:userId/detailed
 * Obtenir les quotas détaillés d'un utilisateur avec historique
 */
router.get('/users/:userId/detailed', async (req, res) => {
  try {
    const { userId } = req.params;
    const quotaService = req.services?.quotaService;

    if (!quotaService) {
      return res.status(500).json({ error: 'Service quotas non disponible' });
    }

    // Récupérer les quotas actuels
    const currentQuotas = await quotaService.getUserQuotas(userId);

    // Historique des 7 derniers jours
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const usage = await quotaService.getUsageHistory(userId, weekAgo, new Date());

    // Prédictions d'usage
    const predictions = await quotaService.getPredictions(userId);

    return res.json({
      success: true,
      data: {
        current: currentQuotas,
        history: usage,
        predictions,
        trends: {
          dataUsageTrend: usage.dailyUsage.map((d: any) => d.dataUsedMB),
          timeUsageTrend: usage.dailyUsage.map((d: any) => d.timeUsedMinutes)
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des quotas détaillés:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les quotas détaillés'
    });
  }
});

/**
 * PUT /api/quotas/advanced/users/:userId/custom
 * Configurer des quotas personnalisés pour un utilisateur
 */
router.put('/users/:userId/custom', async (req, res) => {
  try {
    const { userId } = req.params;
    const quotaService = req.services?.quotaService;
    const webSocketService = req.services?.webSocketService;

    if (!quotaService) {
      return res.status(500).json({ error: 'Service quotas non disponible' });
    }

    const {
      dailyLimitMB,
      weeklyLimitMB,
      monthlyLimitMB,
      dailyTimeMinutes,
      weeklyTimeMinutes,
      monthlyTimeMinutes,
      validFrom,
      validUntil,
      isActive = true
    } = req.body;

    // Validation des données
    if (dailyLimitMB && (dailyLimitMB < 0 || dailyLimitMB > 50000)) {
      return res.status(400).json({ error: 'Limite quotidienne de données invalide (0-50000 MB)' });
    }

    if (dailyTimeMinutes && (dailyTimeMinutes < 0 || dailyTimeMinutes > 1440)) {
      return res.status(400).json({ error: 'Limite quotidienne de temps invalide (0-1440 minutes)' });
    }

    // Créer la configuration de quota personnalisé
    const quotaConfig = {
      userId,
      dailyLimitMB,
      weeklyLimitMB,
      monthlyLimitMB,
      dailyTimeMinutes,
      weeklyTimeMinutes,
      monthlyTimeMinutes,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive
    };

    const customQuota = await quotaService.setCustomQuotas(userId, quotaConfig);

    // Notification WebSocket
    if (webSocketService) {
      webSocketService.notifyUser(userId, {
        type: 'admin_broadcast',
        title: 'Quotas mis à jour',
        message: 'Vos quotas personnalisés ont été configurés',
        severity: 'info',
        data: customQuota
      });
    }

    logger.info(`Quotas personnalisés configurés pour l'utilisateur ${userId}`, {
      userId,
      quotas: customQuota,
      requestedBy: req.user?.id
    });

    return res.json({
      success: true,
      message: 'Quotas personnalisés configurés avec succès',
      data: customQuota
    });

  } catch (error) {
    logger.error('Erreur lors de la configuration des quotas personnalisés:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de configurer les quotas personnalisés'
    });
  }
});

/**
 * POST /api/quotas/advanced/reset
 * Réinitialisation manuelle des quotas
 */
router.post('/reset', async (req, res) => {
  try {
    const { type, userId } = req.body;
    const quotaService = req.services?.quotaService;

    if (!quotaService) {
      return res.status(500).json({ error: 'Service quotas non disponible' });
    }

    // Vérifier les permissions admin
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    let result;
    if (userId) {
      // Réinitialisation pour un utilisateur spécifique
      result = await quotaService.resetUserQuotas(userId, type);
    } else {
      // Réinitialisation globale
      result = await quotaService.resetQuotas(type);
    }

    logger.info(`Réinitialisation ${type} des quotas effectuée`, {
      type,
      userId,
      result,
      requestedBy: req.user?.id
    });

    return res.json({
      success: true,
      message: `Réinitialisation ${type} effectuée avec succès`,
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de la réinitialisation des quotas:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de réinitialiser les quotas'
    });
  }
});

/**
 * GET /api/quotas/advanced/statistics
 * Statistiques globales des quotas
 */
router.get('/statistics', async (req, res) => {
  try {
    const quotaService = req.services?.quotaService;

    if (!quotaService) {
      return res.status(500).json({ error: 'Service quotas non disponible' });
    }

    const stats = await quotaService.getQuotaStatistics();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques quotas:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
});

/**
 * GET /api/quotas/advanced/alerts
 * Obtenir les alertes de quotas
 */
router.get('/alerts', async (req, res) => {
  try {
    const quotaService = req.services?.quotaService;

    if (!quotaService) {
      return res.status(500).json({ error: 'Service quotas non disponible' });
    }

    const alerts = await quotaService.getQuotaAlerts();

    return res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des alertes:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les alertes'
    });
  }
});

export default router;
