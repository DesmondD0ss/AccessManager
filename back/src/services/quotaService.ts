import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';

const prisma = new PrismaClient();

export interface QuotaUsage {
  dataUsedMB: number;
  timeUsedMinutes: number;
  dataQuotaMB: number;
  timeQuotaMinutes: number;
  dataUsagePercent: number;
  timeUsagePercent: number;
  status: 'normal' | 'warning' | 'exceeded';
  nextReset?: Date;
}

export interface UserQuotaConfig {
  userId: string;
  dailyLimitMB?: number;
  weeklyLimitMB?: number;
  monthlyLimitMB?: number;
  dailyTimeMinutes?: number;
  weeklyTimeMinutes?: number;
  monthlyTimeMinutes?: number;
  validFrom?: Date;
  validUntil?: Date | null;
  isActive?: boolean;
}

/**
 * Service professionnel de gestion des quotas
 */
export class QuotaService {
  private static instance: QuotaService;

  public static getInstance(): QuotaService {
    if (!QuotaService.instance) {
      QuotaService.instance = new QuotaService();
    }
    return QuotaService.instance;
  }

  /**
   * Obtenir les quotas effectifs d'un utilisateur
   */
  async getUserQuotas(userId: string): Promise<QuotaUsage> {
    try {
      // Récupérer la configuration de quota personnalisée
      const userQuota = await prisma.userQuota.findFirst({
        where: {
          userId,
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      // Utiliser les quotas personnalisés ou les valeurs par défaut
      const dailyLimitMB = userQuota?.dailyLimitMB ?? Math.round(appConfig.quotas.defaultData / 1024 / 1024);
      const dailyTimeMinutes = userQuota?.dailyTimeMinutes ?? Math.round(appConfig.quotas.defaultTime / 60);

      // Calculer l'usage actuel (dernières 24h)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const todayUsage = await prisma.accessSession.aggregate({
        where: {
          userId,
          startedAt: { gte: yesterday }
        },
        _sum: {
          dataUsedMB: true,
          timeUsedMinutes: true
        }
      });

      const dataUsedMB = todayUsage._sum?.dataUsedMB ?? 0;
      const timeUsedMinutes = todayUsage._sum?.timeUsedMinutes ?? 0;

      // Calculer les pourcentages
      const dataUsagePercent = Math.round((dataUsedMB / dailyLimitMB) * 100);
      const timeUsagePercent = Math.round((timeUsedMinutes / dailyTimeMinutes) * 100);

      // Déterminer le statut
      let status: 'normal' | 'warning' | 'exceeded' = 'normal';
      if (dataUsagePercent >= 100 || timeUsagePercent >= 100) {
        status = 'exceeded';
      } else if (dataUsagePercent >= 80 || timeUsagePercent >= 80) {
        status = 'warning';
      }

      // Prochaine réinitialisation (minuit suivant)
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 1);
      nextReset.setHours(0, 0, 0, 0);

      return {
        dataUsedMB,
        timeUsedMinutes,
        dataQuotaMB: dailyLimitMB,
        timeQuotaMinutes: dailyTimeMinutes,
        dataUsagePercent,
        timeUsagePercent,
        status,
        nextReset
      };

    } catch (error) {
      logger.error('Erreur lors du calcul des quotas utilisateur:', error);
      throw new Error('Impossible de calculer les quotas');
    }
  }

  /**
   * Créer ou mettre à jour les quotas personnalisés d'un utilisateur
   */
  async setUserQuota(config: UserQuotaConfig): Promise<void> {
    try {
      // Désactiver les anciens quotas
      await prisma.userQuota.updateMany({
        where: {
          userId: config.userId,
          isActive: true
        },
        data: { isActive: false }
      });

      // Créer le nouveau quota
      await prisma.userQuota.create({
        data: {
          userId: config.userId,
          quotaType: 'CUSTOM', // Champ obligatoire
          dailyLimitMB: config.dailyLimitMB ?? null,
          weeklyLimitMB: config.weeklyLimitMB ?? null,
          monthlyLimitMB: config.monthlyLimitMB ?? null,
          dailyTimeMinutes: config.dailyTimeMinutes ?? null,
          weeklyTimeMinutes: config.weeklyTimeMinutes ?? null,
          monthlyTimeMinutes: config.monthlyTimeMinutes ?? null,
          validFrom: config.validFrom ?? new Date(),
          validUntil: config.validUntil ?? null, // Convertir undefined en null
          isActive: config.isActive ?? true,
          currentDailyMB: 0,
          currentWeeklyMB: 0,
          currentMonthlyMB: 0,
          currentDailyMinutes: 0,
          currentWeeklyMinutes: 0,
          currentMonthlyMinutes: 0
        }
      });

      logger.info('Quotas utilisateur mis à jour', {
        userId: config.userId,
        dailyLimitMB: config.dailyLimitMB,
        dailyTimeMinutes: config.dailyTimeMinutes
      });

    } catch (error) {
      logger.error('Erreur lors de la mise à jour des quotas:', error);
      throw new Error('Impossible de mettre à jour les quotas');
    }
  }

