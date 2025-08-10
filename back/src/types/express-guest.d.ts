/**
 * Extension des types Express pour le système d'accès invités
 */

declare global {
  namespace Express {
    interface Request {
      guestSession?: {
        id: string;
        status: string;
        accessCode: {
          level: string;
          description?: string | null;
        };
        ipAddress: string;
        userAgent?: string | null;
        location?: string;
        startedAt: Date;
        lastActivity: Date;
        expiresAt?: Date;
        dataQuotaMB: number;
        timeQuotaMinutes: number;
        dataConsumedMB: number;
        timeConsumedMinutes: number;
        warningsSent?: string;
        sessionToken?: string;
      };
    }
  }
}

export {};
