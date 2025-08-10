import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';

const prisma = new PrismaClient();

export interface UserSocketData {
  userId: string;
  username?: string;
  role: string;
  connectedAt: Date;
}

export interface NotificationPayload {
  type: 'quota_warning' | 'quota_exceeded' | 'session_terminated' | 'admin_broadcast' | 'system_maintenance';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  data?: any;
  timestamp?: Date;
}

export interface SessionUpdatePayload {
  sessionId: string;
  status: string;
  dataUsedMB: number;
  timeUsedMinutes: number;
  dataQuotaMB?: number;
  timeQuotaMinutes?: number;
}

/**
 * Service WebSocket professionnel pour GAIS
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Socket[]> = new Map();
  private adminSockets: Set<Socket> = new Set();

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialiser le service WebSocket
   */
  public initialize(io: SocketIOServer): void {
    this.io = io;
    this.setupAuthentication();
    this.setupConnectionHandling();
    this.setupRoomManagement();
    this.setupEventHandlers();

    logger.info('🌐 Service WebSocket initialisé');
  }

  /**
   * Configuration de l'authentification WebSocket
   */
  private setupAuthentication(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token d\'authentification requis'));
        }

        // Vérifier le JWT
        const decoded = jwt.verify(token, appConfig.jwt.secret) as any;
        
        // Récupérer les informations utilisateur
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return next(new Error('Utilisateur non autorisé'));
        }

        // Ajouter les données utilisateur au socket
        socket.data = {
          userId: user.id,
          username: user.username || user.email,
          role: user.role,
          connectedAt: new Date()
        } as UserSocketData;

        logger.debug('WebSocket: Utilisateur authentifié', {
          userId: user.id,
          username: user.username,
          role: user.role,
          socketId: socket.id
        });

        next();

      } catch (error) {
        logger.warn('WebSocket: Échec d\'authentification', {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          socketId: socket.id
        });
        next(new Error('Authentification échouée'));
      }
    });
  }

  /**
   * Gestion des connexions et déconnexions
   */
  private setupConnectionHandling(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const userData = socket.data as UserSocketData;
      
      logger.info('WebSocket: Nouvelle connexion', {
        userId: userData.userId,
        username: userData.username,
        role: userData.role,
        socketId: socket.id
      });

      // Ajouter à la liste des sockets utilisateur
      const userSockets = this.userSockets.get(userData.userId) || [];
      userSockets.push(socket);
      this.userSockets.set(userData.userId, userSockets);

      // Ajouter aux sockets admin si nécessaire
      if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
        this.adminSockets.add(socket);
      }

      // Rejoindre les rooms appropriées
      socket.join(`user:${userData.userId}`);
      socket.join(`role:${userData.role}`);

      // Envoyer les données de connexion
      socket.emit('connection:success', {
        connectedAt: userData.connectedAt,
        userId: userData.userId,
        role: userData.role
      });

      // Gestion de la déconnexion
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });
    });
  }

  /**
   * Gestion des rooms et des événements
   */
  private setupRoomManagement(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      // Rejoindre une room spécifique
      socket.on('join:room', (roomName: string) => {
        if (this.isValidRoom(roomName, socket.data as UserSocketData)) {
          socket.join(roomName);
          socket.emit('room:joined', { room: roomName });
          
          logger.debug('WebSocket: Room rejoint', {
            userId: socket.data.userId,
            room: roomName,
            socketId: socket.id
          });
        } else {
          socket.emit('room:error', { error: 'Room non autorisée' });
        }
      });

      // Quitter une room
      socket.on('leave:room', (roomName: string) => {
        socket.leave(roomName);
        socket.emit('room:left', { room: roomName });
      });
    });
  }

  /**
   * Configuration des gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const userData = socket.data as UserSocketData;

      // Ping/Pong pour maintenir la connexion
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Demande de statut des quotas en temps réel
      socket.on('quota:subscribe', async () => {
        if (userData.userId) {
          socket.join(`quota:${userData.userId}`);
          // Envoyer le statut actuel
          await this.sendQuotaUpdate(userData.userId);
        }
      });

      // Demande de statut des sessions
      socket.on('session:subscribe', () => {
        if (userData.userId) {
          socket.join(`session:${userData.userId}`);
        }
      });

      // Événements admin
      if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
        socket.on('admin:broadcast', (data: { message: string; type: string; targetRole?: string }) => {
          this.sendAdminBroadcast(data.message, data.type, data.targetRole);
        });

        socket.on('admin:get_stats', async () => {
          const stats = await this.getRealtimeStats();
          socket.emit('admin:stats', stats);
        });
      }

      // Gestion des erreurs
      socket.on('error', (error) => {
        logger.error('WebSocket: Erreur socket', {
          userId: userData.userId,
          error: error.message,
          socketId: socket.id
        });
      });
    });
  }

  /**
   * Valider l'accès à une room
   */
  private isValidRoom(roomName: string, userData: UserSocketData): boolean {
    // Rooms générales
    if (['general', 'announcements'].includes(roomName)) {
      return true;
    }

    // Rooms utilisateur spécifiques
    if (roomName.startsWith('user:') && roomName === `user:${userData.userId}`) {
      return true;
    }

    // Rooms par rôle
    if (roomName.startsWith('role:') && roomName === `role:${userData.role}`) {
      return true;
    }

    // Rooms admin
    if (roomName.startsWith('admin:') && (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN')) {
      return true;
    }

    return false;
  }

  /**
   * Gérer la déconnexion d'un socket
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    const userData = socket.data as UserSocketData;

    logger.info('WebSocket: Déconnexion', {
      userId: userData?.userId,
      reason,
      socketId: socket.id
    });

    if (userData?.userId) {
      // Retirer de la liste des sockets utilisateur
      const userSockets = this.userSockets.get(userData.userId) || [];
      const updatedSockets = userSockets.filter(s => s.id !== socket.id);
      
      if (updatedSockets.length === 0) {
        this.userSockets.delete(userData.userId);
      } else {
        this.userSockets.set(userData.userId, updatedSockets);
      }
    }

    // Retirer des sockets admin
    this.adminSockets.delete(socket);
  }

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  public async sendNotificationToUser(userId: string, notification: NotificationPayload): Promise<boolean> {
    if (!this.io) return false;

    const userSockets = this.userSockets.get(userId);
    if (!userSockets || userSockets.length === 0) {
      logger.debug('WebSocket: Utilisateur non connecté', { userId });
      return false;
    }

    const payload = {
      ...notification,
      timestamp: notification.timestamp || new Date()
    };

    userSockets.forEach(socket => {
      socket.emit('notification', payload);
    });

    logger.debug('WebSocket: Notification envoyée', {
      userId,
      type: notification.type,
      socketsCount: userSockets.length
    });

    return true;
  }

  /**
   * Notifier un utilisateur spécifique
   */
  public notifyUser(userId: string, notification: NotificationPayload): boolean {
    const userSockets = this.userSockets.get(userId);
    if (!userSockets || userSockets.length === 0) {
      logger.warn(`WebSocket: Aucune connexion trouvée pour l'utilisateur ${userId}`);
      return false;
    }

    const notificationWithTimestamp = {
      ...notification,
      timestamp: notification.timestamp || new Date()
    };

    userSockets.forEach(socket => {
      socket.emit('notification', notificationWithTimestamp);
    });

    logger.debug('WebSocket: Notification envoyée à l\'utilisateur', {
      userId,
      type: notification.type,
      socketsCount: userSockets.length
    });

    return true;
  }

  /**
   * Envoyer une mise à jour de session
   */
  public async sendSessionUpdate(userId: string, sessionUpdate: SessionUpdatePayload): Promise<void> {
    if (!this.io) return;

    // À l'utilisateur spécifique
    this.io.to(`session:${userId}`).emit('session:update', sessionUpdate);

    // Aux admins pour monitoring
    this.adminSockets.forEach(socket => {
      socket.emit('admin:session_update', {
        userId,
        ...sessionUpdate
      });
    });

    logger.debug('WebSocket: Session update envoyée', {
      userId,
      sessionId: sessionUpdate.sessionId,
      status: sessionUpdate.status
    });
  }

  /**
   * Envoyer une mise à jour de quota
   */
  public async sendQuotaUpdate(userId: string): Promise<void> {
    if (!this.io) return;

    try {
      // Importer dynamiquement pour éviter les dépendances circulaires
      const { quotaService } = await import('./quotaService.js');
      const quotaData = await quotaService.getUserQuotas(userId);

      this.io.to(`quota:${userId}`).emit('quota:update', quotaData);

      // Envoyer notification si quota en warning ou exceeded
      if (quotaData.status === 'warning') {
        await this.sendNotificationToUser(userId, {
          type: 'quota_warning',
          title: 'Quota bientôt épuisé',
          message: `Attention : ${Math.max(quotaData.dataUsagePercent, quotaData.timeUsagePercent)}% de votre quota utilisé`,
          severity: 'warning',
          data: quotaData
        });
      } else if (quotaData.status === 'exceeded') {
        await this.sendNotificationToUser(userId, {
          type: 'quota_exceeded',
          title: 'Quota épuisé',
          message: 'Votre quota a été dépassé. Votre session sera bientôt terminée.',
          severity: 'error',
          data: quotaData
        });
      }

    } catch (error) {
      logger.error('WebSocket: Erreur lors de l\'envoi de quota update', {
        userId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * Diffusion admin à tous les utilisateurs ou un groupe spécifique
   */
  public async sendAdminBroadcast(message: string, type: string, targetRole?: string): Promise<void> {
    if (!this.io) return;

    const broadcast: NotificationPayload = {
      type: 'admin_broadcast',
      title: 'Message administrateur',
      message,
      severity: type as any,
      timestamp: new Date()
    };

    if (targetRole) {
      this.io.to(`role:${targetRole}`).emit('notification', broadcast);
      logger.info('WebSocket: Broadcast admin envoyé', {
        targetRole,
        message: message.substring(0, 50)
      });
    } else {
      this.io.emit('notification', broadcast);
      logger.info('WebSocket: Broadcast admin global envoyé', {
        message: message.substring(0, 50)
      });
    }
  }

  /**
   * Obtenir les statistiques en temps réel
   */
  private async getRealtimeStats(): Promise<any> {
    try {
      const connectedUsers = this.userSockets.size;
      const totalSockets = Array.from(this.userSockets.values()).reduce((sum, sockets) => sum + sockets.length, 0);
      const adminConnections = this.adminSockets.size;

      // Statistiques DB
      const [totalUsers, activeSessions] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.accessSession.count({ where: { status: 'ACTIVE' } })
      ]);

      return {
        websocket: {
          connectedUsers,
          totalSockets,
          adminConnections
        },
        system: {
          totalUsers,
          activeSessions,
          uptime: Math.round(process.uptime()),
          memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        },
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('WebSocket: Erreur stats temps réel', error);
      return { error: 'Impossible de récupérer les statistiques' };
    }
  }

  /**
   * Envoyer notification de maintenance
   */
  public async sendMaintenanceNotification(message: string, isStarting: boolean): Promise<void> {
    if (!this.io) return;

    const notification: NotificationPayload = {
      type: 'system_maintenance',
      title: isStarting ? 'Maintenance en cours' : 'Fin de maintenance',
      message,
      severity: isStarting ? 'warning' : 'info',
      timestamp: new Date()
    };

    this.io.emit('notification', notification);

    logger.info('WebSocket: Notification de maintenance envoyée', {
      isStarting,
      message: message.substring(0, 50)
    });
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés
   */
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Obtenir la liste des utilisateurs connectés (admin seulement)
   */
  public getConnectedUsers(): { userId: string; username?: string; role: string; connectedAt: Date; socketsCount: number }[] {
    const users: any[] = [];
    
    this.userSockets.forEach((sockets, userId) => {
      if (sockets.length > 0) {
        const userData = sockets[0].data as UserSocketData;
        users.push({
          userId,
          username: userData.username,
          role: userData.role,
          connectedAt: userData.connectedAt,
          socketsCount: sockets.length
        });
      }
    });

    return users.sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
  }

  /**
   * Déconnecter un utilisateur (admin)
   */
  public disconnectUser(userId: string, reason: string = 'Déconnexion administrative'): boolean {
    const userSockets = this.userSockets.get(userId);
    if (!userSockets) return false;

    userSockets.forEach(socket => {
      socket.emit('admin:disconnect', { reason });
      socket.disconnect(true);
    });

    this.userSockets.delete(userId);

    logger.info('WebSocket: Utilisateur déconnecté par admin', {
      userId,
      reason,
      socketsDisconnected: userSockets.length
    });

    return true;
  }

  /**
   * Arrêter le service WebSocket
   */
  public shutdown(): void {
    if (this.io) {
      this.io.disconnectSockets(true);
      logger.info('WebSocket: Service arrêté');
    }
    
    this.userSockets.clear();
    this.adminSockets.clear();
  }
}

// Export de l'instance singleton
export const webSocketService = WebSocketService.getInstance();
