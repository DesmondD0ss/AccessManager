import * as cron from 'node-cron';
import { quotaService } from './quotaService.js';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';

/**
 * Service de tâches programmées pour GAIS
 */
export class CronService {
  private static instance: CronService;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Initialiser tous les cron jobs
   */
  public initialize(): void {
    if (!appConfig.isProduction && !appConfig.isDevelopment) return;

    logger.info('🕐 Initialisation des tâches programmées...');

    this.setupQuotaResetJobs();
    this.setupMaintenanceJobs();
    this.setupHealthCheckJobs();

    logger.info(`✅ ${this.tasks.size} tâches programmées initialisées`);
  }

  /**
   * Configurer les réinitialisations de quotas
   */
  private setupQuotaResetJobs(): void {
    // Réinitialisation quotidienne à minuit
    const dailyTask = cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('🔄 Début de la réinitialisation quotidienne des quotas...');
        const result = await quotaService.resetQuotas('daily');
        logger.info(`✅ Quotas quotidiens réinitialisés pour ${result.resetCount} utilisateurs`);
      } catch (error) {
        logger.error('❌ Erreur lors de la réinitialisation quotidienne:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    // Réinitialisation hebdomadaire le lundi à 00:01
    const weeklyTask = cron.schedule('1 0 * * 1', async () => {
      try {
        logger.info('🔄 Début de la réinitialisation hebdomadaire des quotas...');
        const result = await quotaService.resetQuotas('weekly');
        logger.info(`✅ Quotas hebdomadaires réinitialisés pour ${result.resetCount} utilisateurs`);
      } catch (error) {
        logger.error('❌ Erreur lors de la réinitialisation hebdomadaire:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    // Réinitialisation mensuelle le 1er à 00:02
    const monthlyTask = cron.schedule('2 0 1 * *', async () => {
      try {
        logger.info('🔄 Début de la réinitialisation mensuelle des quotas...');
        const result = await quotaService.resetQuotas('monthly');
        logger.info(`✅ Quotas mensuels réinitialisés pour ${result.resetCount} utilisateurs`);
      } catch (error) {
        logger.error('❌ Erreur lors de la réinitialisation mensuelle:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    this.tasks.set('quota-daily', dailyTask);
    this.tasks.set('quota-weekly', weeklyTask);
    this.tasks.set('quota-monthly', monthlyTask);
  }

  /**
   * Configurer les tâches de maintenance
   */
  private setupMaintenanceJobs(): void {
    // Nettoyage des sessions expirées toutes les heures
    const cleanupTask = cron.schedule('0 * * * *', async () => {
      try {
        logger.debug('🧹 Nettoyage des sessions expirées...');
        await this.cleanupExpiredSessions();
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    // Nettoyage des tokens expirés toutes les 6 heures
    const tokenCleanupTask = cron.schedule('0 */6 * * *', async () => {
      try {
        logger.debug('🧹 Nettoyage des tokens expirés...');
        await this.cleanupExpiredTokens();
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage des tokens:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    // Rotation des logs quotidienne à 3h du matin
    const logRotationTask = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('🔄 Rotation des logs...');
        await this.rotateLogsIfNeeded();
      } catch (error) {
        logger.error('❌ Erreur lors de la rotation des logs:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    this.tasks.set('cleanup-sessions', cleanupTask);
    this.tasks.set('cleanup-tokens', tokenCleanupTask);
    this.tasks.set('log-rotation', logRotationTask);
  }

  /**
   * Configurer les vérifications de santé
   */
  private setupHealthCheckJobs(): void {
    // Vérification de santé interne toutes les 5 minutes
    const healthTask = cron.schedule('*/5 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('❌ Erreur lors de la vérification de santé:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    // Statistiques de performance toutes les 15 minutes
    const statsTask = cron.schedule('*/15 * * * *', async () => {
      try {
        await this.logPerformanceStats();
      } catch (error) {
        logger.error('❌ Erreur lors du logging des statistiques:', error);
      }
    }, {
      timezone: 'Europe/Paris'
    });

    this.tasks.set('health-check', healthTask);
    this.tasks.set('performance-stats', statsTask);
  }

  /**
   * Nettoyer les sessions expirées
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Sessions inactives depuis plus de 24h
      const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await prisma.accessSession.updateMany({
        where: {
          status: 'ACTIVE',
          lastActiveAt: { lt: expiredThreshold }
        },
        data: {
          status: 'EXPIRED',
          endedAt: new Date()
        }
      });

      if (result.count > 0) {
        logger.info(`🧹 ${result.count} sessions expirées nettoyées`);
      }

    } catch (error) {
      logger.error('Erreur lors du nettoyage des sessions:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Nettoyer les tokens expirés
   */
  private async cleanupExpiredTokens(): Promise<void> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
          ]
        }
      });

      if (result.count > 0) {
        logger.info(`🧹 ${result.count} tokens expirés supprimés`);
      }

    } catch (error) {
      logger.error('Erreur lors du nettoyage des tokens:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Effectuer une vérification de santé interne
   */
  private async performHealthCheck(): Promise<void> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Test de connexion DB
      await prisma.$queryRaw`SELECT 1`;

      // Vérifier l'usage mémoire
      const memUsage = process.memoryUsage();
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      if (memUsagePercent > 90) {
        logger.warn(`⚠️ Usage mémoire élevé: ${memUsagePercent.toFixed(2)}%`);
      }

      // Vérifier les erreurs récentes
      // Cette logique dépendrait d'un système de collecte d'erreurs

    } catch (error) {
      logger.error('Vérification de santé échouée:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Logger les statistiques de performance
   */
  private async logPerformanceStats(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      logger.debug('📊 Statistiques de performance', {
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erreur lors du logging des stats:', error);
    }
  }

  /**
   * Rotation des logs si nécessaire
   */
  private async rotateLogsIfNeeded(): Promise<void> {
    try {
      // Cette implémentation dépend du système de logging utilisé
      // Winston gère généralement la rotation automatiquement
      logger.info('🔄 Vérification de la rotation des logs terminée');
    } catch (error) {
      logger.error('Erreur lors de la rotation des logs:', error);
    }
  }

  /**
   * Démarrer une tâche spécifique
   */
  public startTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      logger.info(`▶️ Tâche "${taskName}" démarrée`);
      return true;
    }
    return false;
  }

  /**
   * Arrêter une tâche spécifique
   */
  public stopTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      logger.info(`⏹️ Tâche "${taskName}" arrêtée`);
      return true;
    }
    return false;
  }

  /**
   * Obtenir le statut de toutes les tâches
   */
  public getTasksStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    
    this.tasks.forEach((_task, name) => {
      // Les tâches cron de node-cron n'ont plus de propriété running
      // On considère qu'elles sont actives si elles existent dans la Map
      status[name] = true;
    });

    return status;
  }

  /**
   * Arrêter tous les cron jobs
   */
  public shutdown(): void {
    logger.info('⏹️ Arrêt des tâches programmées...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.debug(`Tâche "${name}" arrêtée`);
    });

    this.tasks.clear();
    logger.info('✅ Toutes les tâches programmées arrêtées');
  }

  /**
   * Exécuter manuellement une réinitialisation de quotas (pour tests)
   */
  public async manualQuotaReset(type: 'daily' | 'weekly' | 'monthly'): Promise<{ resetCount: number }> {
    logger.info(`🔧 Réinitialisation manuelle des quotas ${type}...`);
    const result = await quotaService.resetQuotas(type);
    logger.info(`✅ Réinitialisation manuelle terminée: ${result.resetCount} utilisateurs`);
    return result;
  }
}

// Export de l'instance singleton
export const cronService = CronService.getInstance();
