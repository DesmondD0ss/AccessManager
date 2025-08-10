import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface NetworkDeviceInfo {
  macAddress: string;
  ipAddress: string;
  deviceName?: string;
  lastSeen: Date;
  isActive: boolean;
  vendor?: string;
}

export interface NetworkRule {
  macAddress: string;
  ipAddress: string;
  action: 'ALLOW' | 'DENY' | 'THROTTLE';
  priority: number;
  expiresAt?: Date;
  sessionId?: string;
}

export interface NetworkStats {
  connectedDevices: number;
  allowedDevices: number;
  blockedDevices: number;
  bandwidthUsage: {
    totalMB: number;
    upstreamMB: number;
    downstreamMB: number;
  };
}

/**
 * Service professionnel de gestion réseau pour GAIS
 */
export class NetworkService {
  private static instance: NetworkService;
  private scriptPath: string;
  private activeRules: Map<string, NetworkRule> = new Map();
  private deviceCache: Map<string, NetworkDeviceInfo> = new Map();

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.scriptPath = process.env.CAPTIVE_PORTAL_SCRIPT || '/opt/gais/scripts/network-manager.sh';
    this.initializeService();
  }

  /**
   * Initialiser le service réseau
   */
  private async initializeService(): Promise<void> {
    try {
      // Vérifier la présence du script
      await this.validateScript();
      
      // Charger les règles actives depuis la DB
      await this.loadActiveRules();
      
      // Synchroniser l'état réseau
      await this.syncNetworkState();

      logger.info('🌐 Service réseau initialisé', {
        scriptPath: this.scriptPath,
        activeRules: this.activeRules.size
      });

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation du service réseau:', error);
    }
  }

  /**
   * Valider la présence et les permissions du script réseau
   */
  private async validateScript(): Promise<void> {
    try {
      // Vérifier l'existence du script
      const { stdout } = await execAsync(`test -f ${this.scriptPath} && echo "exists"`);
      
      if (!stdout.includes('exists')) {
        throw new Error(`Script réseau non trouvé: ${this.scriptPath}`);
      }

      // Vérifier les permissions d'exécution
      const { stdout: permissions } = await execAsync(`ls -la ${this.scriptPath}`);
      
      if (!permissions.includes('x')) {
        logger.warn('⚠️ Script réseau sans permissions d\'exécution, tentative de correction...');
        await execAsync(`chmod +x ${this.scriptPath}`);
      }

      logger.info('✅ Script réseau validé:', this.scriptPath);

    } catch (error) {
      logger.error('❌ Erreur lors de la validation du script réseau:', error);
      // En développement, on continue sans le script
      if (appConfig.isDevelopment) {
        logger.warn('⚠️ Mode développement: script réseau non disponible, simulation activée');
      } else {
        throw error;
      }
    }
  }

  /**
   * Charger les règles actives depuis la base de données
   */
  private async loadActiveRules(): Promise<void> {
    try {
      // Récupérer les sessions actives avec leurs règles réseau
      const activeSessions = await prisma.accessSession.findMany({
        where: {
          status: 'ACTIVE',
          ipAddress: { not: '' }
        },
        include: {
          user: true
        }
      });

      // Créer des règles à partir des sessions actives
      for (const session of activeSessions) {
        if (session.macAddress && session.ipAddress) {
          const rule: NetworkRule = {
            macAddress: session.macAddress,
            ipAddress: session.ipAddress,
            action: 'ALLOW',
            priority: 100,
            ...(session.id && { sessionId: session.id })
          };

          this.activeRules.set(session.macAddress, rule);
        }
      }

      logger.info(`📋 ${this.activeRules.size} règles réseau chargées depuis la DB`);

    } catch (error) {
      logger.error('❌ Erreur lors du chargement des règles réseau:', error);
    }
  }

  /**
   * Synchroniser l'état réseau avec le système
   */
  private async syncNetworkState(): Promise<void> {
    try {
      // Appliquer toutes les règles actives
      for (const rule of this.activeRules.values()) {
        if (rule.action === 'ALLOW') {
          await this.allowDevice(rule.macAddress, rule.ipAddress, rule.sessionId);
        }
      }

      logger.info('🔄 État réseau synchronisé');

    } catch (error) {
      logger.error('❌ Erreur lors de la synchronisation réseau:', error);
    }
  }

  /**
   * Autoriser un appareil sur le réseau
   */
  public async allowDevice(macAddress: string, ipAddress: string, sessionId?: string): Promise<boolean> {
    try {
      // Exécuter le script d'autorisation
      if (!appConfig.isDevelopment) {
        const command = `${this.scriptPath} allow "${macAddress}" "${ipAddress}"`;
        await execAsync(command);
      }

      // Enregistrer dans les logs
      logger.info('✅ Appareil autorisé sur le réseau:', {
        macAddress,
        ipAddress,
        sessionId,
        timestamp: new Date()
      });

      return true;

    } catch (error) {
      logger.error('❌ Erreur lors de l\'autorisation de l\'appareil:', error);
      return false;
    }
  }

  /**
   * Supprimer un appareil du réseau
   */
  public async removeDevice(macAddress: string, ipAddress: string): Promise<boolean> {
    try {
      // Exécuter le script de suppression
      if (!appConfig.isDevelopment) {
        const command = `${this.scriptPath} remove "${macAddress}" "${ipAddress}"`;
        await execAsync(command);
      }

      // Enregistrer dans les logs
      logger.info('🚫 Appareil supprimé du réseau:', {
        macAddress,
        ipAddress,
        timestamp: new Date()
      });

      return true;

    } catch (error) {
      logger.error('❌ Erreur lors de la suppression de l\'appareil:', error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques réseau
   */
  public async getNetworkStats(): Promise<NetworkStats> {
    try {
      const allowedDevices = Array.from(this.activeRules.values()).filter(r => r.action === 'ALLOW').length;
      const blockedDevices = Array.from(this.activeRules.values()).filter(r => r.action === 'DENY').length;

      // Simuler des stats de bande passante (à remplacer par de vraies données)
      const stats: NetworkStats = {
        connectedDevices: this.deviceCache.size,
        allowedDevices,
        blockedDevices,
        bandwidthUsage: {
          totalMB: Math.floor(Math.random() * 1000),
          upstreamMB: Math.floor(Math.random() * 300),
          downstreamMB: Math.floor(Math.random() * 700)
        }
      };

      return stats;

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des stats réseau:', error);
      throw new Error('Impossible de récupérer les statistiques réseau');
    }
  }

  /**
   * Scanner les appareils sur le réseau
   */
  public async scanDevices(): Promise<NetworkDeviceInfo[]> {
    try {
      // Scanner le réseau local - version simplifiée pour le développement
      const devices: NetworkDeviceInfo[] = [
        {
          macAddress: "AA:BB:CC:DD:EE:FF",
          ipAddress: "192.168.1.100",
          deviceName: "Exemple Device",
          lastSeen: new Date(),
          isActive: true,
          vendor: "Example Vendor"
        }
      ];

      // Ajouter les appareils en cache
      devices.forEach(device => {
        this.deviceCache.set(device.macAddress, device);
      });
      
      logger.info(`📱 ${devices.length} appareils détectés sur le réseau`);
      return devices;
      
    } catch (error) {
      logger.error('❌ Erreur lors du scan réseau:', error);
      return Array.from(this.deviceCache.values());
    }
  }

  /**
   * Créer une règle réseau
   */
  public async createRule(rule: Omit<NetworkRule, 'priority'> & { priority?: number }): Promise<NetworkRule> {
    try {
      const networkRule: NetworkRule = {
        macAddress: rule.macAddress,
        ipAddress: rule.ipAddress,
        action: rule.action,
        priority: rule.priority || 100,
        ...(rule.sessionId && { sessionId: rule.sessionId }),
        ...(rule.expiresAt && { expiresAt: rule.expiresAt })
      };

      // Appliquer la règle - utiliser les méthodes existantes
      if (rule.action === 'ALLOW') {
        await this.allowDevice(rule.macAddress, rule.ipAddress, rule.sessionId);
      } else if (rule.action === 'DENY') {
        await this.removeDevice(rule.macAddress, rule.ipAddress);
      }

      // Stocker la règle
      this.activeRules.set(rule.macAddress, networkRule);

      logger.info('📋 Règle réseau créée:', networkRule);
      return networkRule;

    } catch (error) {
      logger.error('❌ Erreur lors de la création de la règle réseau:', error);
      throw new Error('Impossible de créer la règle réseau');
    }
  }

  /**
   * Supprimer une règle réseau
   */
  public async removeRule(macAddress: string): Promise<boolean> {
    try {
      const rule = this.activeRules.get(macAddress);
      if (!rule) {
        return false;
      }

      // Supprimer la règle réseau
      await this.removeDevice(rule.macAddress, rule.ipAddress);
      this.activeRules.delete(macAddress);

      logger.info('🗑️ Règle réseau supprimée:', { macAddress });
      return true;

    } catch (error) {
      logger.error('❌ Erreur lors de la suppression de la règle réseau:', error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques de bande passante
   */
  public async getBandwidthStats(): Promise<{
    totalMB: number;
    upstreamMB: number;
    downstreamMB: number;
    devices: Array<{
      macAddress: string;
      ipAddress: string;
      uploadMB: number;
      downloadMB: number;
    }>;
  }> {
    try {
      // Utiliser vnstat pour obtenir les stats (si disponible)
      const { stdout } = await execAsync('vnstat -i eth0 --json 2>/dev/null || echo "{}"');
      
      let totalMB = 0;
      let upstreamMB = 0;
      let downstreamMB = 0;

      try {
        const vnstatData = JSON.parse(stdout);
        if (vnstatData.interfaces && vnstatData.interfaces[0]) {
          const data = vnstatData.interfaces[0].traffic.day[0];
          totalMB = Math.round((data.rx + data.tx) / 1024 / 1024);
          upstreamMB = Math.round(data.tx / 1024 / 1024);
          downstreamMB = Math.round(data.rx / 1024 / 1024);
        }
      } catch (parseError) {
        logger.warn('⚠️ Données vnstat non disponibles, utilisation de valeurs simulées');
        totalMB = Math.floor(Math.random() * 1000);
        upstreamMB = Math.floor(totalMB * 0.3);
        downstreamMB = totalMB - upstreamMB;
      }

      // Stats par appareil (simulées pour l'instant)
      const devices = Array.from(this.deviceCache.values()).map(device => ({
        macAddress: device.macAddress,
        ipAddress: device.ipAddress,
        uploadMB: Math.floor(Math.random() * 100),
        downloadMB: Math.floor(Math.random() * 500)
      }));

      return {
        totalMB,
        upstreamMB,
        downstreamMB,
        devices
      };

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des stats de bande passante:', error);
      return {
        totalMB: 0,
        upstreamMB: 0,
        downstreamMB: 0,
        devices: []
      };
    }
  }

  /**
   * Test de connectivité réseau
   */
  public async testConnectivity(target?: string): Promise<{
    internet: boolean;
    gateway: boolean;
    dns: boolean;
    targetReachable?: boolean;
    latency?: number;
  }> {
    try {
      const results = await Promise.allSettled([
        execAsync('ping -c 1 -W 3 8.8.8.8 > /dev/null 2>&1'),
        execAsync('ping -c 1 -W 3 $(ip route | grep default | head -1 | awk \'{print $3}\') > /dev/null 2>&1'),
        execAsync('nslookup google.com > /dev/null 2>&1')
      ]);

      const baseResults = {
        internet: results[0].status === 'fulfilled',
        gateway: results[1].status === 'fulfilled',
        dns: results[2].status === 'fulfilled'
      };

      if (!target) {
        return baseResults;
      }

      // Test de la cible spécifique
      const start = Date.now();
      const targetResult = await execAsync(`ping -c 1 -W 3 ${target} > /dev/null 2>&1`).catch(() => null);
      const latency = targetResult !== null ? Date.now() - start : undefined;

      const result = {
        ...baseResults,
        ...(target && {
          targetReachable: targetResult !== null,
          ...(latency && { latency })
        })
      };

      return result;

    } catch (error) {
      logger.error('❌ Erreur lors du test de connectivité:', error);
      const errorResult = {
        internet: false,
        gateway: false,
        dns: false,
        ...(target && { targetReachable: false })
      };

      return errorResult;
    }
  }

  /**
   * Obtenir le statut général du réseau
   */
  public async getNetworkStatus(): Promise<{
    isOnline: boolean;
    connectedDevices: number;
    activeRules: number;
    uptime: string;
    connectivity: {
      internet: boolean;
      gateway: boolean;
      dns: boolean;
    };
    lastScan?: Date;
  }> {
    try {
      const connectivity = await this.testConnectivity();
      const isOnline = connectivity.internet && connectivity.gateway;

      // Uptime du système
      const { stdout: uptimeOutput } = await execAsync('uptime -p').catch(() => ({ stdout: 'unknown' }));
      const uptime = uptimeOutput.trim();

      const status = {
        isOnline,
        connectedDevices: this.deviceCache.size,
        activeRules: this.activeRules.size,
        uptime,
        connectivity,
        ...(this.deviceCache.size > 0 && { lastScan: new Date() })
      };

      return status;

    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du statut réseau:', error);
      return {
        isOnline: false,
        connectedDevices: 0,
        activeRules: 0,
        uptime: 'unknown',
        connectivity: { internet: false, gateway: false, dns: false }
      };
    }
  }

  /**
   * Nettoyage des règles expirées
   */
  public async cleanupExpiredRules(): Promise<number> {
    let cleanedCount = 0;

    try {
      const now = new Date();

      for (const [macAddress, rule] of this.activeRules.entries()) {
        if (rule.expiresAt && rule.expiresAt < now) {
          await this.removeDevice(rule.macAddress, rule.ipAddress);
          this.activeRules.delete(macAddress);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`🧹 ${cleanedCount} règles réseau expirées nettoyées`);
      }

    } catch (error) {
      logger.error('❌ Erreur lors du nettoyage des règles:', error);
    }

    return cleanedCount;
  }

  /**
   * Obtenir les règles actives
   */
  public getActiveRules(): NetworkRule[] {
    return Array.from(this.activeRules.values());
  }

  /**
   * Obtenir les appareils en cache
   */
  public getCachedDevices(): NetworkDeviceInfo[] {
    return Array.from(this.deviceCache.values());
  }

  /**
   * Arrêter le service réseau
   */
  public async shutdown(): Promise<void> {
    logger.info('⏹️ Arrêt du service réseau...');

    // Nettoyer toutes les règles actives si demandé
    if (appConfig.isDevelopment) {
      for (const rule of this.activeRules.values()) {
        await this.removeDevice(rule.macAddress, rule.ipAddress);
      }
    }

    this.activeRules.clear();
    this.deviceCache.clear();

    logger.info('✅ Service réseau arrêté');
  }
}

// Export de l'instance singleton
export const networkService = NetworkService.getInstance();
