import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { 
  generateJWT, 
  generateRefreshToken, 
  verifyRefreshToken, 
  generateCustomJWT,
  verifyCustomJWT,
  authenticate,
  AuthenticatedUser,
  UserRole
} from '../middleware/auth.js';
import { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  ConflictError 
} from '../middleware/error-handler.js';
import { appConfig } from '../config/config.js';
import { logUtils, logger } from '../utils/logger.js';
import { emailService } from '../services/emailService.js';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Connexion utilisateur avec email/username et mot de passe
 */
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('Email ou nom d\'utilisateur requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mot de passe requis (minimum 6 caractères)'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validation des données
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données de connexion invalides');
  }

  const { identifier, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent');

  try {
    // Recherche de l'utilisateur par email ou username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      logUtils.logLoginAttempt(identifier, false, ip, userAgent);
      throw new AuthenticationError('Identifiants incorrects');
    }

    // Vérification du compte actif
    if (!user.isActive) {
      logUtils.logLoginAttempt(identifier, false, ip, userAgent);
      throw new AuthenticationError('Compte désactivé');
    }

    // Vérification du blocage temporaire
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      logUtils.logLoginAttempt(identifier, false, ip, userAgent);
      throw new AuthenticationError('Compte temporairement bloqué');
    }

    // Vérification du mot de passe
    if (!user.hashedPassword) {
      logUtils.logLoginAttempt(identifier, false, ip, userAgent);
      throw new AuthenticationError('Identifiants incorrects');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    
    if (!isPasswordValid) {
      // Incrémenter les tentatives de connexion
      const updatedAttempts = user.loginAttempts + 1;
      const shouldLock = updatedAttempts >= appConfig.security.maxLoginAttempts;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: updatedAttempts,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + appConfig.security.lockoutTime),
          }),
        },
      });

      logUtils.logLoginAttempt(identifier, false, ip, userAgent);
      throw new AuthenticationError('Identifiants incorrets');
    }

    // Réinitialiser les tentatives de connexion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Créer l'objet utilisateur authentifié
    const authUser: AuthenticatedUser = {
      id: user.id,
      ...(user.email && { email: user.email }),
      ...(user.username && { username: user.username }),
      role: user.role,
      isActive: true,
    };

    // Générer les tokens
    const accessToken = generateJWT(authUser);
    const refreshToken = generateRefreshToken(authUser);

    // Stocker le refresh token en base
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        ipAddress: ip,
        userAgent: userAgent || null,
      },
    });

    logUtils.logLoginAttempt(identifier, true, ip, userAgent);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: appConfig.jwt.expiresIn,
        },
      },
      message: 'Connexion réussie',
    });

  } catch (error) {
    if (!(error instanceof AuthenticationError)) {
      logUtils.logLoginAttempt(identifier, false, ip, userAgent);
    }
    throw error;
  }
}));

/**
 * POST /api/auth/login-code
 * FONCTIONNALITÉ TEMPORAIREMENT DÉSACTIVÉE 
 * (Sera réimplémentée correctement selon les spécifications finales)
 */
// router.post('/login-code', [
//   body('code')
//     .notEmpty()
//     .withMessage('Code d\'accès requis'),
// ], asyncHandler(async (req: Request, res: Response): Promise<void> => {
//   res.status(501).json({
//     success: false,
//     message: 'Fonctionnalité temporairement désactivée - En cours de développement',
//   });
// }));

/**
 * POST /api/auth/refresh
 * Renouvellement du token d'accès
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requis'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Refresh token invalide');
  }

  const { refreshToken } = req.body;

  // Vérifier le refresh token
  const { userId } = verifyRefreshToken(refreshToken);

  // Vérifier en base de données
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token invalide ou expiré');
  }

  // Vérifier que le userId du token correspond à l'utilisateur en base
  if (storedToken.userId !== userId) {
    throw new AuthenticationError('Token non autorisé pour cet utilisateur');
  }

  if (!storedToken.user.isActive) {
    throw new AuthenticationError('Compte utilisateur désactivé');
  }

  // Créer un nouvel access token
  const authUser: AuthenticatedUser = {
    id: storedToken.user.id,
    ...(storedToken.user.email && { email: storedToken.user.email }),
    ...(storedToken.user.username && { username: storedToken.user.username }),
    role: storedToken.user.role,
    isActive: storedToken.user.isActive,
  };

  const newAccessToken = generateJWT(authUser);

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      expiresIn: appConfig.jwt.expiresIn,
    },
    message: 'Token renouvelé avec succès',
  });
}));

/**
 * POST /api/auth/logout
 * Déconnexion (révocation du refresh token)
 */
router.post('/logout', [
  body('refreshToken')
    .optional()
    .isString(),
], authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  const userId = req.user!.id;

  if (refreshToken) {
    // Révoquer le refresh token spécifique
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId: userId,
      },
      data: {
        isRevoked: true,
      },
    });
  } else {
    // Révoquer tous les refresh tokens de l'utilisateur
    await prisma.refreshToken.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
}));

