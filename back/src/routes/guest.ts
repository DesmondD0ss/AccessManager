/**
 * Routes API complètes pour le système d'accès temporaire (invités)
 * Implémentation complète avec authentification, quotas et monitoring
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, ValidationError, AuthenticationError } from '../middleware/error-handler.js';
import { authenticateGuest, checkGuestQuotas, generateGuestToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ==========================================

/**
 * POST /api/guest/auth/login
 * Connexion avec code d'accès temporaire
 */
router.post('/auth/login', [
  body('code')
    .notEmpty()
    .withMessage('Code d\'accès requis')
    .isLength({ min: 8, max: 8 })
    .withMessage('Le code doit contenir exactement 8 caractères')
    .matches(/^[A-Za-z0-9]{8}$/)
    .withMessage('Le code ne doit contenir que des lettres et chiffres'),
  body('deviceInfo')
    .optional()
    .isObject()
    .withMessage('Informations d\'appareil invalides')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données de connexion invalides');
  }

  const { code, deviceInfo } = req.body;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  try {
    // Log de tentative de connexion
    await prisma.guestAuditLog.create({
      data: {
        attemptedCode: code,
        action: 'LOGIN_ATTEMPT',
        result: 'PENDING',
        ipAddress,
        userAgent,
        details: JSON.stringify({ deviceInfo })
      }
    });

    // Valider le code d'accès
    const guestCode = await prisma.guestAccessCode.findUnique({
      where: { code: code.trim() }
    });

    if (!guestCode) {
      await prisma.guestAuditLog.create({
        data: {
          attemptedCode: code,
          action: 'LOGIN_ATTEMPT',
          result: 'FAILED',
          details: JSON.stringify({ reason: 'Code invalide' }),
          ipAddress,
          userAgent
        }
      });
      throw new AuthenticationError('Code d\'accès invalide');
    }

    // Vérifications du code
    const now = new Date();
    
    if (!guestCode.isActive) {
      await prisma.guestAuditLog.create({
        data: {
          guestAccessCodeId: guestCode.id,
          attemptedCode: code,
          action: 'LOGIN_ATTEMPT',
          result: 'FAILED',
          details: JSON.stringify({ reason: 'Code désactivé' }),
          ipAddress,
          userAgent
        }
      });
      throw new AuthenticationError('Code d\'accès désactivé');
    }

    if (guestCode.expiresAt <= now) {
      await prisma.guestAuditLog.create({
        data: {
          guestAccessCodeId: guestCode.id,
          attemptedCode: code,
          action: 'LOGIN_ATTEMPT',
          result: 'FAILED',
          details: JSON.stringify({ reason: 'Code expiré', expiresAt: guestCode.expiresAt }),
          ipAddress,
          userAgent
        }
      });
      throw new AuthenticationError('Code d\'accès expiré');
    }

    if (guestCode.currentUses >= guestCode.maxUses) {
      await prisma.guestAuditLog.create({
        data: {
          guestAccessCodeId: guestCode.id,
          attemptedCode: code,
          action: 'LOGIN_ATTEMPT',
          result: 'FAILED',
          details: JSON.stringify({ reason: 'Nombre maximum d\'utilisations atteint' }),
          ipAddress,
          userAgent
        }
      });
      throw new AuthenticationError('Nombre maximum d\'utilisations atteint');
    }

    // Déterminer les quotas
    const levelQuotas = {
      PREMIUM: { dataQuotaMB: 2048, timeQuotaMinutes: 480 },
      STANDARD: { dataQuotaMB: 1024, timeQuotaMinutes: 240 },
      BASIC: { dataQuotaMB: 512, timeQuotaMinutes: 120 },
      CUSTOM: null
    };

    let quotas;
    if (guestCode.level === 'CUSTOM' && guestCode.customQuotas) {
      quotas = JSON.parse(guestCode.customQuotas);
    } else {
      quotas = (levelQuotas as any)[guestCode.level];
    }

    if (!quotas) {
      throw new ValidationError('Configuration de quotas invalide');
    }

    // Calculer l'expiration de la session (minimum entre code et quotas temps)
    const maxSessionDuration = quotas.timeQuotaMinutes * 60 * 1000; // en millisecondes
    const sessionExpiresAt = new Date(Math.min(
      guestCode.expiresAt.getTime(),
      now.getTime() + maxSessionDuration
    ));

    // Créer la session invité
    const guestSession = await prisma.guestSession.create({
      data: {
        accessCodeId: guestCode.id,
        ipAddress,
        userAgent,
        location: deviceInfo?.location,
        status: 'ACTIVE',
        dataQuotaMB: quotas.dataQuotaMB,
        timeQuotaMinutes: quotas.timeQuotaMinutes,
        expiresAt: sessionExpiresAt,
        dataConsumedMB: 0,
        timeConsumedMinutes: 0,
        warningsSent: JSON.stringify({})
      }
    });

    // Générer le token de session
    const sessionToken = generateGuestToken(guestSession.id, '24h');

    // Mettre à jour le token dans la session
    await prisma.guestSession.update({
      where: { id: guestSession.id },
      data: { sessionToken }
    });

    // Marquer le code comme utilisé
    await prisma.guestAccessCode.update({
      where: { id: guestCode.id },
      data: {
        currentUses: { increment: 1 },
        lastUsedAt: now
      }
    });

    // Log de succès
    await prisma.guestAuditLog.create({
      data: {
        guestSessionId: guestSession.id,
        guestAccessCodeId: guestCode.id,
        attemptedCode: code,
        action: 'LOGIN_SUCCESS',
        result: 'SUCCESS',
        details: JSON.stringify({
          sessionId: guestSession.id,
          level: guestCode.level,
          quotas
        }),
        ipAddress,
        userAgent
      }
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        sessionToken,
        session: {
          id: guestSession.id,
          level: guestCode.level,
          quotas: {
            dataQuotaMB: guestSession.dataQuotaMB,
            timeQuotaMinutes: guestSession.timeQuotaMinutes
          },
          consumption: {
            dataConsumedMB: guestSession.dataConsumedMB,
            timeConsumedMinutes: guestSession.timeConsumedMinutes
          },
          expiresAt: guestSession.expiresAt?.toISOString(),
          startedAt: guestSession.startedAt.toISOString()
        },
        code: {
          level: guestCode.level,
          description: guestCode.description,
          remainingUses: guestCode.maxUses - guestCode.currentUses - 1
        }
      }
    });

    logger.info('Guest login successful', {
      sessionId: guestSession.id,
      codeLevel: guestCode.level,
      ipAddress,
      codeId: guestCode.id
    });

  } catch (error: any) {
    logger.warn('Guest login failed', {
      error: error.message,
      code: code.substring(0, 3) + '*****',
      ipAddress
    });
    throw error;
  }
}));

