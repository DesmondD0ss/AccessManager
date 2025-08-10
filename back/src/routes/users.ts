import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.js';
import { asyncHandler, ValidationError, ConflictError, NotFoundError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';
import { appConfig } from '../config/config.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/users
 * @desc Liste tous les utilisateurs (avec pagination)
 * @access Private (Admin)
 */
router.get('/', authenticate, requirePermission('users:read'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite entre 1 et 100'),
  query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Recherche max 100 caractères'),
  query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('Statut: active, inactive, all'),
  query('sortBy').optional().isIn(['username', 'email', 'createdAt', 'lastLoginAt']).withMessage('Tri invalide'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre: asc, desc')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de requête invalides');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const status = req.query.status as string || 'all';
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = req.query.sortOrder as string || 'desc';
  const skip = (page - 1) * limit;

  // Construction des filtres
  const where: any = {};
  
  if (status !== 'all') {
    where.isActive = status === 'active';
  }

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Récupération des utilisateurs avec statistiques
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        loginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);

  // Enrichissement avec statistiques détaillées
  const enrichedUsers = await Promise.all(
    users.map(async (user: any) => {
      const [currentSession, stats] = await Promise.all([
        prisma.accessSession.findFirst({
          where: { userId: user.id, status: 'ACTIVE' },
          select: {
            id: true,
            startedAt: true,
            dataUsedMB: true,
            timeUsedMinutes: true,
            ipAddress: true,
            deviceName: true
          }
        }),
        prisma.accessSession.aggregate({
          where: { userId: user.id },
          _sum: {
            dataUsedMB: true,
            timeUsedMinutes: true
          },
          _count: true
        })
      ]);

      return {
        ...user,
        stats: {
          totalSessions: stats._count,
          totalDataUsedMB: Math.round((stats._sum?.dataUsedMB || 0)),
          totalTimeUsedHours: Math.round((stats._sum?.timeUsedMinutes || 0) / 60 * 10) / 10,
          dataQuotaUsagePercent: 0, // À calculer avec UserQuota
          timeQuotaUsagePercent: 0  // À calculer avec UserQuota
        },
        currentSession,
        isLocked: user.lockedUntil ? user.lockedUntil > new Date() : false
      };
    })
  );

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: {
      users: enrichedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: { search, status, sortBy, sortOrder }
    }
  });

  logger.info('Users list retrieved', {
    userId: (req as any).user?.id,
    totalCount,
    page,
    search: search || 'none'
  });
}));

/**
 * @route GET /api/users/:id
 * @desc Récupère un utilisateur par ID
 * @access Private (Admin)
 */
router.get('/:id', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      loginAttempts: true,
      lockedUntil: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      accessSessions: {
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          dataUsedMB: true,
          timeUsedMinutes: true,
          ipAddress: true,
          deviceName: true,
          status: true
        },
        orderBy: { startedAt: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Statistiques détaillées
  const stats = await prisma.accessSession.aggregate({
    where: { userId: id },
    _sum: {
      dataUsedMB: true,
      timeUsedMinutes: true
    },
    _avg: {
      dataUsedMB: true,
      timeUsedMinutes: true
    }
  });

  const enrichedUser = {
    ...user,
    stats: {
      totalSessions: user.accessSessions?.length || 0,
      totalDataUsedMB: Math.round((stats._sum?.dataUsedMB || 0)),
      totalTimeUsedHours: Math.round((stats._sum?.timeUsedMinutes || 0) / 60 * 10) / 10,
      averageDataPerSessionMB: Math.round((stats._avg?.dataUsedMB || 0)),
      averageTimePerSessionMinutes: Math.round((stats._avg?.timeUsedMinutes || 0)),
      dataQuotaUsagePercent: 0, // À calculer avec UserQuota
      timeQuotaUsagePercent: 0  // À calculer avec UserQuota
    },
    isLocked: user.lockedUntil ? user.lockedUntil > new Date() : false
  };

  res.json({
    success: true,
    data: { user: enrichedUser }
  });

  logger.info('User details retrieved', {
    adminUserId: (req as any).user?.id,
    targetUserId: id
  });
}));

/**
 * @route POST /api/users
 * @desc Créer un nouveau utilisateur
 * @access Private (Admin)
 */
router.post('/', authenticate, requirePermission('users:create'), [
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username 3-50 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('firstName').optional().isLength({ max: 100 }).withMessage('Prénom max 100 caractères'),
  body('lastName').optional().isLength({ max: 100 }).withMessage('Nom max 100 caractères'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('role').optional().isIn(['USER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Rôle invalide'),
  body('isActive').optional().isBoolean().withMessage('IsActive doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données utilisateur invalides');
  }

  const {
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    role = 'USER',
    isActive = true
  } = req.body;

  // Vérification unicité username et email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new ConflictError('Ce nom d\'utilisateur est déjà utilisé');
    }
    if (existingUser.email === email) {
      throw new ConflictError('Cette adresse email est déjà utilisée');
    }
  }

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash(password, appConfig.security.saltRounds);

  // Création de l'utilisateur
  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      isActive,
      isEmailVerified: false
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    data: { user: newUser },
    message: 'Utilisateur créé avec succès'
  });

  logger.info('User created', {
    adminUserId: (req as any).user?.id,
    newUserId: newUser.id,
    username,
    email,
    role
  });
}));

