/**
 * Service de gestion des sessions invités
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { 
  GuestLevel, 
  GuestSessionStatus, 
  GuestAction,
  ActionResult,
  QuotaWarnings,
  GUEST_LEVEL_QUOTAS,
  QUOTA_WARNING_THRESHOLDS
} from '../types/guest';
import { guestAuditService } from './guestAuditService.js';
import { NotFoundError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class GuestSessionService {

  /**
   * Génère un token JWT pour une session invité
   */
  private generateSessionToken(sessionId: string): string {
    const payload = {
      type: 'guest_session',
      sessionId,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h',
      issuer: 'gais-guest-system',
    });
  }

  /**
   * Vérifie et valide un code d'accès
   */
  private async validateAccessCode(code: string) {
    const accessCode = await prisma.guestAccessCode.findUnique({
      where: { code },
      include: {
        guestSessions: {
          where: {
            status: GuestSessionStatus.ACTIVE,
          }
        }
      }
    });

    if (!accessCode) {
      throw new Error('Code d\'accès invalide');
    }

    if (!accessCode.isActive) {
      throw new Error('Code d\'accès désactivé');
    }

    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      throw new Error('Code d\'accès expiré');
    }

    if (accessCode.maxUses && accessCode.currentUses >= accessCode.maxUses) {
      throw new Error('Code d\'accès épuisé');
    }

    return accessCode;
  }

  /**
   * Obtient les quotas pour un code d'accès
   */
  private getQuotasForCode(accessCode: any) {
    if (accessCode.level === GuestLevel.CUSTOM && accessCode.customQuotas) {
      const customQuotas = JSON.parse(accessCode.customQuotas);
      return {
        dataQuotaMB: customQuotas.dataQuotaMB,
        timeQuotaMinutes: customQuotas.timeQuotaMinutes,
      };
    }
    
    return GUEST_LEVEL_QUOTAS[accessCode.level as GuestLevel];
  }

  /**
   * Crée une nouvelle session invité
   */
  async createGuestSession(data: {
    code: string;
    ipAddress: string;
    userAgent?: string;
    location?: string;
  }) {
    const { code, ipAddress, userAgent, location } = data;

    try {
      // Valider le code d'accès
      const accessCode = await this.validateAccessCode(code);
      
      // Obtenir les quotas
      const quotas = this.getQuotasForCode(accessCode);

      // Calculer l'expiration de la session
      const now = new Date();
      const sessionExpiresAt = new Date(now.getTime() + quotas.timeQuotaMinutes * 60 * 1000);
      const codeExpiresAt = accessCode.expiresAt;
      const expiresAt = codeExpiresAt && codeExpiresAt < sessionExpiresAt ? codeExpiresAt : sessionExpiresAt;

      // Créer la session
      const session = await prisma.guestSession.create({
        data: {
          accessCodeId: accessCode.id,
          ipAddress,
          userAgent: userAgent || null,
          location: location || null,
          dataQuotaMB: quotas.dataQuotaMB,
          timeQuotaMinutes: quotas.timeQuotaMinutes,
          expiresAt,
          sessionToken: '', // Sera mis à jour après génération
        },
      });

      // Générer et mettre à jour le token
      const sessionToken = this.generateSessionToken(session.id);
      const updatedSession = await prisma.guestSession.update({
        where: { id: session.id },
        data: { sessionToken },
      });

      // Incrémenter l'utilisation du code
      await prisma.guestAccessCode.update({
        where: { id: accessCode.id },
        data: {
          currentUses: accessCode.currentUses + 1,
          lastUsedAt: now,
        },
      });

      // Log d'audit
      const auditData: any = {
        guestSessionId: session.id,
        attemptedCode: code,
        action: GuestAction.LOGIN_SUCCESS,
        result: ActionResult.SUCCESS,
        ipAddress,
        details: {
          codeLevel: accessCode.level,
          quotas,
        },
      };
      if (userAgent) {
        auditData.userAgent = userAgent;
      }
      await guestAuditService.logAction(auditData);

      return {
        session: updatedSession,
        code: {
          level: accessCode.level,
          description: accessCode.description,
          remainingUses: accessCode.maxUses ? accessCode.maxUses - accessCode.currentUses - 1 : null,
        },
      };

    } catch (error: any) {
      // Log d'audit pour les échecs
      const auditData: any = {
        attemptedCode: code,
        action: GuestAction.LOGIN_FAILED,
        result: ActionResult.FAILED,
        ipAddress,
        details: {
          errorMessage: error.message,
        },
      };
      if (userAgent) {
        auditData.userAgent = userAgent;
      }
      await guestAuditService.logAction(auditData);

      throw error;
    }
  }

  /**
   * Alias pour createGuestSession (compatibilité avec les routes)
   */
  async loginWithCode(data: {
    code: string;
    ipAddress: string;
    userAgent?: string;
    location?: string;
  }) {
    return this.createGuestSession(data);
  }

  /**
   * Récupère les informations d'une session
   */
  async getSessionInfo(sessionId: string) {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
      include: {
        accessCode: {
          select: {
            level: true,
            description: true,
          }
        }
      }
    });

    if (!session) {
      throw new Error('Session non trouvée');
    }

    if (session.status !== GuestSessionStatus.ACTIVE) {
      throw new Error('Session inactive');
    }

    // Vérifier l'expiration
    const now = new Date();
    if (session.expiresAt && session.expiresAt < now) {
      await this.terminateSession(sessionId, 'expired');
      throw new Error('Session expirée');
    }

    // Calculer les pourcentages d'utilisation
    const dataPercentage = Math.min(100, (session.dataConsumedMB / session.dataQuotaMB) * 100);
    const timePercentage = Math.min(100, (session.timeConsumedMinutes / session.timeQuotaMinutes) * 100);

    // Obtenir les alertes envoyées
    const warnings: QuotaWarnings = session.warningsSent ? JSON.parse(session.warningsSent) : {};

    return {
      id: session.id,
      status: session.status,
      level: session.accessCode.level,
      startedAt: session.startedAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      expiresAt: session.expiresAt?.toISOString(),
      quotas: {
        dataQuotaMB: session.dataQuotaMB,
        timeQuotaMinutes: session.timeQuotaMinutes,
      },
      consumption: {
        dataConsumedMB: session.dataConsumedMB,
        timeConsumedMinutes: session.timeConsumedMinutes,
        dataPercentage: Math.round(dataPercentage * 100) / 100,
        timePercentage: Math.round(timePercentage * 100) / 100,
      },
      connection: {
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location,
      },
      warnings,
    };
  }

  /**
   * Met à jour la consommation d'une session
   */
  async updateSessionConsumption(sessionId: string, data: {
    dataConsumedMB?: number;
    timeConsumedMinutes?: number;
  }) {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session non trouvée');
    }

    if (session.status !== GuestSessionStatus.ACTIVE) {
      throw new Error('Session inactive');
    }

    const updates: any = {
      lastActivity: new Date(),
    };

    if (data.dataConsumedMB !== undefined) {
      updates.dataConsumedMB = data.dataConsumedMB;
    }

    if (data.timeConsumedMinutes !== undefined) {
      updates.timeConsumedMinutes = data.timeConsumedMinutes;
    }

    const updatedSession = await prisma.guestSession.update({
      where: { id: sessionId },
      data: updates,
    });

    // Vérifier les seuils et envoyer des alertes
    await this.checkQuotaThresholds(sessionId);

    return updatedSession;
  }

  /**
   * Vérifie les seuils de quotas et envoie des alertes
   */
  private async checkQuotaThresholds(sessionId: string) {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== GuestSessionStatus.ACTIVE) {
      return;
    }

    const dataPercentage = (session.dataConsumedMB / session.dataQuotaMB) * 100;
    const timePercentage = (session.timeConsumedMinutes / session.timeQuotaMinutes) * 100;
    const maxPercentage = Math.max(dataPercentage, timePercentage);

    const warnings: QuotaWarnings = session.warningsSent ? JSON.parse(session.warningsSent) : {};
    let warningsUpdated = false;

    // Vérifier les seuils d'alerte
    if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.WARNING_80 && !warnings['80']) {
      warnings['80'] = true;
      warningsUpdated = true;
      await guestAuditService.logAction({
        guestSessionId: sessionId,
        action: GuestAction.QUOTA_WARNING_80,
        result: ActionResult.SUCCESS,
        ipAddress: session.ipAddress,
        details: {
          quotaUsagePercent: Math.round(maxPercentage * 100) / 100,
          dataPercentage: Math.round(dataPercentage * 100) / 100,
          timePercentage: Math.round(timePercentage * 100) / 100,
        },
      });
    }

    if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.WARNING_90 && !warnings['90']) {
      warnings['90'] = true;
      warningsUpdated = true;
      await guestAuditService.logAction({
        guestSessionId: sessionId,
        action: GuestAction.QUOTA_WARNING_90,
        result: ActionResult.SUCCESS,
        ipAddress: session.ipAddress,
        details: {
          quotaUsagePercent: Math.round(maxPercentage * 100) / 100,
        },
      });
    }

    if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.WARNING_95 && !warnings['95']) {
      warnings['95'] = true;
      warningsUpdated = true;
      await guestAuditService.logAction({
        guestSessionId: sessionId,
        action: GuestAction.QUOTA_WARNING_95,
        result: ActionResult.SUCCESS,
        ipAddress: session.ipAddress,
        details: {
          quotaUsagePercent: Math.round(maxPercentage * 100) / 100,
        },
      });
    }

    // Vérifier le dépassement de quota
    if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.EXCEEDED) {
      await this.terminateSession(sessionId, 'quota_exceeded');
      return;
    }

    // Mettre à jour les alertes si nécessaire
    if (warningsUpdated) {
      await prisma.guestSession.update({
        where: { id: sessionId },
        data: {
          warningsSent: JSON.stringify(warnings),
        },
      });
    }
  }

  /**
   * Termine une session
   */
  async terminateSession(sessionId: string, reason: 'logout' | 'expired' | 'quota_exceeded' | 'admin_terminated' = 'logout') {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session non trouvée');
    }

    let status: GuestSessionStatus;
    let action: GuestAction;

    switch (reason) {
      case 'expired':
        status = GuestSessionStatus.EXPIRED;
        action = GuestAction.SESSION_EXPIRED;
        break;
      case 'quota_exceeded':
        status = GuestSessionStatus.QUOTA_EXCEEDED;
        action = GuestAction.QUOTA_EXCEEDED;
        break;
      case 'admin_terminated':
        status = GuestSessionStatus.TERMINATED;
        action = GuestAction.SESSION_TERMINATED;
        break;
      default:
        status = GuestSessionStatus.TERMINATED;
        action = GuestAction.LOGOUT;
    }

    const updatedSession = await prisma.guestSession.update({
      where: { id: sessionId },
      data: {
        status,
        terminatedAt: new Date(),
      },
    });

    // Log d'audit
    const auditData: any = {
      guestSessionId: sessionId,
      action,
      result: ActionResult.SUCCESS,
      ipAddress: session.ipAddress,
      details: {
        sessionDuration: Math.round((Date.now() - session.startedAt.getTime()) / 60000), // en minutes
        finalDataConsumption: session.dataConsumedMB,
        finalTimeConsumption: session.timeConsumedMinutes,
      },
    };
    if (session.userAgent) {
      auditData.userAgent = session.userAgent;
    }
    await guestAuditService.logAction(auditData);

    return updatedSession;
  }

  /**
   * Récupère toutes les sessions actives
   */
  async getActiveSessions() {
    const sessions = await prisma.guestSession.findMany({
      where: {
        status: GuestSessionStatus.ACTIVE,
      },
      include: {
        accessCode: {
          select: {
            code: true,
            level: true,
            description: true,
          }
        }
      },
      orderBy: {
        startedAt: 'desc',
      }
    });

    return sessions.map((session: any) => {
      const dataPercentage = (session.dataConsumedMB / session.dataQuotaMB) * 100;
      const timePercentage = (session.timeConsumedMinutes / session.timeQuotaMinutes) * 100;

      return {
        id: session.id,
        code: session.accessCode.code,
        level: session.accessCode.level,
        ipAddress: session.ipAddress,
        location: session.location,
        startedAt: session.startedAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        consumption: {
          dataConsumedMB: session.dataConsumedMB,
          timeConsumedMinutes: session.timeConsumedMinutes,
          dataPercentage: Math.round(dataPercentage * 100) / 100,
          timePercentage: Math.round(timePercentage * 100) / 100,
        },
        status: session.status,
      };
    });
  }

  /**
   * Nettoie les sessions expirées
   */
  async cleanupExpiredSessions() {
    const now = new Date();

    // Terminer les sessions expirées par le temps
    const expiredSessions = await prisma.guestSession.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: GuestSessionStatus.ACTIVE,
      },
      data: {
        status: GuestSessionStatus.EXPIRED,
        terminatedAt: now,
      }
    });

    return {
      expiredSessions: expiredSessions.count,
    };
  }

  /**
   * Récupère une session par son ID avec le code d'accès
   */
  async getSessionById(sessionId: string) {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
      include: {
        accessCode: true,
      },
    });

    return session;
  }

  /**
   * Met à jour la dernière activité d'une session
   */
  async updateLastActivity(sessionId: string, additionalDataMB?: number) {
    const updateData: any = {
      lastActivity: new Date(),
    };

    // Ajouter les données consommées si fournies
    if (additionalDataMB && additionalDataMB > 0) {
      const session = await prisma.guestSession.findUnique({
        where: { id: sessionId },
      });

      if (session) {
        updateData.dataConsumedMB = session.dataConsumedMB + additionalDataMB;
      }
    }

    const updatedSession = await prisma.guestSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Vérifier les quotas après mise à jour
    await this.checkQuotaLimits(sessionId);

    return updatedSession;
  }

  /**
   * Met à jour la consommation en temps réel
   */
  async updateConsumption(sessionId: string) {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('Session introuvable');
    }

    // Calculer le temps écoulé en minutes
    const now = new Date();
    const timeElapsedMinutes = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / (1000 * 60)
    );

    const updatedSession = await prisma.guestSession.update({
      where: { id: sessionId },
      data: {
        timeConsumedMinutes: timeElapsedMinutes,
        lastActivity: now,
      },
    });

    // Vérifier les quotas
    await this.checkQuotaLimits(sessionId);

    return updatedSession;
  }

  /**
   * Vérifie les limites de quotas et envoie des alertes si nécessaire
   */
  private async checkQuotaLimits(sessionId: string) {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return;

    const dataPercentage = (session.dataConsumedMB / session.dataQuotaMB) * 100;
    const timePercentage = (session.timeConsumedMinutes / session.timeQuotaMinutes) * 100;

    const warnings: QuotaWarnings = session.warningsSent ? 
      JSON.parse(session.warningsSent) : {};

    // Vérifier les seuils d'alerte
    const maxPercentage = Math.max(dataPercentage, timePercentage);

    if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.EXCEEDED) {
      // Quota dépassé - terminer la session
      await this.terminateSession(sessionId, 'quota_exceeded');
      return;
    }

    // Envoyer des alertes si nécessaire
    if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.WARNING_95 && !warnings['95']) {
      warnings['95'] = true;
      await this.sendQuotaWarning(sessionId, 95, maxPercentage);
    } else if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.WARNING_90 && !warnings['90']) {
      warnings['90'] = true;
      await this.sendQuotaWarning(sessionId, 90, maxPercentage);
    } else if (maxPercentage >= QUOTA_WARNING_THRESHOLDS.WARNING_80 && !warnings['80']) {
      warnings['80'] = true;
      await this.sendQuotaWarning(sessionId, 80, maxPercentage);
    }

    // Mettre à jour les alertes envoyées
    await prisma.guestSession.update({
      where: { id: sessionId },
      data: {
        warningsSent: JSON.stringify(warnings),
      },
    });
  }

  /**
   * Envoie une alerte de quota
   */
  private async sendQuotaWarning(sessionId: string, threshold: number, currentPercentage: number) {
    const action = threshold === 80 ? GuestAction.QUOTA_WARNING_80 :
                   threshold === 90 ? GuestAction.QUOTA_WARNING_90 :
                   GuestAction.QUOTA_WARNING_95;

    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      const auditData: any = {
        guestSessionId: sessionId,
        action,
        result: ActionResult.SUCCESS,
        ipAddress: session.ipAddress,
        details: {
          threshold,
          currentPercentage: Math.round(currentPercentage),
          dataPercentage: Math.round((session.dataConsumedMB / session.dataQuotaMB) * 100),
          timePercentage: Math.round((session.timeConsumedMinutes / session.timeQuotaMinutes) * 100),
        },
      };

      if (session.userAgent) {
        auditData.userAgent = session.userAgent;
      }

      await guestAuditService.logAction(auditData);
    }
  }
}

export const guestSessionService = new GuestSessionService();
