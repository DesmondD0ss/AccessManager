/**
 * Types TypeScript pour le système d'accès temporaire (invités)
 */

// ==========================================
// ENUMS ET CONSTANTES
// ==========================================

/**
 * Niveaux d'accès pour les invités
 */
export enum GuestLevel {
  PREMIUM = 'premium',      // VIP: quotas élevés, priorité
  STANDARD = 'standard',    // Standard: quotas moyens
  BASIC = 'basic',         // Limité: quotas faibles
  CUSTOM = 'custom'        // Personnalisé: quotas définis par admin
}

/**
 * États des sessions invités
 */
export enum GuestSessionStatus {
  ACTIVE = 'active',                // Session en cours
  EXPIRED = 'expired',              // Expirée par le temps
  TERMINATED = 'terminated',        // Terminée manuellement
  QUOTA_EXCEEDED = 'quota_exceeded' // Quotas dépassés
}

/**
 * Actions d'audit pour les invités
 */
export enum GuestAction {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  QUOTA_WARNING_80 = 'quota_warning_80',
  QUOTA_WARNING_90 = 'quota_warning_90',
  QUOTA_WARNING_95 = 'quota_warning_95',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SESSION_EXPIRED = 'session_expired',
  SESSION_TERMINATED = 'session_terminated',
  DATA_USAGE = 'data_usage',
  INVALID_CODE = 'invalid_code',
  CODE_EXPIRED = 'code_expired',
  CODE_EXHAUSTED = 'code_exhausted'
}

/**
 * Résultats d'actions
 */
export enum ActionResult {
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error'
}

// ==========================================
// INTERFACES ET TYPES
// ==========================================

/**
 * Quotas personnalisés pour les codes d'accès
 */
export interface CustomQuotas {
  dataQuotaMB: number;
  timeQuotaMinutes: number;
  features?: {
    downloadEnabled?: boolean;
    uploadEnabled?: boolean;
    streamingEnabled?: boolean;
    priorityAccess?: boolean;
  };
}

/**
 * Quotas prédéfinis par niveau
 */
export const GUEST_LEVEL_QUOTAS: Record<GuestLevel, Omit<CustomQuotas, 'features'>> = {
  [GuestLevel.PREMIUM]: {
    dataQuotaMB: 5120,        // 5GB
    timeQuotaMinutes: 1440,   // 24h
  },
  [GuestLevel.STANDARD]: {
    dataQuotaMB: 1024,        // 1GB
    timeQuotaMinutes: 240,    // 4h
  },
  [GuestLevel.BASIC]: {
    dataQuotaMB: 100,         // 100MB
    timeQuotaMinutes: 30,     // 30min
  },
  [GuestLevel.CUSTOM]: {
    dataQuotaMB: 0,           // À définir
    timeQuotaMinutes: 0,      // À définir
  }
};

/**
 * Alertes de quotas
 */
export interface QuotaWarnings {
  '80'?: boolean;
  '90'?: boolean;
  '95'?: boolean;
}

/**
 * Détails d'audit (format JSON)
 */
export interface GuestAuditDetails {
  quotaUsagePercent?: number;
  remainingDataMB?: number;
  remainingTimeMinutes?: number;
  errorMessage?: string;
  sessionDuration?: number;
  [key: string]: any;
}

// ==========================================
// INTERFACES API
// ==========================================

/**
 * Requête de connexion invité
 */
export interface GuestLoginRequest {
  code: string;
}

/**
 * Réponse de connexion invité réussie
 */
export interface GuestLoginResponse {
  success: true;
  data: {
    session: {
      id: string;
      sessionToken: string;
      level: GuestLevel;
      quotas: {
        dataQuotaMB: number;
        timeQuotaMinutes: number;
      };
      startedAt: string;
      expiresAt?: string;
    };
    code: {
      description?: string;
      remainingUses?: number;
    };
  };
  message: string;
}

/**
 * Informations de session invité courante
 */
export interface GuestSessionInfo {
  id: string;
  status: GuestSessionStatus;
  level: GuestLevel;
  startedAt: string;
  lastActivity: string;
  expiresAt?: string;
  quotas: {
    dataQuotaMB: number;
    timeQuotaMinutes: number;
  };
  consumption: {
    dataConsumedMB: number;
    timeConsumedMinutes: number;
    dataPercentage: number;
    timePercentage: number;
  };
  connection: {
    ipAddress: string;
    userAgent?: string;
    location?: string;
  };
  warnings: QuotaWarnings;
}

/**
 * Requête de création de code d'accès (admin)
 */
export interface CreateGuestCodeRequest {
  level: GuestLevel;
  description?: string;
  expiresAt: string;
  maxUses?: number;
  customQuotas?: CustomQuotas; // Requis si level === CUSTOM
}

/**
 * Réponse de création de code d'accès
 */
export interface CreateGuestCodeResponse {
  success: true;
  data: {
    id: string;
    code: string;
    level: GuestLevel;
    description?: string;
    expiresAt: string;
    maxUses: number;
    quotas: {
      dataQuotaMB: number;
      timeQuotaMinutes: number;
    };
  };
  message: string;
}

/**
 * Informations d'un code d'accès (admin)
 */
export interface GuestCodeInfo {
  id: string;
  code: string;
  level: GuestLevel;
  description?: string;
  isActive: boolean;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  quotas: {
    dataQuotaMB: number;
    timeQuotaMinutes: number;
  };
  createdBy: {
    id: string;
    email?: string;
    username?: string;
  };
  createdAt: string;
  lastUsedAt?: string;
  activeSessions: number;
}

/**
 * Liste des sessions actives (admin)
 */
export interface ActiveGuestSession {
  id: string;
  code: string;
  level: GuestLevel;
  ipAddress: string;
  location?: string;
  startedAt: string;
  lastActivity: string;
  consumption: {
    dataConsumedMB: number;
    timeConsumedMinutes: number;
    dataPercentage: number;
    timePercentage: number;
  };
  status: GuestSessionStatus;
}

// ==========================================
// TYPES UTILITAIRES
// ==========================================

/**
 * Configuration de génération de code
 */
export interface CodeGenerationConfig {
  length: 8;
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  caseSensitive: true;
}

/**
 * Seuils d'alerte pour les quotas
 */
export const QUOTA_WARNING_THRESHOLDS = {
  WARNING_80: 80,
  WARNING_90: 90,
  WARNING_95: 95,
  EXCEEDED: 100
} as const;

/**
 * Durées maximales autorisées
 */
export const MAX_GUEST_DURATION = {
  [GuestLevel.BASIC]: 30,     // 30 minutes max
  [GuestLevel.STANDARD]: 240, // 4 heures max
  [GuestLevel.PREMIUM]: 1440, // 24 heures max
  [GuestLevel.CUSTOM]: 2880   // 48 heures max
} as const;

/**
 * Validation des codes d'accès
 */
export const CODE_VALIDATION = {
  LENGTH: 8,
  PATTERN: /^[A-Za-z0-9]{8}$/,
  MIN_EXPIRY_MINUTES: 5,      // Minimum 5 minutes
  MAX_EXPIRY_HOURS: 48,       // Maximum 48 heures
  MAX_USES: 100               // Maximum 100 utilisations
} as const;