/**
 * @route PUT /api/users/:id
 * @desc Mettre à jour un utilisateur
 * @access Private (Admin)
 */
router.put('/:id', authenticate, requirePermission('users:update'), [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis'),
  body('username').optional().isLength({ min: 3, max: 50 }).withMessage('Username 3-50 caractères'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('firstName').optional().isLength({ max: 100 }).withMessage('Prénom max 100 caractères'),
  body('lastName').optional().isLength({ max: 100 }).withMessage('Nom max 100 caractères'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('role').optional().isIn(['USER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Rôle invalide'),
  body('isActive').optional().isBoolean().withMessage('IsActive doit être un booléen'),
  body('isEmailVerified').optional().isBoolean().withMessage('IsEmailVerified doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données de mise à jour invalides');
  }

  const { id } = req.params;
  const updateData = req.body;

  // Vérifier que l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, role: true }
  });

  if (!existingUser) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérification unicité si changement username ou email
  if (updateData.username || updateData.email) {
    const conflictUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              ...(updateData.username ? [{ username: updateData.username }] : []),
              ...(updateData.email ? [{ email: updateData.email }] : [])
            ]
          }
        ]
      }
    });

    if (conflictUser) {
      if (conflictUser.username === updateData.username) {
        throw new ConflictError('Ce nom d\'utilisateur est déjà utilisé');
      }
      if (conflictUser.email === updateData.email) {
        throw new ConflictError('Cette adresse email est déjà utilisée');
      }
    }
  }

  // Supprimer les champs undefined
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    data: { user: updatedUser },
    message: 'Utilisateur mis à jour avec succès'
  });

  logger.info('User updated', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    updatedFields: Object.keys(updateData)
  });
}));

/**
 * @route DELETE /api/users/:id
 * @desc Supprimer un utilisateur
 * @access Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, role: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Empêcher la suppression du dernier SUPER_ADMIN
  if (user.role === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true }
    });

    if (superAdminCount <= 1) {
      throw new ValidationError('Impossible de supprimer le dernier super administrateur');
    }
  }

  // Fermer les sessions actives avant suppression
  await prisma.accessSession.updateMany({
    where: { userId: id, status: 'ACTIVE' },
    data: { 
      status: 'TERMINATED',
      endedAt: new Date()
    }
  });

  // Suppression de l'utilisateur (cascade sur les sessions)
  await prisma.user.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Utilisateur supprimé avec succès'
  });

  logger.info('User deleted', {
    adminUserId: (req as any).user?.id,
    deletedUserId: id,
    deletedUsername: user.username
  });
}));

/**
 * @route POST /api/users/:id/reset-password
 * @desc Réinitialiser le mot de passe d'un utilisateur
 * @access Private (Admin)
 */
router.post('/:id/reset-password', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe minimum 6 caractères')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const hashedPassword = await bcrypt.hash(newPassword, appConfig.security.saltRounds);

  await prisma.user.update({
    where: { id },
    data: {
      hashedPassword,
      loginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès'
  });

  logger.info('Password reset by admin', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    targetUsername: user.username
  });
}));

/**
 * @route POST /api/users/:id/unlock
 * @desc Débloquer un utilisateur
 * @access Private (Admin)
 */
router.post('/:id/unlock', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, lockedUntil: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  if (!user.lockedUntil || user.lockedUntil <= new Date()) {
    throw new ValidationError('L\'utilisateur n\'est pas bloqué');
  }

  await prisma.user.update({
    where: { id },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Utilisateur débloqué avec succès'
  });

  logger.info('User unlocked by admin', {
    adminUserId: (req as any).user?.id,
    targetUserId: id,
    targetUsername: user.username
  });
}));

/**
 * @route GET /api/users/:id/sessions
 * @desc Récupérer les sessions d'un utilisateur
 * @access Private (Admin)
 */
