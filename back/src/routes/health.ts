import { Router, Request, Response } from 'express';
import { appConfig } from '../config/config';
import { asyncHandler } from '../middleware/error-handler';
import { gaisApp } from '../index';

const router = Router();

/**
 * Interface pour le status de santé
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usage: string;
  };
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
  };
}

/**
 * GET /api/health
 * Vérification de santé rapide
 */
router.get('/', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const healthCheck = await gaisApp.healthCheck();

  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
  const usedMemory = memoryUsage.heapUsed;

  const healthStatus: HealthStatus = {
    status: healthCheck.status === 'healthy' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: appConfig.NODE_ENV,
    uptime: process.uptime(),
    database: {
      status: healthCheck.status === 'healthy' ? 'connected' : 'error',
    },
    memory: {
      used: usedMemory,
      free: totalMemory - usedMemory,
      total: totalMemory,
      usage: `${Math.round((usedMemory / totalMemory) * 100)}%`,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
  };

  res.status(healthCheck.status === 'healthy' ? 200 : 503).json(healthStatus);
}));

/**
 * GET /api/health/liveness
 * Probe de vivacité (Kubernetes)
 */
router.get('/liveness', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}));

/**
 * GET /api/health/readiness
 * Probe de disponibilité (Kubernetes)
 */
router.get('/readiness', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const healthCheck = await gaisApp.healthCheck();

  res.status(healthCheck.status === 'healthy' ? 200 : 503).json({
    status: healthCheck.status === 'healthy' ? 'ready' : 'not-ready',
    timestamp: new Date().toISOString(),
    details: healthCheck.details,
  });
}));

export default router;