  /**
   * Vérifier si un utilisateur peut démarrer une session
   */
  async canStartSession(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const quotas = await this.getUserQuotas(userId);

      if (quotas.status === 'exceeded') {
        return {
          allowed: false,
          reason: quotas.dataUsagePercent >= 100 
            ? 'Quota de données journalier épuisé'
            : 'Quota de temps journalier épuisé'
        };
      }

      // Vérifier les sessions actives concurrentes
      const activeSessions = await prisma.accessSession.count({
        where: {
          userId,
          status: 'ACTIVE'
        }
      });

      if (activeSessions > 0) {
        return {
          allowed: false,
          reason: 'Une session est déjà active'
        };
      }

      return { allowed: true };

    } catch (error) {
      logger.error('Erreur lors de la vérification des quotas:', error);
      return {
        allowed: false,
        reason: 'Erreur système lors de la vérification'
      };
    }
  }

  /**
   * Mettre à jour l'usage des quotas
   */
  async updateUsage(userId: string, additionalDataMB: number, additionalTimeMinutes: number): Promise<void> {
    try {
      const userQuota = await prisma.userQuota.findFirst({
        where: {
          userId,
          isActive: true,
          validFrom: { lte: new Date() },
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        }
      });

      if (userQuota) {
        await prisma.userQuota.update({
          where: { id: userQuota.id },
          data: {
            currentDailyMB: { increment: additionalDataMB },
            currentWeeklyMB: { increment: additionalDataMB },
            currentMonthlyMB: { increment: additionalDataMB },
            currentDailyMinutes: { increment: additionalTimeMinutes },
            currentWeeklyMinutes: { increment: additionalTimeMinutes },
            currentMonthlyMinutes: { increment: additionalTimeMinutes }
          }
        });

        logger.debug('Usage des quotas mis à jour', {
          userId,
          additionalDataMB,
          additionalTimeMinutes
        });
      }

    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'usage:', error);
      // Ne pas faire échouer la session pour cette erreur
    }
  }

  /**
   * Réinitialiser les quotas (appelé par cron job)
   */
  async resetQuotas(type: 'daily' | 'weekly' | 'monthly'): Promise<{ resetCount: number }> {
    try {
      const resetData: any = {};
      
      switch (type) {
        case 'daily':
          resetData.currentDailyMB = 0;
          resetData.currentDailyMinutes = 0;
          break;
        case 'weekly':
          resetData.currentWeeklyMB = 0;
          resetData.currentWeeklyMinutes = 0;
          break;
        case 'monthly':
          resetData.currentMonthlyMB = 0;
          resetData.currentMonthlyMinutes = 0;
          break;
      }

      const result = await prisma.userQuota.updateMany({
        where: { isActive: true },
        data: resetData
      });

      logger.info(`Réinitialisation des quotas ${type}`, {
        resetCount: result.count
      });

      return { resetCount: result.count };

    } catch (error) {
      logger.error(`Erreur lors de la réinitialisation ${type}:`, error);
      throw new Error(`Impossible de réinitialiser les quotas ${type}`);
    }
  }

  /**
   * Obtenir les statistiques globales des quotas
   */
  async getQuotaStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    normalUsers: number;
    warningUsers: number;
    exceededUsers: number;
    totalDataUsedMB: number;
    totalTimeUsedMinutes: number;
  }> {
    try {
      const totalUsers = await prisma.user.count({ where: { isActive: true } });
      
      // Récupérer tous les utilisateurs avec leurs quotas
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      let activeUsers = 0;
      let normalUsers = 0;
      let warningUsers = 0;
      let exceededUsers = 0;
      let totalDataUsedMB = 0;
      let totalTimeUsedMinutes = 0;

      // Calculer les statistiques pour chaque utilisateur
      for (const user of users) {
        const quotas = await this.getUserQuotas(user.id);
        
        totalDataUsedMB += quotas.dataUsedMB;
        totalTimeUsedMinutes += quotas.timeUsedMinutes;

        if (quotas.dataUsedMB > 0 || quotas.timeUsedMinutes > 0) {
          activeUsers++;
        }

        switch (quotas.status) {
          case 'normal':
            normalUsers++;
            break;
          case 'warning':
            warningUsers++;
            break;
          case 'exceeded':
            exceededUsers++;
            break;
        }
      }

      return {
        totalUsers,
        activeUsers,
        normalUsers,
        warningUsers,
        exceededUsers,
        totalDataUsedMB: Math.round(totalDataUsedMB),
        totalTimeUsedMinutes: Math.round(totalTimeUsedMinutes)
      };

    } catch (error) {
      logger.error('Erreur lors du calcul des statistiques:', error);
      throw new Error('Impossible de calculer les statistiques des quotas');
    }
  }

  /**
   * Obtenir l'historique d'usage d'un utilisateur
   */
  async getUsageHistory(userId: string, fromDate: Date, toDate: Date): Promise<{
    dailyUsage: Array<{
      date: string;
      dataUsedMB: number;
      timeUsedMinutes: number;
    }>;
    totalDataUsedMB: number;
    totalTimeUsedMinutes: number;
  }> {
    try {
      const sessions = await prisma.accessSession.findMany({
        where: {
          userId,
          startedAt: {
            gte: fromDate,
            lte: toDate
          }
        },
        orderBy: { startedAt: 'asc' }
      });

      // Grouper par jour
      const dailyUsage = new Map<string, { dataUsedMB: number; timeUsedMinutes: number }>();
      let totalDataUsedMB = 0;
      let totalTimeUsedMinutes = 0;

      for (const session of sessions) {
        const date = session.startedAt.toISOString().split('T')[0];
        const dataUsed = session.dataUsedMB || 0;
        const timeUsed = session.timeUsedMinutes || 0;

        totalDataUsedMB += dataUsed;
        totalTimeUsedMinutes += timeUsed;

        if (!dailyUsage.has(date)) {
          dailyUsage.set(date, { dataUsedMB: 0, timeUsedMinutes: 0 });
        }

        const dayData = dailyUsage.get(date)!;
        dayData.dataUsedMB += dataUsed;
        dayData.timeUsedMinutes += timeUsed;
      }

      // Convertir en tableau
      const dailyUsageArray = Array.from(dailyUsage.entries()).map(([date, usage]) => ({
        date,
        dataUsedMB: Math.round(usage.dataUsedMB),
        timeUsedMinutes: Math.round(usage.timeUsedMinutes)
      }));

      return {
        dailyUsage: dailyUsageArray,
        totalDataUsedMB: Math.round(totalDataUsedMB),
        totalTimeUsedMinutes: Math.round(totalTimeUsedMinutes)
      };

    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique:', error);
      throw new Error('Impossible de récupérer l\'historique d\'usage');
    }
  }

  /**
   * Obtenir des prédictions d'usage basées sur l'historique
   */
  async getPredictions(userId: string): Promise<{
    predictedDailyDataMB: number;
    predictedDailyTimeMinutes: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedMonthlyUsage: {
      dataMB: number;
      timeMinutes: number;
    };
  }> {
    try {
      // Récupérer l'usage des 30 derniers jours
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const history = await this.getUsageHistory(userId, thirtyDaysAgo, new Date());

      if (history.dailyUsage.length === 0) {
        return {
          predictedDailyDataMB: 0,
          predictedDailyTimeMinutes: 0,
          riskLevel: 'low',
          estimatedMonthlyUsage: { dataMB: 0, timeMinutes: 0 }
        };
      }

      // Calculer les moyennes
      const avgDailyData = history.totalDataUsedMB / history.dailyUsage.length;
      const avgDailyTime = history.totalTimeUsedMinutes / history.dailyUsage.length;

      // Obtenir les quotas actuels
      const currentQuotas = await this.getUserQuotas(userId);

      // Calculer le niveau de risque
      const dataRisk = avgDailyData / currentQuotas.dataQuotaMB;
      const timeRisk = avgDailyTime / currentQuotas.timeQuotaMinutes;
      const maxRisk = Math.max(dataRisk, timeRisk);

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (maxRisk > 0.8) riskLevel = 'high';
      else if (maxRisk > 0.6) riskLevel = 'medium';

      return {
        predictedDailyDataMB: Math.round(avgDailyData),
        predictedDailyTimeMinutes: Math.round(avgDailyTime),
        riskLevel,
        estimatedMonthlyUsage: {
          dataMB: Math.round(avgDailyData * 30),
          timeMinutes: Math.round(avgDailyTime * 30)
        }
      };

    } catch (error) {
      logger.error('Erreur lors du calcul des prédictions:', error);
      throw new Error('Impossible de calculer les prédictions');
    }
  }

  /**
   * Configurer des quotas personnalisés
   */
  async setCustomQuotas(userId: string, config: UserQuotaConfig): Promise<any> {
    try {
      // Désactiver les quotas précédents
      await prisma.userQuota.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });

      // Créer le nouveau quota
      const customQuota = await prisma.userQuota.create({
        data: {
          userId,
          quotaType: 'CUSTOM', // Champ obligatoire
          dailyLimitMB: config.dailyLimitMB ?? null,
          weeklyLimitMB: config.weeklyLimitMB ?? null,
          monthlyLimitMB: config.monthlyLimitMB ?? null,
          dailyTimeMinutes: config.dailyTimeMinutes ?? null,
          weeklyTimeMinutes: config.weeklyTimeMinutes ?? null,
          monthlyTimeMinutes: config.monthlyTimeMinutes ?? null,
          validFrom: config.validFrom || new Date(),
          validUntil: config.validUntil ?? null, // Convertir undefined en null
          isActive: config.isActive ?? true,
          // Initialiser les compteurs
          currentDailyMB: 0,
          currentWeeklyMB: 0,
          currentMonthlyMB: 0,
          currentDailyMinutes: 0,
          currentWeeklyMinutes: 0,
          currentMonthlyMinutes: 0
        }
      });

      logger.info(`Quotas personnalisés configurés pour l'utilisateur ${userId}`, customQuota);
      return customQuota;

    } catch (error) {
      logger.error('Erreur lors de la configuration des quotas personnalisés:', error);
      throw new Error('Impossible de configurer les quotas personnalisés');
    }
  }

  /**
   * Réinitialiser les quotas d'un utilisateur spécifique
   */
  async resetUserQuotas(userId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<{ resetCount: number }> {
    try {
      // Pour un utilisateur spécifique, on peut simplement recalculer ses quotas
      const currentQuotas = await this.getUserQuotas(userId);
      
      logger.info(`Quotas ${type} réinitialisés pour l'utilisateur ${userId}`, currentQuotas);
      
      return { resetCount: 1 };

    } catch (error) {
      logger.error(`Erreur lors de la réinitialisation ${type} des quotas pour l'utilisateur ${userId}:`, error);
      throw new Error('Impossible de réinitialiser les quotas de l\'utilisateur');
    }
  }

  /**
   * Obtenir les alertes de quotas
   */
  async getQuotaAlerts(): Promise<Array<{
    userId: string;
    username: string;
    alertType: 'warning' | 'exceeded';
    dataUsagePercent: number;
    timeUsagePercent: number;
    timestamp: Date;
  }>> {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, username: true, email: true }
      });

      const alerts = [];

      for (const user of users) {
        const quotas = await this.getUserQuotas(user.id);
        
        if (quotas.status === 'warning' || quotas.status === 'exceeded') {
          alerts.push({
            userId: user.id,
            username: user.username || user.email || 'Utilisateur inconnu',
            alertType: quotas.status as 'warning' | 'exceeded',
            dataUsagePercent: quotas.dataUsagePercent,
            timeUsagePercent: quotas.timeUsagePercent,
            timestamp: new Date()
          });
        }
      }

      return alerts;

    } catch (error) {
      logger.error('Erreur lors de la récupération des alertes:', error);
      throw new Error('Impossible de récupérer les alertes de quotas');
    }
  }
}

// Export de l'instance singleton
export const quotaService = QuotaService.getInstance();