router.get('/:id/sessions', authenticate, requireAdmin, [
  param('id').isString().notEmpty().withMessage('ID utilisateur requis'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite entre 1 et 100'),
  query('status').optional().isIn(['ACTIVE', 'PAUSED', 'EXPIRED', 'TERMINATED', 'QUOTA_EXCEEDED']).withMessage('Statut invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const where: any = { userId: id };
  if (status) {
    where.status = status;
  }

  const [sessions, totalCount] = await Promise.all([
    prisma.accessSession.findMany({
      where,
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        dataUsedMB: true,
        timeUsedMinutes: true,
        ipAddress: true,
        macAddress: true,
        deviceName: true,
        userAgent: true,
        status: true
      },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.accessSession.count({ where })
  ]);

  const enrichedSessions = sessions.map((session: any) => ({
    ...session,
    dataUsedMB: Math.round((session.dataUsedMB || 0)),
    timeUsedMinutes: Math.round((session.timeUsedMinutes || 0)),
    durationMinutes: session.endedAt ? 
      Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000 / 60) :
      Math.round((Date.now() - session.startedAt.getTime()) / 1000 / 60),
    isActive: session.status === 'ACTIVE'
  }));

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: {
      user: { id: user.id, username: user.username },
      sessions: enrichedSessions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * @route GET /api/users/me/quotas
 * @desc Obtenir les quotas de l'utilisateur connecté
 * @access Private
 */
router.get('/me/quotas', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  logger.info('Récupération des quotas utilisateur', { userId });

  // Récupérer les quotas depuis la base de données
  const userQuotas = await prisma.userQuota.findFirst({
    where: { userId }
  });

  // Si pas de quotas définis, retourner des valeurs par défaut
  const defaultQuotas = {
    dataLimit: 10, // 10 GB par défaut
    timeLimit: 480, // 8 heures par défaut
    dataUsed: 0,
    timeUsed: 0,
    sessionsLimit: 5,
    sessionsUsed: 0
  };

  res.json({
    success: true,
    data: userQuotas || defaultQuotas
  });
}));

/**
 * @route GET /api/users/me/statistics
 * @desc Obtenir les statistiques de l'utilisateur connecté
 * @access Private
 */
router.get('/me/statistics', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  logger.info('Récupération des statistiques utilisateur', { userId });

  // Récupérer les sessions récentes
  const recentSessions = await prisma.accessSession.findMany({
    where: { 
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
      }
    }
  });

  // Calculer les statistiques
  const statistics = {
    sessionsToday: recentSessions.length,
    lastConnection: recentSessions[0]?.createdAt || null,
    connectionStatus: 'disconnected', // Par défaut
    totalDataUsed: recentSessions.reduce((total: number, session: any) => total + (session.dataUsed || 0), 0),
    totalTimeUsed: recentSessions.reduce((total: number, session: any) => total + (session.duration || 0), 0),
    averageSessionDuration: recentSessions.length > 0 ? 
      recentSessions.reduce((total: number, session: any) => total + (session.duration || 0), 0) / recentSessions.length : 0
  };

  res.json({
    success: true,
    data: statistics
  });
}));

/**
 * @route GET /api/users/me/sessions
 * @desc Obtenir les sessions de l'utilisateur connecté
 * @access Private
 */
router.get('/me/sessions', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  
  logger.info('Récupération des sessions utilisateur', { userId, page, limit });

  const [sessions, totalCount] = await Promise.all([
    prisma.accessSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        timeUsedMinutes: true,
        dataUsedMB: true,
        ipAddress: true,
        userAgent: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.accessSession.count({
      where: { userId }
    })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: sessions,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}));

/**
 * @route PUT /api/users/me
 * @desc Mettre à jour le profil de l'utilisateur connecté
 * @access Private
 */
router.put('/me', authenticate, [
  body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('Prénom entre 1 et 50 caractères'),
  body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Nom entre 1 et 50 caractères'),
  body('email').optional().isEmail().withMessage('Email invalide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const userId = req.user!.id;
  const { firstName, lastName, email } = req.body;
  
  logger.info('Mise à jour du profil utilisateur', { userId, updates: Object.keys(req.body) });

  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      throw new ConflictError('Cet email est déjà utilisé');
    }
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      updatedAt: new Date()
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true
    }
  });

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profil mis à jour avec succès'
  });
}));

/**
 * @route PUT /api/users/me/password
 * @desc Changer le mot de passe de l'utilisateur connecté
 * @access Private
 */
router.put('/me/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe minimum 6 caractères')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;
  
  logger.info('Changement de mot de passe utilisateur', { userId });

  // Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier l'ancien mot de passe
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword || '');
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Mot de passe actuel incorrect');
  }

  // Hasher le nouveau mot de passe
  const saltRounds = appConfig.security.saltRounds;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { id: userId },
    data: {
      hashedPassword: hashedNewPassword,
      updatedAt: new Date()
    }
  });

  logger.info('Mot de passe changé avec succès', { userId });

  res.json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
}));

/**
 * @route GET /api/users/me
 * @desc Obtenir le profil de l'utilisateur connecté
 * @access Private
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  logger.info('Récupération du profil utilisateur', { userId });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      isEmailVerified: true,
      // preferences: true  // Ce champ n'existe pas dans le schéma
    }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  res.json({
    success: true,
    data: user
  });
}));

export default router;
