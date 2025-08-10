import winston from 'winston';
import { appConfig } from '../config/config.js';

/**
 * Configuration du logger Winston pour GAIS
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

/**
 * Logger principal de l'application
 */
export const logger = winston.createLogger({
  level: appConfig.logs.level,
  format: logFormat,
  defaultMeta: { service: 'gais-backend' },
  transports: [
    // Console pour développement et production
    new winston.transports.Console({
      format: appConfig.isDevelopment ? consoleFormat : logFormat,
      silent: appConfig.isTest,
    }),
  ],
});

/**
 * Logger spécialisé pour l'audit de sécurité
 */
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.label({ label: 'SECURITY' })
  ),
  defaultMeta: { service: 'gais-security' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
  ],
});

/**
 * Logger pour les accès réseau et sessions
 */
export const accessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.label({ label: 'ACCESS' })
  ),
  defaultMeta: { service: 'gais-access' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
  ],
});

/**
 * Fonctions utilitaires pour le logging
 */
export const logUtils = {
  /**
   * Log une tentative de connexion
   */
  logLoginAttempt(email: string, success: boolean, ip: string, userAgent?: string) {
    securityLogger.info('Login attempt', {
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log un accès API
   */
  logApiAccess(userId: string, endpoint: string, method: string, ip: string, statusCode: number) {
    accessLogger.info('API access', {
      userId,
      endpoint,
      method,
      ip,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log une session utilisateur
   */
  logUserSession(sessionId: string, userId: string, action: 'start' | 'end' | 'quota_exceeded', ip: string, details?: any) {
    accessLogger.info('User session', {
      sessionId,
      userId,
      action,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log une violation de sécurité
   */
  logSecurityViolation(type: string, ip: string, details: any) {
    securityLogger.warn('Security violation', {
      type,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log une erreur critique
   */
  logCriticalError(error: Error, context?: any) {
    logger.error('Critical error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    });
  },
};

// En mode développement, ajouter des logs de débogage
if (appConfig.isDevelopment) {
  logger.debug('Logger initialisé en mode développement');
  logger.debug('Configuration des logs:', {
    level: appConfig.logs.level,
  });
}

export default logger;
