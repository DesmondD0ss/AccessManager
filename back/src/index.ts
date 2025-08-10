import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import { appConfig } from './config/config.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { authenticate } from './middleware/auth.js';

// Import des routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import adminRoutes from './routes/admin.js';
import quotaRoutes from './routes/quotas.js';
import statisticsRoutes from './routes/statistics.js';
import healthRoutes from './routes/health.js';
import guestRoutes from './routes/guest.js'; // Routes invités complètes
import rolesRoutes from './routes/roles.js';
import permissionsRoutes from './routes/permissions.js';

/**
 * Application principale GAI
 * Gestionnaire d'Accès Internet
 */
class GAISApplication {
  public app: express.Application;
  public server: ReturnType<typeof createServer>;
  public io: Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: appConfig.cors.origin,
        credentials: true,
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  /**
   * Configuration des middlewares de sécurité et utilitaires
   */
  private initializeMiddlewares(): void {
    // Sécurité
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: appConfig.isProduction ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false,
    }));

    // CORS
    this.app.use(cors(appConfig.cors));

    // Limitation du taux de requêtes global
    const limiter = rateLimit({
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.max,
      message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting pour les routes de santé
        return req.path === '/api/health' || req.path === '/api/health/liveness';
      },
    });
    this.app.use(limiter);

    // Rate limiting spécial pour les connexions
    const loginLimiter = rateLimit({
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.loginMax,
      skipSuccessfulRequests: true,
      message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      },
    });
    this.app.use('/api/auth/login', loginLimiter);

    // Parsing avec protection contre les attaques de masse
    this.app.use(express.json({
      limit: '10mb',
      verify: (_req, _res, buf) => {
        // Protection contre les JSON malformés
        try {
          JSON.parse(buf.toString());
        } catch (error) {
          throw new Error('Invalid JSON');
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging HTTP
    if (appConfig.isDevelopment) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
        skip: (req) => {
          // Skip logging pour les routes de santé en production
          return req.path === '/api/health/liveness';
        },
      }));
    }

    // Headers de sécurité supplémentaires
    this.app.use((_req, res, next) => {
      res.setHeader('X-Powered-By', 'GAIS/1.0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      if (appConfig.isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }

      next();
    });
  }

  /**
   * Configuration des routes API
   */
  private initializeRoutes(): void {
    // Route de santé (toujours accessible)
    this.app.use('/api/health', healthRoutes);

    // Routes publiques
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/guest', guestRoutes); // Routes invités (publiques)

    // Routes protégées
    this.app.use('/api/users', authenticate, userRoutes);
    this.app.use('/api/sessions', authenticate, sessionRoutes);
    this.app.use('/api/quotas', authenticate, quotaRoutes);
    this.app.use('/api/statistics', authenticate, statisticsRoutes);
    this.app.use('/api/admin', authenticate, adminRoutes);
    this.app.use('/api/roles', authenticate, rolesRoutes);
    this.app.use('/api/permissions', authenticate, permissionsRoutes);

    // Route de test (toujours accessible)
    this.app.get('/api/test', (_req, res) => {
      res.json({
        message: 'GAIS API is running!',
        environment: appConfig.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // Redirection racine vers la documentation
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'GAIS API',
        description: 'Gestionnaire d\'Accès Internet Starlink',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/api/health',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Configuration de la gestion d'erreurs
   */
  private initializeErrorHandling(): void {
    // Route 404
    this.app.use(notFound);

    // Gestionnaire d'erreurs global
    this.app.use(errorHandler);
  }

  /**
   * Configuration WebSocket pour temps réel
   */
  private initializeWebSocket(): void {
    this.io.use((socket, next) => {
      try {
        // Authentification WebSocket si nécessaire
        const token = socket.handshake.auth.token;
        if (token) {
          // Validation du token ici
          // Pour l'instant, on accepte toutes les connexions
        }
        next();
      } catch (error) {
        logger.error(`Erreur d'authentification WebSocket: ${error}`);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      logger.info(`Client WebSocket connecté: ${socket.id}`);

      // Rejoindre une room pour les mises à jour en temps réel
      socket.on('join-room', (room: string) => {
        if (room && room.length < 100) {
          socket.join(room);
          logger.debug(`Client ${socket.id} a rejoint la room: ${room}`);
        } else {
          logger.warn(`Tentative de rejoindre une room invalide: ${room}`);
        }
      });

      // Événements personnalisés
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        logger.info(`Client WebSocket déconnecté: ${socket.id}, raison: ${reason}`);
      });

      // Gestion des erreurs de socket
      socket.on('error', (error) => {
        logger.error(`Erreur WebSocket pour ${socket.id}: ${error}`);
      });
    });
  }

  /**
   * Vérification de santé de l'application
   */
  public async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test de la base de données
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();

      return {
        status: 'healthy',
        details: {
          database: 'connected',
          server: 'running',
          websocket: 'active',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: appConfig.NODE_ENV,
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          uptime: process.uptime(),
          environment: appConfig.NODE_ENV,
        }
      };
    }
  }

  /**
   * Démarrage du serveur
   */
  public async start(): Promise<void> {
    try {
      // Initialisation de la base de données
      await this.initializeDatabase();

      // Démarrage du serveur HTTP
      this.server.listen(appConfig.PORT, () => {
        logger.info(`🚀 Serveur GAIS démarré sur le port ${appConfig.PORT}`);
        logger.info(`🌍 Environnement: ${appConfig.NODE_ENV}`);
        logger.info(`📝 Logs niveau: ${appConfig.logs.level}`);
        logger.info(`🔒 CORS origine: ${appConfig.cors.origin}`);

        if (appConfig.isDevelopment) {
          logger.info(`🔧 Mode développement activé`);
          logger.info(`📖 Documentation: http://localhost:${appConfig.PORT}/api/docs`);
        }
      });

      // Gestion de l'arrêt gracieux
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error(`❌ Erreur lors du démarrage du serveur: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Initialisation de la base de données
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Import dynamique pour éviter les erreurs de chargement
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({
        log: appConfig.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      // Test de connexion avec timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      );

      await Promise.race([
        prisma.$connect(),
        timeoutPromise
      ]);

      logger.info('✅ Connexion à la base de données établie');

      // Vérification des migrations avec une requête simple
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        timeoutPromise
      ]);

      logger.info('✅ Base de données prête');

      await prisma.$disconnect();
    } catch (error) {
      logger.error(`❌ Erreur de connexion à la base de données: ${error}`);
      if (error instanceof Error) {
        logger.error(`Détails: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Configuration de l'arrêt gracieux
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`📡 Signal ${signal} reçu, arrêt gracieux en cours...`);

        try {
          // Fermeture des connexions WebSocket
          this.io.close();
          logger.info('✅ Connexions WebSocket fermées');

          // Fermeture du serveur HTTP
          this.server.close(() => {
            logger.info('✅ Serveur HTTP fermé');
            process.exit(0);
          });

          // Forcer l'arrêt après 10 secondes
          setTimeout(() => {
            logger.error('⚠️ Arrêt forcé après timeout');
            process.exit(1);
          }, 10000);

        } catch (error) {
          logger.error(`❌ Erreur lors de l'arrêt: ${error}`);
          process.exit(1);
        }
      });
    });

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      logger.error(`❌ Exception non capturée: ${error}`);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`❌ Promesse rejetée non gérée: ${JSON.stringify({ reason, promise })}`);
      process.exit(1);
    });
  }
}

// Démarrage de l'application
const gaisApp = new GAISApplication();

if (require.main === module) {
  gaisApp.start().catch((error) => {
    logger.error(`❌ Erreur fatale lors du démarrage: ${error}`);
    process.exit(1);
  });
}

// Exposer l'instance pour les tests et l'utilisation externe
export { gaisApp };
export default GAISApplication;
