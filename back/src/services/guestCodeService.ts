/**
 * Service de gestion des codes d'accès invités
 */

import { PrismaClient } from '@prisma/client';
import { 
  GuestLevel, 
  GuestSessionStatus, 
  CustomQuotas, 
  GUEST_LEVEL_QUOTAS,
  CODE_VALIDATION,
  MAX_GUEST_DURATION
} from '../types/guest';

const prisma = new PrismaClient();

export class GuestCodeService {
  
  /**
   * Génère un code d'accès aléatoire de 8 caractères
   */
  private generateCode(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
    let code = '';
    
    // Assurer au moins une majuscule, une minuscule et un chiffre
    code += charset.slice(0, 26).charAt(Math.floor(Math.random() * 26)); // Majuscule
    code += charset.slice(36).charAt(Math.floor(Math.random() * 26));    // Minuscule
    code += charset.slice(26, 36).charAt(Math.floor(Math.random() * 10)); // Chiffre
    
    // Compléter avec 5 caractères aléatoires
    for (let i = 3; i < 8; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Mélanger le code
    return code.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Vérifie qu'un code est unique
   */
  private async isCodeUnique(code: string): Promise<boolean> {
    const existingCode = await prisma.guestAccessCode.findUnique({
      where: { code }
    });
    return !existingCode;
  }

  /**
   * Génère un code unique
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateCode();
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique code after multiple attempts');
      }
    } while (!(await this.isCodeUnique(code)));

    return code;
  }

  /**
   * Obtient les quotas pour un niveau donné
   */
  private getQuotasForLevel(level: GuestLevel, customQuotas?: CustomQuotas) {
    if (level === GuestLevel.CUSTOM && customQuotas) {
      return {
        dataQuotaMB: customQuotas.dataQuotaMB,
        timeQuotaMinutes: customQuotas.timeQuotaMinutes
      };
    }
    
    return GUEST_LEVEL_QUOTAS[level];
  }

  /**
   * Valide les paramètres de création d'un code
   */
  private validateCodeCreation(data: {
    level: GuestLevel;
    expiresAt: Date;
    maxUses?: number;
    customQuotas?: CustomQuotas;
  }) {
    const { level, expiresAt, maxUses, customQuotas } = data;

    // Vérifier l'expiration
    const now = new Date();
    const minExpiry = new Date(now.getTime() + CODE_VALIDATION.MIN_EXPIRY_MINUTES * 60 * 1000);
    const maxExpiry = new Date(now.getTime() + CODE_VALIDATION.MAX_EXPIRY_HOURS * 60 * 60 * 1000);

    if (expiresAt < minExpiry) {
      throw new Error(`Code must expire at least ${CODE_VALIDATION.MIN_EXPIRY_MINUTES} minutes from now`);
    }

    if (expiresAt > maxExpiry) {
      throw new Error(`Code cannot expire more than ${CODE_VALIDATION.MAX_EXPIRY_HOURS} hours from now`);
    }

    // Vérifier le nombre d'utilisations
    if (maxUses && (maxUses < 1 || maxUses > CODE_VALIDATION.MAX_USES)) {
      throw new Error(`Max uses must be between 1 and ${CODE_VALIDATION.MAX_USES}`);
    }

    // Vérifier les quotas personnalisés
    if (level === GuestLevel.CUSTOM) {
      if (!customQuotas) {
        throw new Error('Custom quotas are required for CUSTOM level');
      }

      if (customQuotas.dataQuotaMB < 1 || customQuotas.dataQuotaMB > 10240) {
        throw new Error('Data quota must be between 1MB and 10GB');
      }

      if (customQuotas.timeQuotaMinutes < 1 || customQuotas.timeQuotaMinutes > MAX_GUEST_DURATION.custom) {
        throw new Error(`Time quota must be between 1 minute and ${MAX_GUEST_DURATION.custom} minutes`);
      }
    }
  }

  /**
   * Crée un nouveau code d'accès invité
   */
  async createGuestCode(data: {
    level: GuestLevel;
    description?: string;
    expiresAt: Date;
    maxUses?: number;
    customQuotas?: CustomQuotas;
    createdBy: string;
  }) {
    this.validateCodeCreation(data);

    const code = await this.generateUniqueCode();
    const quotas = this.getQuotasForLevel(data.level, data.customQuotas);

    const guestCode = await prisma.guestAccessCode.create({
      data: {
        code,
        level: data.level,
        description: data.description || null,
        expiresAt: data.expiresAt,
        maxUses: data.maxUses || 1,
        customQuotas: data.customQuotas ? JSON.stringify(data.customQuotas) : null,
        createdBy: data.createdBy,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      }
    });

    return {
      ...guestCode,
      quotas,
      customQuotas: guestCode.customQuotas ? JSON.parse(guestCode.customQuotas) : null,
    };
  }

  /**
   * Récupère tous les codes d'accès avec filtres
   */
  async getGuestCodes(filters?: {
    level?: GuestLevel;
    isActive?: boolean;
    createdBy?: string;
  }) {
    const codes = await prisma.guestAccessCode.findMany({
      where: {
        ...(filters?.level && { level: filters.level }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.createdBy && { createdBy: filters.createdBy }),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
        guestSessions: {
          where: {
            status: GuestSessionStatus.ACTIVE,
          },
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return codes.map((code: any) => {
      const quotas = this.getQuotasForLevel(code.level as GuestLevel, 
        code.customQuotas ? JSON.parse(code.customQuotas) : undefined);
      
      return {
        ...code,
        quotas,
        customQuotas: code.customQuotas ? JSON.parse(code.customQuotas) : null,
        activeSessions: code.guestSessions.length,
      };
    });
  }

  /**
   * Récupère un code d'accès par son ID
   */
  async getGuestCodeById(id: string) {
    const code = await prisma.guestAccessCode.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
        guestSessions: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            dataConsumedMB: true,
            timeConsumedMinutes: true,
          }
        }
      }
    });

    if (!code) {
      throw new Error('Guest code not found');
    }

    const quotas = this.getQuotasForLevel(code.level as GuestLevel, 
      code.customQuotas ? JSON.parse(code.customQuotas) : undefined);

    return {
      ...code,
      quotas,
      customQuotas: code.customQuotas ? JSON.parse(code.customQuotas) : null,
      activeSessions: code.guestSessions.filter((s: any) => s.status === GuestSessionStatus.ACTIVE).length,
    };
  }

  /**
   * Met à jour un code d'accès
   */
  async updateGuestCode(id: string, data: {
    description?: string;
    isActive?: boolean;
    expiresAt?: Date;
    maxUses?: number;
  }) {
    const code = await prisma.guestAccessCode.findUnique({
      where: { id }
    });

    if (!code) {
      throw new Error('Guest code not found');
    }

    // Validation des nouvelles données
    if (data.expiresAt) {
      const now = new Date();
      if (data.expiresAt <= now) {
        throw new Error('Expiration date must be in the future');
      }
    }

    if (data.maxUses && data.maxUses < code.currentUses) {
      throw new Error('Max uses cannot be less than current uses');
    }

    return await prisma.guestAccessCode.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un code d'accès (et ses sessions associées)
   */
  async deleteGuestCode(id: string) {
    const code = await prisma.guestAccessCode.findUnique({
      where: { id },
      include: {
        guestSessions: {
          where: {
            status: GuestSessionStatus.ACTIVE,
          }
        }
      }
    });

    if (!code) {
      throw new Error('Guest code not found');
    }

    // Terminer toutes les sessions actives
    if (code.guestSessions.length > 0) {
      await prisma.guestSession.updateMany({
        where: {
          accessCodeId: id,
          status: GuestSessionStatus.ACTIVE,
        },
        data: {
          status: GuestSessionStatus.TERMINATED,
          terminatedAt: new Date(),
        }
      });
    }

    // Supprimer le code
    return await prisma.guestAccessCode.delete({
      where: { id }
    });
  }

  /**
   * Nettoie les codes expirés et les sessions inactives
   */
  async cleanupExpiredCodes() {
    const now = new Date();

    // Marquer les codes expirés comme inactifs
    const expiredCodes = await prisma.guestAccessCode.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      }
    });

