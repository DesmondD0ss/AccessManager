/**
 * Routes API pour le système d'accès temporaire (invités)
 * Version simple et progressive
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import { guestCodeService } from '../services/guestCodeService';
import { guestSessionService } from '../services/guestSessionService';

const router = Router();

/**
 * GET /api/guest/test
 * Test basique pour vérifier que les routes fonctionnent
 */
router.get('/test', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Routes invités opérationnelles',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}));

/**
 * POST /api/guest/validate-code
 * Valide un code d'accès avec le service réel
 */
router.post('/validate-code', [
  body('code')
    .notEmpty()
    .withMessage('Code d\'accès requis')
    .isLength({ min: 8, max: 8 })
    .withMessage('Le code doit contenir exactement 8 caractères')
    .matches(/^[A-Za-z0-9]{8}$/)
    .withMessage('Le code ne doit contenir que des lettres et chiffres'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Code d\'accès invalide');
  }

  const { code } = req.body;

  try {
    // Utiliser le vrai service pour valider le code
    const isValid = await guestCodeService.validateCode(code);
    
    res.json({
      success: true,
      data: {
        code,
        isValid,
        timestamp: new Date().toISOString(),
      },
      message: isValid ? 'Code d\'accès valide' : 'Code d\'accès invalide ou expiré',
    });
  } catch (error: any) {
    // En cas d'erreur, le code est considéré comme invalide
    res.json({
      success: true,
      data: {
        code,
        isValid: false,
        timestamp: new Date().toISOString(),
      },
      message: 'Code d\'accès invalide',
    });
  }
}));

/**
 * POST /api/guest/create-session
 * Crée une session invité après validation du code
 */
router.post('/create-session', [
  body('code')
    .notEmpty()
    .withMessage('Code d\'accès requis')
    .isLength({ min: 8, max: 8 })
    .withMessage('Le code doit contenir exactement 8 caractères')
    .matches(/^[A-Za-z0-9]{8}$/)
    .withMessage('Le code ne doit contenir que des lettres et chiffres'),
  body('sessionInfo')
    .optional()
    .isObject()
    .withMessage('Informations de session invalides'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { code, sessionInfo } = req.body;

  try {
    // Valider le code d'abord
    const isValidCode = await guestCodeService.validateCode(code);
    if (!isValidCode) {
      throw new ValidationError('Code d\'accès invalide ou expiré');
    }

    // Créer la session invité
    const result = await guestSessionService.createGuestSession({
      code,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      location: sessionInfo?.location,
    });

    res.json({
      success: true,
      data: {
        sessionId: result.session.id,
        token: result.session.sessionToken,
        level: result.code.level,
        quotas: {
          dataQuotaMB: result.session.dataQuotaMB,
          timeQuotaMinutes: result.session.timeQuotaMinutes,
        },
        expiresAt: result.session.expiresAt?.toISOString(),
        createdAt: result.session.createdAt.toISOString(),
        remainingUses: result.code.remainingUses,
      },
      message: 'Session créée avec succès',
    });
  } catch (error: any) {
    throw new ValidationError(error.message || 'Erreur lors de la création de la session');
  }
}));

/**
 * POST /api/guest/admin/create-code
 * Créer un code d'accès temporaire (ADMIN/SUPER_ADMIN seulement)
 * Le code expire en 5 minutes et ne peut être utilisé qu'une seule fois
 */
