import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { appConfig } from './config/config.js';
import { setupSwagger } from './config/swagger.js';
import { logger } from './utils/logger.js';
import { PrismaClient } from '@prisma/client';

// Import des services
import { WebSocketService } from './services/webSocketService.js';
import { CronService } from './services/cronService.js';
import { NetworkService } from './services/networkService.js';
import { QuotaService } from './services/quotaService.js';

// Import des routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import quotasRoutes from './routes/quotas.js';
import quotasAdvancedRoutes from './routes/quotas-advanced.js';
import networkRoutes from './routes/network.js';
import sessionsRoutes from './routes/sessions.js';
import statisticsRoutes from './routes/statistics.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';

// Import des middlewares
import { injectServices } from './middleware/services.js';

class GAISServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer | null = null;
  private prisma: PrismaClient;
  private webSocketService: WebSocketService | null = null;
  private cronService: CronService;
  private networkService: NetworkService;
  private quotaService: QuotaService;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    
    // Initialisation des services avec la bonne signature
    this.quotaService = QuotaService.getInstance();
    this.networkService = NetworkService.getInstance();
    this.cronService = CronService.getInstance();
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // CORS
    this.app.use((req, res, next) => {
      const allowedOrigins = appConfig.CORS_ORIGINS;
      const origin = req.headers.origin;

      console.log('CORS Debug - Request origin:', origin);
      console.log('CORS Debug - Allowed origins:', allowedOrigins);

      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        console.log('CORS Debug - Origin allowed:', origin);
      } else if (allowedOrigins.length === 1) {
        // Si une seule origine est configurée, l'utiliser par défaut en développement
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
        console.log('CORS Debug - Using default origin:', allowedOrigins[0]);
      }

      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      const originalSend = res.send;
      
      res.send = function(body) {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        return originalSend.call(this, body);
      };
      
      next();
    });

    // Injection des services dans req pour les routes
    this.app.use(injectServices(
      this.prisma,
      this.quotaService,
      this.networkService,
      this.webSocketService
    ));
  }

  private setupRoutes(): void {
    // Documentation API
    setupSwagger(this.app);

    // Routes publiques
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/auth', authRoutes);

    // Routes protégées - le middleware authenticate est dans chaque route individuellement
    this.app.use('/api/users', usersRoutes);
    this.app.use('/api/quotas', quotasRoutes);
    this.app.use('/api/quotas/advanced', quotasAdvancedRoutes);
    this.app.use('/api/network', networkRoutes);
    this.app.use('/api/sessions', sessionsRoutes);
    this.app.use('/api/statistics', statisticsRoutes);
    this.app.use('/api/admin', adminRoutes);

    // Route de test
    this.app.get('/api/test', (_req, res) => {
      res.json({
        message: 'GAIS Backend is running!',
        timestamp: new Date().toISOString(),
        environment: appConfig.NODE_ENV,
        status: 'OK',
        services: {
          database: 'connected',
          webSocket: this.webSocketService ? 'active' : 'inactive',
          cronJobs: this.cronService ? 'active' : 'inactive',
          network: 'active'
        }
      });
    });

    // Route racine avec documentation
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'GAIS Backend',
        version: '1.0.0',
        description: 'Gestionnaire d\'Accès Internet Starlink',
        features: [
          'Authentification JWT',
          'Gestion des quotas personnalisés',
          'Sessions temps réel',
          'Notifications WebSocket',
          'Gestion réseau avancée',
          'Réinitialisation automatique',
          'Statistiques détaillées'
        ],
        endpoints: {
          auth: '/api/auth/*',
          users: '/api/users/*',
          quotas: '/api/quotas/*',
          sessions: '/api/sessions/*',
          statistics: '/api/statistics/*',
          admin: '/api/admin/*',
          health: '/api/health',
          test: '/api/test'
        },
        webSocket: '/ws'
      });
    });
  }

  /**
   * Ajoute la route 404 à l'application Express (à appeler après toutes les autres routes)
   */
  public setupNotFoundRoute(): void {
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: "L'endpoint demandé n'existe pas",
        availableEndpoints: [
          '/api/auth/*',
          '/api/users/*',
          '/api/quotas/*',
          '/api/sessions/*',
          '/api/statistics/*',
          '/api/admin/*',
          '/api/health',
          '/api/test',
          '/api/docs',
          '/api/docs.json'
        ]
      });
    });
  }

  private setupErrorHandling(): void {
    // Gestionnaire d'erreurs global
    this.app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Erreur serveur:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Ne pas exposer les détails d'erreur en production
      const isDevelopment = appConfig.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: 'Erreur interne du serveur',
        message: isDevelopment ? err.message : 'Une erreur est survenue',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(2, 15)
      });
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Test de connexion à la base de données
      await this.prisma.$connect();
      logger.info('✅ Connexion à la base de données établie');

      // Initialisation du service WebSocket avec socket.io
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: appConfig.cors.origin,
          credentials: appConfig.cors.credentials
        }
      });
      
      this.webSocketService = WebSocketService.getInstance();
      this.webSocketService.initialize(this.io);
      logger.info('✅ Service WebSocket initialisé');

      // Démarrage des tâches cron
      this.cronService.initialize();
      logger.info('✅ Tâches cron démarrées');

      logger.info('🎉 Tous les services sont opérationnels');
    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation des services:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      // Création du serveur HTTP
      this.server = createServer(this.app);

      // Initialisation des services
      await this.initializeServices();

      // Démarrage du serveur
      this.server.listen(appConfig.PORT, () => {
        logger.info(`🚀 GAIS Backend démarré sur le port ${appConfig.PORT}`);
        logger.info(`🌍 Environnement: ${appConfig.NODE_ENV}`);
        logger.info(`🔒 CORS origine: ${appConfig.cors.origin}`);
        console.log('\n' + '='.repeat(60));
        console.log('✅ GESTIONNAIRE D\'ACCÈS INTERNET STARLINK (GAIS)');
        console.log('='.repeat(60));
        console.log(`📡 Backend prêt sur: http://localhost:${appConfig.PORT}`);
        console.log(`🔗 WebSocket sur: ws://localhost:${appConfig.PORT}/ws`);
        console.log(`📖 API Test: http://localhost:${appConfig.PORT}/api/test`);
        console.log(`🏥 Health Check: http://localhost:${appConfig.PORT}/api/health`);
        console.log(`📚 Documentation: http://localhost:${appConfig.PORT}/`);
        console.log('='.repeat(60) + '\n');
      });

      // Gestion de l'arrêt propre
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Erreur lors du démarrage du serveur:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`📡 Signal ${signal} reçu, arrêt en cours...`);
      
      try {
        // Arrêt des tâches cron
        this.cronService.shutdown();
        logger.info('✅ Tâches cron arrêtées');

        // Fermeture des connexions WebSocket
        if (this.io) {
          this.io.close();
          logger.info('✅ Connexions WebSocket fermées');
        }

        // Fermeture de la base de données
        await this.prisma.$disconnect();
        logger.info('✅ Connexion base de données fermée');

        // Arrêt du serveur HTTP
        this.server.close(() => {
          logger.info('✅ Serveur HTTP arrêté');
          process.exit(0);
        });

        // Force l'arrêt après 10 secondes
        setTimeout(() => {
          logger.error('⚠️ Arrêt forcé après timeout');
          process.exit(1);
        }, 10000);

      } catch (error) {
        logger.error('❌ Erreur lors de l\'arrêt:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Démarrage du serveur
const server = new GAISServer();
server.start().then(() => {
  server.setupNotFoundRoute();
}).catch((error) => {
  logger.error('❌ Échec du démarrage du serveur:', error);
  process.exit(1);
});

export default server;