// ==========================================
// ROUTES PROTÉGÉES (AVEC AUTHENTIFICATION INVITÉ)
// ==========================================

/**
 * GET /api/guest/session
 * Informations sur la session actuelle
 */
router.get('/session', authenticateGuest, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const guestSession = (req as any).guestSession;

  // Calculer la consommation de temps en temps réel
  const sessionDurationMs = Date.now() - guestSession.startedAt.getTime();
  const currentTimeConsumedMinutes = Math.floor(sessionDurationMs / (1000 * 60));

  // Mettre à jour la consommation de temps
  await prisma.guestSession.update({
    where: { id: guestSession.id },
    data: { timeConsumedMinutes: currentTimeConsumedMinutes }
  });

  // Calculer les pourcentages d'utilisation
  const dataUsagePercent = Math.round((guestSession.dataConsumedMB / guestSession.dataQuotaMB) * 100);
  const timeUsagePercent = Math.round((currentTimeConsumedMinutes / guestSession.timeQuotaMinutes) * 100);

  // Temps restant
  const remainingTimeMinutes = Math.max(0, guestSession.timeQuotaMinutes - currentTimeConsumedMinutes);
  const remainingDataMB = Math.max(0, guestSession.dataQuotaMB - guestSession.dataConsumedMB);

  res.json({
    success: true,
    data: {
      session: {
        id: guestSession.id,
        status: guestSession.status,
        level: guestSession.accessCode.level,
        startedAt: guestSession.startedAt.toISOString(),
        expiresAt: guestSession.expiresAt?.toISOString(),
        lastActivity: new Date().toISOString()
      },
      quotas: {
        dataQuotaMB: guestSession.dataQuotaMB,
        timeQuotaMinutes: guestSession.timeQuotaMinutes
      },
      consumption: {
        dataConsumedMB: guestSession.dataConsumedMB,
        timeConsumedMinutes: currentTimeConsumedMinutes,
        dataUsagePercent,
        timeUsagePercent
      },
      remaining: {
        dataMB: remainingDataMB,
        timeMinutes: remainingTimeMinutes
      },
      warnings: {
        data: dataUsagePercent >= 80,
        time: timeUsagePercent >= 80,
        critical: dataUsagePercent >= 95 || timeUsagePercent >= 95
      }
    }
  });
}));