/**
 * POST /api/auth/register
 * Inscription utilisateur (si activée)
 */
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe requis (minimum 8 caractères)')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Nom d\'utilisateur invalide (caractères alphanumériques, - et _ uniquement)'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données d\'inscription invalides');
  }

  const { email, password, firstName, lastName, username } = req.body;

  // Vérifier que l'email n'existe pas
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new ConflictError('Cette adresse email est déjà utilisée');
  }

  // Vérifier que le username n'existe pas (si fourni)
  if (username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictError('Ce nom d\'utilisateur est déjà pris');
    }
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, appConfig.security.saltRounds);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email,
      username,
      hashedPassword,
      firstName,
      lastName,
      role: UserRole.USER,
      isActive: true,
    },
  });

  // Générer les tokens JWT pour connecter automatiquement l'utilisateur
  const userForToken: AuthenticatedUser = {
    id: user.id,
    email: user.email ?? undefined,
    username: user.username ?? undefined,
    role: user.role,
    isActive: true,
  };

  const accessToken = generateJWT(userForToken);
  const refreshToken = generateRefreshToken(userForToken);

  // Mettre à jour la dernière connexion
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '5m',
      },
    },
    message: 'Inscription réussie',
  });
}));

/**
 * GET /api/auth/me
 * Informations de l'utilisateur connecté
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthenticationError('Utilisateur non trouvé');
  }

  res.json({
    success: true,
    data: { user },
  });
}));

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Email valide requis')
    .normalizeEmail(),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validation des données
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Email invalide');
  }

  const { email } = req.body;

  try {
    // Debug en mode développement
    if (appConfig.isDevelopment) {
      console.log('\n🔍 DEBUG FORGOT PASSWORD:');
      console.log('📧 Email recherché:', email);
    }

    // Recherche de l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Debug en mode développement
    if (appConfig.isDevelopment) {
      console.log('👤 Utilisateur trouvé:', user ? 'OUI' : 'NON');
      if (user) {
        console.log('📝 ID utilisateur:', user.id);
      }
    }

    // Ne pas révéler si l'email existe ou non pour la sécurité
    // Toujours retourner une réponse positive
    if (user) {
      // Générer un token de réinitialisation (valide 15 minutes)
      const resetToken = generateCustomJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'password-reset'
      }, '15m');

      // Envoyer l'email de réinitialisation
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email!, 
        resetToken, 
        user.firstName || user.username || undefined
      );

      logger.info('Token de réinitialisation généré', {
        userId: user.id,
        email: user.email,
        emailSent,
        resetToken: appConfig.isDevelopment ? resetToken : '[HIDDEN]'
      });

      // En mode développement, afficher clairement le token dans la console
      if (appConfig.isDevelopment) {
        const frontendUrl = appConfig.cors.origin.split(',')[0] || 'http://localhost:3000';
        console.log('\n🔑 TOKEN DE RÉINITIALISATION (MODE DEV SEULEMENT):');
        console.log('📧 Email:', user.email);
        console.log('🎫 Token:', resetToken);
        console.log('🔗 URL complète:', `${frontendUrl}/auth/reset-password?token=${resetToken}`);
        console.log('⏰ Expire dans: 15 minutes\n');
      }

      // Réponse unifiée (même si l'email n'a pas pu être envoyé)
      res.json({
        success: true,
        message: 'Instructions de réinitialisation envoyées par email',
        // Token visible seulement en développement pour les tests
        ...(appConfig.isDevelopment && { resetToken })
      });
    } else {
      // Même réponse si l'utilisateur n'existe pas (pour éviter l'énumération d'emails)
      res.json({
        success: true,
        message: 'Instructions de réinitialisation envoyées par email'
      });
    }
  } catch (error) {
    logger.error('Erreur lors de la demande de réinitialisation', { error, email });
    throw error;
  }
}));

/**
 * POST /api/auth/reset-password
 * Confirmation de réinitialisation de mot de passe avec token
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token de réinitialisation requis'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validation des données
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données de réinitialisation invalides');
  }

  const { token, password } = req.body;

  try {
    // Vérifier et décoder le token
    const decoded = verifyCustomJWT(token) as any;
    
    if (!decoded || decoded.type !== 'password-reset') {
      throw new AuthenticationError('Token de réinitialisation invalide ou expiré');
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new AuthenticationError('Utilisateur non trouvé');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        hashedPassword: hashedPassword,
        updatedAt: new Date()
      }
    });

    logger.info('Mot de passe réinitialisé avec succès', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de la réinitialisation', { error });
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Token de réinitialisation invalide ou expiré');
  }
}));

/**
 * POST /api/auth/verify-reset-token
 * Vérification de la validité d'un token de réinitialisation
 */
router.post('/verify-reset-token', [
  body('token')
    .notEmpty()
    .withMessage('Token de réinitialisation requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validation des données
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Token requis');
  }

  const { token } = req.body;

  try {
    // Vérifier et décoder le token
    const decoded = verifyCustomJWT(token) as any;
    
    if (!decoded || decoded.type !== 'password-reset') {
      throw new AuthenticationError('Token de réinitialisation invalide ou expiré');
    }

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new AuthenticationError('Utilisateur non trouvé');
    }

    res.json({
      success: true,
      message: 'Token valide',
      valid: true
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Token invalide ou expiré',
      valid: false
    });
  }
}));

