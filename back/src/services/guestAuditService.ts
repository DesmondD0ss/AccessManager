/**
 * Service d'audit pour les accès invités
 */

import { PrismaClient } from '@prisma/client';
import { GuestAction, ActionResult, GuestAuditDetails } from '../types/guest';

const prisma = new PrismaClient();

export class GuestAuditService {

  /**
   * Enregistre une action d'audit
   */
  async logAction(data: {
    guestSessionId?: string;
    attemptedCode?: string;
    action: GuestAction;
    result: ActionResult;
    ipAddress: string;
    userAgent?: string;
    details?: GuestAuditDetails;
  }) {
    try {
      await prisma.guestAuditLog.create({
        data: {
          guestSessionId: data.guestSessionId || null,
          attemptedCode: data.attemptedCode || null,
          action: data.action,
          result: data.result,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent || null,
          details: data.details ? JSON.stringify(data.details) : null,
        },
      });
    } catch (error) {
      console.error('Error logging guest audit action:', error);
      // Ne pas faire échouer l'opération principale si l'audit échoue
    }
  }

  /**
   * Récupère les logs d'audit avec filtres
   */
  async getAuditLogs(filters?: {
    guestSessionId?: string;
    action?: GuestAction;
    result?: ActionResult;
    ipAddress?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.guestSessionId) {
      where.guestSessionId = filters.guestSessionId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.result) {
      where.result = filters.result;
    }

    if (filters?.ipAddress) {
      where.ipAddress = filters.ipAddress;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    const logs = await prisma.guestAuditLog.findMany({
      where,
      include: {
        guestSession: {
          select: {
            id: true,
            accessCode: {
              select: {
                code: true,
                level: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });

    return logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  /**
   * Récupère les statistiques d'audit
   */
  async getAuditStatistics(filters?: {
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {};

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    // Statistiques par action
    const actionStats = await prisma.guestAuditLog.groupBy({
      by: ['action', 'result'],
      where,
      _count: {
        id: true,
      },
    });

    // Statistiques par IP
    const ipStats = await prisma.guestAuditLog.groupBy({
      by: ['ipAddress'],
      where: {
        ...where,
        action: {
          in: [GuestAction.LOGIN_ATTEMPT, GuestAction.LOGIN_SUCCESS, GuestAction.LOGIN_FAILED],
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Total des tentatives de connexion
    const totalAttempts = await prisma.guestAuditLog.count({
      where: {
        ...where,
        action: GuestAction.LOGIN_ATTEMPT,
      },
    });

    // Connexions réussies
    const successfulLogins = await prisma.guestAuditLog.count({
      where: {
        ...where,
        action: GuestAction.LOGIN_SUCCESS,
      },
    });

    // Connexions échouées
    const failedLogins = await prisma.guestAuditLog.count({
      where: {
        ...where,
        action: GuestAction.LOGIN_FAILED,
      },
    });

    // Alertes de quotas
    const quotaWarnings = await prisma.guestAuditLog.count({
      where: {
        ...where,
        action: {
          in: [
            GuestAction.QUOTA_WARNING_80,
            GuestAction.QUOTA_WARNING_90,
            GuestAction.QUOTA_WARNING_95,
          ],
        },
      },
    });

    // Dépassements de quotas
    const quotaExceeded = await prisma.guestAuditLog.count({
      where: {
        ...where,
        action: GuestAction.QUOTA_EXCEEDED,
      },
    });

    return {
      summary: {
        totalAttempts,
        successfulLogins,
        failedLogins,
        successRate: totalAttempts > 0 ? ((successfulLogins / totalAttempts) * 100).toFixed(2) : '0',
        quotaWarnings,
        quotaExceeded,
      },
      actionStats: actionStats.map((stat: any) => ({
        action: stat.action,
        result: stat.result,
        count: stat._count.id,
      })),
      topIPs: ipStats.map((stat: any) => ({
        ipAddress: stat.ipAddress,
        attempts: stat._count.id,
      })),
    };
  }

  /**
   * Détecte les activités suspectes
   */
  async detectSuspiciousActivity(options?: {
    timeWindowMinutes?: number;
    maxAttemptsPerIP?: number;
    maxFailedAttempts?: number;
  }) {
    const timeWindow = options?.timeWindowMinutes || 10; // 10 minutes par défaut
    const maxAttemptsPerIP = options?.maxAttemptsPerIP || 10;
    const maxFailedAttempts = options?.maxFailedAttempts || 5;

    const since = new Date(Date.now() - timeWindow * 60 * 1000);

    // IPs avec trop de tentatives
    const suspiciousIPs = await prisma.guestAuditLog.groupBy({
      by: ['ipAddress'],
      where: {
        createdAt: {
          gte: since,
        },
        action: {
          in: [GuestAction.LOGIN_ATTEMPT, GuestAction.LOGIN_FAILED],
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: maxAttemptsPerIP,
          },
        },
      },
    });

    // IPs avec trop d'échecs
    const failedIPs = await prisma.guestAuditLog.groupBy({
      by: ['ipAddress'],
      where: {
        createdAt: {
          gte: since,
        },
        action: GuestAction.LOGIN_FAILED,
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: maxFailedAttempts,
          },
        },
      },
    });

    // Codes tentés de manière excessive
    const suspiciousCodes = await prisma.guestAuditLog.groupBy({
      by: ['attemptedCode'],
      where: {
        createdAt: {
          gte: since,
        },
        action: GuestAction.LOGIN_FAILED,
        attemptedCode: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: 5, // 5 tentatives échouées sur le même code
          },
        },
      },
    });

    return {
      timeWindow,
      suspiciousIPs: suspiciousIPs.map((ip: any) => ({
        ipAddress: ip.ipAddress,
        attempts: ip._count.id,
      })),
      failedIPs: failedIPs.map((ip: any) => ({
        ipAddress: ip.ipAddress,
        failedAttempts: ip._count.id,
      })),
      suspiciousCodes: suspiciousCodes.map((code: any) => ({
        code: code.attemptedCode,
        failedAttempts: code._count.id,
      })),
    };
  }

  /**
   * Nettoie les anciens logs d'audit
   */
  async cleanupOldLogs(olderThanDays: number = 90) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const deletedLogs = await prisma.guestAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deletedLogs: deletedLogs.count,
      cutoffDate,
    };
  }
}

export const guestAuditService = new GuestAuditService();