/**
 * GET /api/guest/quotas
 * Quotas en temps réel avec alertes
 */
router.get('/quotas', authenticateGuest, checkGuestQuotas, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const guestSession = (req as any).guestSession;

  // Récupérer les données à jour de la session
  const currentSession = await prisma.guestSession.findUnique({
    where: { id: guestSession.id },
    include: {
      accessCode: {
        select: {
          level: true,
          description: true
        }
      }
    }
  });

  if (!currentSession) {
    throw new AuthenticationError('Session introuvable');
  }

  // Calculer le temps écoulé
  const sessionDurationMs = Date.now() - currentSession.startedAt.getTime();
  const timeConsumedMinutes = Math.floor(sessionDurationMs / (1000 * 60));

  // Calculer les pourcentages
  const dataUsagePercent = Math.round((currentSession.dataConsumedMB / currentSession.dataQuotaMB) * 100);
  const timeUsagePercent = Math.round((timeConsumedMinutes / currentSession.timeQuotaMinutes) * 100);

  // Déterminer les alertes
  const warnings = JSON.parse(currentSession.warningsSent || '{}');
  const alerts = [];

  if (dataUsagePercent >= 80 && !warnings.data80) {
    alerts.push({ type: 'data', level: 'warning', threshold: 80, message: 'Vous avez utilisé 80% de votre quota de données' });
    warnings.data80 = true;
  }

  if (dataUsagePercent >= 95 && !warnings.data95) {
    alerts.push({ type: 'data', level: 'critical', threshold: 95, message: 'Attention ! Vous avez utilisé 95% de votre quota de données' });
    warnings.data95 = true;
  }

  if (timeUsagePercent >= 80 && !warnings.time80) {
    alerts.push({ type: 'time', level: 'warning', threshold: 80, message: 'Vous avez utilisé 80% de votre temps de connexion' });
    warnings.time80 = true;
  }

  if (timeUsagePercent >= 95 && !warnings.time95) {
    alerts.push({ type: 'time', level: 'critical', threshold: 95, message: 'Attention ! Vous avez utilisé 95% de votre temps de connexion' });
    warnings.time95 = true;
  }

  // Sauvegarder les alertes envoyées
  if (alerts.length > 0) {
    await prisma.guestSession.update({
      where: { id: currentSession.id },
      data: { 
        warningsSent: JSON.stringify(warnings),
        timeConsumedMinutes
      }
    });

    // Log des alertes
    for (const alert of alerts) {
      await prisma.guestAuditLog.create({
        data: {
          guestSessionId: currentSession.id,
          action: alert.type === 'data' ? 'QUOTA_WARNING_DATA' : 'QUOTA_WARNING_TIME',
          result: 'SUCCESS',
          details: JSON.stringify(alert),
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        }
      });
    }
  }

  res.json({
    success: true,
    data: {
      quotas: {
        dataQuotaMB: currentSession.dataQuotaMB,
        timeQuotaMinutes: currentSession.timeQuotaMinutes
      },
      consumption: {
        dataConsumedMB: currentSession.dataConsumedMB,
        timeConsumedMinutes,
        dataUsagePercent,
        timeUsagePercent
      },
      remaining: {
        dataMB: Math.max(0, currentSession.dataQuotaMB - currentSession.dataConsumedMB),
        timeMinutes: Math.max(0, currentSession.timeQuotaMinutes - timeConsumedMinutes)
      },
      alerts,
      status: {
        dataOk: dataUsagePercent < 95,
        timeOk: timeUsagePercent < 95,
        sessionActive: currentSession.status === 'ACTIVE'
      }
    }
  });
}));