    // Terminer les sessions des codes expirés
    await prisma.guestSession.updateMany({
      where: {
        accessCode: {
          expiresAt: {
            lt: now,
          }
        },
        status: GuestSessionStatus.ACTIVE,
      },
      data: {
        status: GuestSessionStatus.EXPIRED,
        terminatedAt: now,
      }
    });

    return {
      expiredCodes: expiredCodes.count,
    };
  }

  /**
   * Valide un code d'accès sans créer de session
   */
  async validateCode(code: string): Promise<boolean> {
    try {
      const accessCode = await prisma.guestAccessCode.findUnique({
        where: { code },
      });

      if (!accessCode) {
        return false;
      }

      // Vérifications de validité
      if (!accessCode.isActive) {
        return false;
      }

      if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
        return false;
      }

      if (accessCode.maxUses && accessCode.currentUses >= accessCode.maxUses) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating access code:', error);
      return false;
    }
  }

  /**
   * Récupère tous les codes d'accès pour l'administration
   */
  async getAllCodes() {
    try {
      const codes = await prisma.guestAccessCode.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          code: true,
          level: true,
          description: true,
          expiresAt: true,
          maxUses: true,
          currentUses: true,
          isActive: true,
          createdAt: true,
          createdBy: true,
          customQuotas: true,
        }
      });

      // Transformer les codes pour inclure les quotas parsés
      const transformedCodes = codes.map((code: any) => {
        let quotas: any = {};
        if (code.customQuotas) {
          try {
            quotas = JSON.parse(code.customQuotas);
          } catch (error) {
            console.error('Error parsing custom quotas:', error);
          }
        }

        return {
          ...code,
          dataQuotaMB: quotas.dataQuotaMB || null,
          timeQuotaMinutes: quotas.timeQuotaMinutes || null,
          maxDevices: quotas.maxDevices || null,
        };
      });

      return transformedCodes;
    } catch (error) {
      console.error('Error retrieving access codes:', error);
      throw new Error('Erreur lors de la récupération des codes d\'accès');
    }
  }
}

export const guestCodeService = new GuestCodeService();
