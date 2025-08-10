import { config } from 'dotenv';
import { z } from 'zod';

// Charger les variables d'environnement
config();

/**
 * Schéma de validation pour les variables d'environnement
 */
const envSchema = z.object({
  // Mode d'exécution
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // Base de données
  DATABASE_URL: z.string().min(1),
  
  // Propriétés individuelles de DB (optionnelles, pour construction d'URL)
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),

  // Redis (optionnel en dev)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Admin par défaut (optionnel en dev)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(6).optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(5),

  // Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/gais.log'),

  // Portail captif
  CAPTIVE_PORTAL_TYPE: z.enum(['nodogsplash', 'coovachilli', 'pfsense']).default('nodogsplash'),
  CAPTIVE_PORTAL_SCRIPT: z.string().default('/scripts/nodogsplash.sh'),
  ROUTER_IP: z.string().ip().default('192.168.1.1'),
  ROUTER_USER: z.string().optional(),
  ROUTER_PASSWORD: z.string().optional(),

  // Quotas par défaut
  DEFAULT_DATA_QUOTA: z.coerce.number().int().positive().default(1000),
  DEFAULT_TIME_QUOTA: z.coerce.number().int().positive().default(3600),
  MAX_CONCURRENT_USERS: z.coerce.number().int().positive().default(50),

  // Email (optionnel)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

// Validation et export de la configuration
const env = envSchema.parse(process.env);

// Construction de l'URL de base de données si pas fournie
if (!process.env.DATABASE_URL && env.DB_USER && env.DB_PASSWORD && env.DB_HOST && env.DB_PORT && env.DB_NAME) {
  env.DATABASE_URL = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
}

// Convertir CORS_ORIGIN en tableau si plusieurs origines sont spécifiées
if (env.CORS_ORIGIN.includes(',')) {
  env.CORS_ORIGIN = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
}

/**
 * Configuration centralisée de l'application
 */
const corsOrigins = env.CORS_ORIGIN.includes(',')
  ? env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [env.CORS_ORIGIN];

export const appConfig = {
  // Environnement
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Base de données
  database: {
    url: env.DATABASE_URL,
    host: env.DB_HOST || undefined,
    port: env.DB_PORT || undefined,
    name: env.DB_NAME || undefined,
    user: env.DB_USER || undefined,
    password: env.DB_PASSWORD || undefined,
  },

  // Redis
  redis: {
    host: env.REDIS_HOST || undefined,
    port: env.REDIS_PORT || undefined,
    password: env.REDIS_PASSWORD || undefined,
    db: 0,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Admin par défaut
  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000, // en millisecondes
    max: env.RATE_LIMIT_MAX,
    loginMax: env.RATE_LIMIT_LOGIN_MAX,
  },

  // Logs
  logs: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },

  // Portail captif
  captivePortal: {
    type: env.CAPTIVE_PORTAL_TYPE,
    script: env.CAPTIVE_PORTAL_SCRIPT,
    router: {
      ip: env.ROUTER_IP,
      user: env.ROUTER_USER,
      password: env.ROUTER_PASSWORD,
    },
  },

  // Quotas par défaut
  quotas: {
    defaultData: env.DEFAULT_DATA_QUOTA,
    defaultTime: env.DEFAULT_TIME_QUOTA,
    maxConcurrentUsers: env.MAX_CONCURRENT_USERS,
  },

  // Email
  email: {
    enabled: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM || env.ADMIN_EMAIL,
  },

  // Sécurité
  security: {
    saltRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
  },

  // Ajouter une propriété CORS_ORIGINS pour gérer plusieurs origines
  CORS_ORIGINS: corsOrigins,
} as const;

export type AppConfig = typeof appConfig;