/**
 * POST /api/guest/auth/logout
 * Déconnexion (termine la session)
 */
router.post('/auth/logout', authenticateGuest, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const guestSession = (req as any).guestSession;

  // Calculer la consommation finale
  const sessionDurationMs = Date.now() - guestSession.startedAt.getTime();
  const finalTimeConsumedMinutes = Math.floor(sessionDurationMs / (1000 * 60));

  // Terminer la session
  await prisma.guestSession.update({
    where: { id: guestSession.id },
    data: {
      status: 'TERMINATED',
      terminatedAt: new Date(),
      timeConsumedMinutes: finalTimeConsumedMinutes
    }
  });

  // Log de déconnexion
  await prisma.guestAuditLog.create({
    data: {
      guestSessionId: guestSession.id,
      action: 'LOGOUT',
      result: 'SUCCESS',
      details: JSON.stringify({
        sessionDurationMinutes: finalTimeConsumedMinutes,
        dataConsumedMB: guestSession.dataConsumedMB,
        reason: 'User logout'
      }),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    }
  });

  res.json({
    success: true,
    message: 'Déconnexion réussie',
    data: {
      sessionSummary: {
        duration: finalTimeConsumedMinutes,
        dataUsed: guestSession.dataConsumedMB,
        level: guestSession.accessCode.level
      }
    }
  });

  logger.info('Guest logout successful', {
    sessionId: guestSession.id,
    duration: finalTimeConsumedMinutes,
    dataUsed: guestSession.dataConsumedMB
  });
}));

/**
 * POST /api/guest/usage/update
 * Mise à jour de la consommation de données (appelé par le système réseau)
 */
router.post('/usage/update', authenticateGuest, [
  body('dataUsedMB')
    .isFloat({ min: 0 })
    .withMessage('Consommation de données invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données de consommation invalides');
  }

  const { dataUsedMB } = req.body;
  const guestSession = (req as any).guestSession;

  // Mettre à jour la consommation
  const updatedSession = await prisma.guestSession.update({
    where: { id: guestSession.id },
    data: {
      dataConsumedMB: dataUsedMB,
      lastActivity: new Date()
    }
  });

  // Vérifier les quotas
  if (updatedSession.dataConsumedMB >= updatedSession.dataQuotaMB) {
    await prisma.guestSession.update({
      where: { id: guestSession.id },
      data: {
        status: 'QUOTA_EXCEEDED',
        terminatedAt: new Date()
      }
    });

    await prisma.guestAuditLog.create({
      data: {
        guestSessionId: guestSession.id,
        action: 'QUOTA_EXCEEDED',
        result: 'SUCCESS',
        details: JSON.stringify({
          quotaType: 'data',
          consumed: dataUsedMB,
          limit: updatedSession.dataQuotaMB
        }),
        ipAddress: req.ip || 'unknown'
      }
    });

    res.json({
      success: true,
      message: 'Quota de données dépassé - session terminée',
      data: {
        quotaExceeded: true,
        sessionTerminated: true
      }
    });
    return;
  }

  res.json({
    success: true,
    message: 'Consommation mise à jour',
    data: {
      dataConsumedMB: updatedSession.dataConsumedMB,
      quotaExceeded: false
    }
  });
}));

export default router;
