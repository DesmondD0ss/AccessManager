/**
 * Routes pour la gestion des rôles et permissions
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error-handler.js';
import { PermissionService } from '../services/permissionService.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @route GET /api/permissions
 * @desc Récupérer toutes les permissions disponibles organisées par catégorie
 * @access Private (Admin)
 */
router.get('/', authenticate, requireAnyPermission(['admin.read', 'system.read']), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const permissions = PermissionService.getAvailablePermissions();

  res.json({
    success: true,
    data: {
      permissions,
      categories: Object.keys(permissions),
      totalPermissions: Object.values(permissions).flat().length
    }
  });

  logger.info('Permissions list accessed', {
    adminUserId: (req as any).user?.id,
    categoriesCount: Object.keys(permissions).length
  });
}));

/**
 * @route GET /api/permissions/roles
 * @desc Récupérer tous les rôles personnalisés
 * @access Private (Admin)
 */
router.get('/roles', authenticate, requireAnyPermission(['admin.read', 'user.read']), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customRoles = await PermissionService.getCustomRoles();

  res.json({
    success: true,
    data: {
      roles: customRoles,
      totalRoles: customRoles.length
    }
  });

  logger.info('Custom roles list accessed', {
    adminUserId: (req as any).user?.id,
    rolesCount: customRoles.length
  });
}));

/**
 * @route POST /api/permissions/roles
 * @desc Créer un nouveau rôle personnalisé
 * @access Private (Super Admin)
 */
router.post('/roles', authenticate, requirePermission('admin.manage'), [
  body('name')
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le nom du rôle doit contenir entre 3 et 50 caractères'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('La description ne peut pas dépasser 255 caractères'),
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Au moins une permission doit être spécifiée'),
  body('permissions.*')
    .isString()
    .withMessage('Chaque permission doit être une chaîne valide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { name, description, permissions } = req.body;
  const createdBy = (req as any).user.id;

  const role = await PermissionService.createCustomRole({
    name,
    description,
    permissions,
    createdBy
  });

  res.status(201).json({
    success: true,
    message: 'Rôle personnalisé créé avec succès',
    data: { role }
  });

  logger.info('Custom role created', {
    roleId: role.id,
    name,
    permissions: permissions.length,
    createdBy
  });
}));

/**
 * @route PUT /api/permissions/roles/:id
 * @desc Mettre à jour les permissions d'un rôle personnalisé
 * @access Private (Super Admin)
 */
router.put('/roles/:id', authenticate, requirePermission('admin.manage'), [
  param('id').isString().notEmpty().withMessage('ID du rôle requis'),
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Au moins une permission doit être spécifiée'),
  body('permissions.*')
    .isString()
    .withMessage('Chaque permission doit être une chaîne valide')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { id } = req.params;
  const { permissions } = req.body;
  const updatedBy = (req as any).user.id;

  await PermissionService.updateRolePermissions(id, permissions, updatedBy);

  res.json({
    success: true,
    message: 'Permissions du rôle mises à jour avec succès'
  });

  logger.info('Role permissions updated', {
    roleId: id,
    permissions: permissions.length,
    updatedBy
  });
}));

/**
 * @route POST /api/permissions/users/:userId/roles/:roleId
 * @desc Assigner un rôle personnalisé à un utilisateur
 * @access Private (Admin)
 */
router.post('/users/:userId/roles/:roleId', authenticate, requirePermission('user.update'), [
  param('userId').isString().notEmpty().withMessage('ID utilisateur requis'),
  param('roleId').isString().notEmpty().withMessage('ID du rôle requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const { userId, roleId } = req.params;
  const assignedBy = (req as any).user.id;

  await PermissionService.assignRoleToUser(userId, roleId, assignedBy);

  res.json({
    success: true,
    message: 'Rôle assigné à l\'utilisateur avec succès'
  });

  logger.info('Role assigned to user', {
    userId,
    roleId,
    assignedBy
  });
}));

/**
 * @route DELETE /api/permissions/users/:userId/roles/:roleId
 * @desc Retirer un rôle personnalisé d'un utilisateur
 * @access Private (Admin)
 */
router.delete('/users/:userId/roles/:roleId', authenticate, requirePermission('user.update'), [
  param('userId').isString().notEmpty().withMessage('ID utilisateur requis'),
  param('roleId').isString().notEmpty().withMessage('ID du rôle requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const { userId, roleId } = req.params;

  await PermissionService.removeRoleFromUser(userId, roleId);

  res.json({
    success: true,
    message: 'Rôle retiré de l\'utilisateur avec succès'
  });

  logger.info('Role removed from user', {
    userId,
    roleId,
    removedBy: (req as any).user.id
  });
}));

/**
 * @route GET /api/permissions/users/:userId
 * @desc Récupérer toutes les permissions d'un utilisateur
 * @access Private (Admin ou utilisateur lui-même)
 */
router.get('/users/:userId', authenticate, [
  param('userId').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const { userId } = req.params;
  const currentUser = (req as any).user;

  // Vérifier que l'utilisateur peut voir ces permissions
  const canViewPermissions = await PermissionService.hasAnyPermission(currentUser.id, ['user.read', 'admin.read']);
  if (!canViewPermissions && currentUser.id !== userId) {
    throw new ValidationError('Vous ne pouvez voir que vos propres permissions');
  }

  const userPermissions = await PermissionService.getUserPermissions(userId);

  res.json({
    success: true,
    data: {
      userId,
      permissions: userPermissions,
      totalPermissions: userPermissions.length
    }
  });

  logger.info('User permissions accessed', {
    targetUserId: userId,
    accessedBy: currentUser.id,
    permissionsCount: userPermissions.length
  });
}));

/**
 * @route POST /api/permissions/check
 * @desc Vérifier si l'utilisateur actuel a des permissions spécifiques
 * @access Private (Authenticated)
 */
router.post('/check', authenticate, [
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Au moins une permission doit être spécifiée'),
  body('permissions.*')
    .isString()
    .withMessage('Chaque permission doit être une chaîne valide'),
  body('mode')
    .optional()
    .isIn(['any', 'all'])
    .withMessage('Mode doit être "any" ou "all"')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides');
  }

  const { permissions, mode = 'any' } = req.body;
  const userId = (req as any).user.id;

  let hasPermissions: boolean;
  if (mode === 'all') {
    hasPermissions = await PermissionService.hasAllPermissions(userId, permissions);
  } else {
    hasPermissions = await PermissionService.hasAnyPermission(userId, permissions);
  }

  res.json({
    success: true,
    data: {
      hasPermissions,
      mode,
      checkedPermissions: permissions
    }
  });
}));

export default router;