/**
 * GET /api/auth/debug/users (DEV ONLY)
 * Liste des utilisateurs pour debug
 */
if (appConfig.isDevelopment) {
  router.get('/debug/users', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('\n👥 UTILISATEURS EN BASE (MODE DEV):');
      users.forEach((user: any) => {
        console.log(`📧 ${user.email} | 👤 ${user.username} | 🏷️ ${user.role} | ✅ ${user.isActive ? 'Actif' : 'Inactif'}`);
      });
      console.log(`\n📊 Total: ${users.length} utilisateur(s)\n`);

      res.json({
        success: true,
        users: users
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des utilisateurs', { error });
      throw error;
    }
  }));
}

/**
 * POST /api/auth/login/code
 * Connexion avec code d'accès temporaire (nouveau format compatible frontend)
 */
router.post('/login/code', [
  body('code')
    .notEmpty()
    .withMessage('Code d\'accès requis'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Code d\'accès invalide');
  }

  const { code } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  console.log('\n🔍 DEBUG LOGIN CODE:');
  console.log('📄 Code reçu:', code);
  console.log('📏 Longueur reçue:', code.length, 'caractères');
  console.log('🔤 Caractères:', code.split('').join(' '));

  // Recherche du code d'accès
  const accessCode = await prisma.accessCode.findUnique({
    where: { code },
  });

  if (!accessCode) {
    console.log('❌ Code non trouvé');
    throw new AuthenticationError('Code d\'accès invalide');
  }

  console.log('✅ Code trouvé:', accessCode.description);

  // Vérifications de validité
  if (!accessCode.isActive) {
    console.log('❌ Code désactivé');
    throw new AuthenticationError('Code d\'accès désactivé');
  }

  if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
    console.log('❌ Code expiré');
    throw new AuthenticationError('Code d\'accès expiré');
  }

  if (accessCode.maxUses && accessCode.currentUses >= accessCode.maxUses) {
    console.log('❌ Code épuisé');
    throw new AuthenticationError('Code d\'accès épuisé');
  }

  // Incrémenter l'utilisation
  await prisma.accessCode.update({
    where: { id: accessCode.id },
    data: {
      currentUses: accessCode.currentUses + 1,
    },
  });

  // Créer un utilisateur temporaire pour la session
  const tempUser = {
    id: `code-${accessCode.id}-${Date.now()}`,
    email: undefined,
    username: `Code-${accessCode.code}`,
    role: 'GUEST' as const,
    isActive: true,
  };

  // Générer les tokens JWT comme pour un utilisateur normal
  const accessToken = generateJWT(tempUser);
  const refreshToken = generateRefreshToken(tempUser);

  // Créer une session d'accès
  const session = await prisma.accessSession.create({
    data: {
      accessCodeId: accessCode.id,
      ipAddress: ip,
      userAgent: req.get('User-Agent') || null,
      dataQuotaMB: accessCode.dataQuotaMB,
      timeQuotaMinutes: accessCode.timeQuotaMinutes,
    },
  });

  console.log('🎫 Session créée:', session.id);
  console.log('👤 Utilisateur temporaire créé\n');

  // Réponse compatible avec le frontend (format identique au login normal)
  res.json({
    success: true,
    data: {
      user: {
        id: tempUser.id,
        email: null,
        username: tempUser.username,
        firstName: null,
        lastName: null,
        role: tempUser.role,
        isActive: true,
        isEmailVerified: true,
        // Informations spécifiques au code d'accès
        accessCodeId: accessCode.id,
        sessionId: session.id,
        dataQuotaMB: session.dataQuotaMB,
        timeQuotaMinutes: session.timeQuotaMinutes,
      },
      tokens: {
        accessToken,
        refreshToken,
      }
    },
    message: 'Connexion réussie avec code d\'accès',
  });
}));

/**
 * POST /api/auth/debug/create-test-code (DEV ONLY)
 * FONCTIONNALITÉ TEMPORAIREMENT DÉSACTIVÉE
 * (Code d'accès en cours de redéfinition)
 */
if (appConfig.isDevelopment) {
  router.post('/debug/create-test-code', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({
      success: false,
      message: 'Fonctionnalité des codes d\'accès temporairement désactivée - En cours de redéfinition',
    });
  }));
}

/**
 * POST /api/guest/login
 * Connexion des invités avec un code d'accès
 * @deprecated Cette route est obsolète. Utilisez /api/guest/login à la place
 */
router.post('/guest/login', [
  body('code')
    .notEmpty()
    .withMessage('Code d\'accès requis'),
], asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({
    success: false,
    message: 'Cette API est obsolète. Veuillez utiliser /api/guest/login à la place.',
    redirect: '/api/guest/login',
    error: 'DEPRECATED_ENDPOINT'
  });
}));

export default router;
