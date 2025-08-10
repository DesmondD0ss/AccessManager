import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { QuotaService } from '../services/quotaService.js';
import { NetworkService } from '../services/networkService.js';
import { WebSocketService } from '../services/webSocketService.js';

// Extension de l'interface Request pour inclure les services
declare global {
  namespace Express {
    interface Request {
      services?: {
        prisma: PrismaClient;
        quotaService: QuotaService;
        networkService: NetworkService;
        webSocketService: WebSocketService | null;
      };
    }
  }
}

/**
 * Middleware pour injecter les services dans les requests
 */
export const injectServices = (
  prisma: PrismaClient,
  quotaService: QuotaService,
  networkService: NetworkService,
  webSocketService: WebSocketService | null = null
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.services = {
      prisma,
      quotaService,
      networkService,
      webSocketService
    };
    next();
  };
};
