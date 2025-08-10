import express from 'express';
import cors from 'cors';
import { appConfig } from './config/config.js';
import { logger } from './utils/logger.js';

// Import des routes de base
import healthRoutes from './routes/health.js';

const app = express();

// Middlewares de base
app.use(cors({
  origin: appConfig.cors.origin,
  credentials: appConfig.cors.credentials,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);

// Route de test simple
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'GAIS Backend is running!',
    timestamp: new Date().toISOString(),
    environment: appConfig.NODE_ENV,
    status: 'OK'
  });
});

// Route racine
app.get('/', (_req, res) => {
  res.json({
    name: 'GAIS Backend',
    version: '1.0.0',
    description: 'Gestionnaire d\'Accès Internet Starlink',
    endpoints: {
      health: '/api/health',
      test: '/api/test'
    }
  });
});

// Démarrage du serveur
app.listen(appConfig.PORT, () => {
  logger.info(`🚀 GAIS Backend démarré sur le port ${appConfig.PORT}`);
  logger.info(`🌍 Environnement: ${appConfig.NODE_ENV}`);
  logger.info(`🔒 CORS origine: ${appConfig.cors.origin}`);
  console.log(`✅ Backend GAIS prêt sur http://localhost:${appConfig.PORT}`);
  console.log(`📖 API Test: http://localhost:${appConfig.PORT}/api/test`);
  console.log(`🏥 Health: http://localhost:${appConfig.PORT}/api/health`);
});

export default app;