router.post('/admin/create-code', [
  body('level')
    .isIn(['basic', 'standard', 'premium', 'custom', 'BASIC', 'STANDARD', 'PREMIUM', 'CUSTOM'])
    .withMessage('Niveau invalide'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description invalide'),
  body('dataQuotaMB')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quota de données invalide (1-10000 MB)'),
  body('timeQuotaMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Quota de temps invalide (1-1440 minutes)'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { level, description, dataQuotaMB, timeQuotaMinutes } = req.body;

  try {
    // TODO: Ajouter l'authentification admin plus tard
    // Pour l'instant, on utilise l'admin existant
    const mockAdminId = 'cmdtjs75x0000zmbp8ntrea10'; // SUPER_ADMIN existant

    // Le code expire en 5 minutes et ne peut être utilisé qu'une seule fois
    const now = new Date();
    const expiresIn5Minutes = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const codeData = {
      level,
      description,
      expiresAt: expiresIn5Minutes,
      maxUses: 1, // Une seule utilisation possible
      createdBy: mockAdminId,
      // Quotas personnalisés si fournis
      ...(dataQuotaMB && { dataQuotaMB }),
      ...(timeQuotaMinutes && { timeQuotaMinutes }),
    };

    const result = await guestCodeService.createGuestCode(codeData);

    res.json({
      success: true,
      data: {
        id: result.id,
        code: result.code,
        level: result.level,
        description: result.description,
        expiresAt: result.expiresAt.toISOString(),
        maxUses: result.maxUses,
        quotas: {
          dataQuotaMB: result.quotas.dataQuotaMB,
          timeQuotaMinutes: result.quotas.timeQuotaMinutes,
        },
      },
      message: 'Code d\'accès créé avec succès',
    });
  } catch (error: any) {
    throw new ValidationError(error.message || 'Erreur lors de la création du code');
  }
}));

/**
 * POST /api/guest/login
 * Connexion avec code d'accès et création de session
 */
router.post('/login', [
  body('code')
    .notEmpty()
    .withMessage('Code d\'accès requis')
    .isLength({ min: 8, max: 8 })
    .withMessage('Le code doit contenir exactement 8 caractères')
    .matches(/^[A-Za-z0-9]{8}$/)
    .withMessage('Le code ne doit contenir que des lettres et chiffres'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Code d\'accès invalide');
  }

  const { code } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent');

  try {
    // Créer une session avec le code d'accès
    const sessionData: any = {
      code,
      ipAddress,
    };
    
    if (userAgent) {
      sessionData.userAgent = userAgent;
    }

    const result = await guestSessionService.createGuestSession(sessionData);

    res.json({
      success: true,
      data: {
        sessionId: result.session.id,
        level: result.code.level,
        quotas: {
          dataQuotaMB: result.session.dataQuotaMB,
          timeQuotaMinutes: result.session.timeQuotaMinutes,
        },
        startedAt: result.session.startedAt.toISOString(),
        expiresAt: result.session.expiresAt?.toISOString(),
        description: result.code.description,
        remainingUses: result.code.remainingUses,
      },
      message: 'Session créée avec succès',
    });
  } catch (error: any) {
    throw new ValidationError(error.message || 'Code d\'accès invalide');
  }
}));

/**
 * POST /api/guest/login
 * Connexion invité avec code d'accès - Alias pour validate-code
 * Cette route fait la même chose que validate-code mais avec un nom plus explicite
 */
router.post('/login', [
  body('code')
    .isString()
    .isLength({ min: 6, max: 50 })
    .withMessage('Le code d\'accès doit contenir entre 6 et 50 caractères'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validation des entrées
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données d\'entrée invalides', errors.array());
  }

  const { code } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent');

  try {
    // Valider le code et créer la session
    const loginData: {
      code: string;
      ipAddress: string;
      userAgent?: string;
    } = {
      code,
      ipAddress: ip,
    };
    
    if (userAgent) {
      loginData.userAgent = userAgent;
    }
    
    const result = await guestSessionService.loginWithCode(loginData);

    res.status(200).json({
      success: true,
      data: {
        sessionId: result.session.id,
        accessCode: {
          level: result.code.level,
          description: result.code.description,
          remainingUses: result.code.remainingUses,
        },
        quotas: {
          dataQuotaMB: result.session.dataQuotaMB,
          timeQuotaMinutes: result.session.timeQuotaMinutes,
        },
        startedAt: result.session.startedAt.toISOString(),
        expiresAt: result.session.expiresAt?.toISOString(),
      },
      message: 'Connexion invité réussie',
    });
  } catch (error: any) {
    throw new ValidationError(error.message || 'Code d\'accès invalide');
  }
}));

/**
 * GET /api/guest/admin/codes
 * Récupérer tous les codes d'accès (ADMIN/SUPER_ADMIN seulement)
 */
router.get('/admin/codes', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Ajouter l'authentification admin plus tard
    const codes = await guestCodeService.getAllCodes();

    res.json({
      success: true,
      data: {
        codes,
        count: codes.length,
      },
      message: 'Codes d\'accès récupérés avec succès',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Erreur lors de la récupération des codes',
      },
    });
  }
}));

export default router;
