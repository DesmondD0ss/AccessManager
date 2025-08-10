/**
 * Routes pour la gestion des rôles et permissions
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { asyncHandler, ValidationError, NotFoundError, ConflictError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Liste tous les rôles
 *     description: Récupère la liste de tous les rôles avec leurs permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includePermissions
 *         schema:
 *           type: boolean
 *         description: Inclure les permissions dans la réponse
 *     responses:
 *       200:
 *         description: Liste des rôles récupérée avec succès
 */
router.get('/', authenticate, requirePermission('roles:read'), [
  query('includePermissions').optional().isBoolean().withMessage('includePermissions doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres de requête invalides');
  }

  const includePermissions = req.query.includePermissions === 'true';

  const roles = await prisma.customRole.findMany({
    include: {
      rolePermissions: includePermissions ? {
        include: {
          permission: true
        }
      } : false,
      userRoles: {
        select: {
          userId: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const rolesWithStats = roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    userCount: role.userRoles.length,
    permissions: includePermissions 
      ? role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          displayName: rp.permission.displayName,
          description: rp.permission.description,
          resource: rp.permission.resource,
          action: rp.permission.action,
          category: rp.permission.category
        }))
      : undefined
  }));

  res.json({
    success: true,
    data: rolesWithStats
  });
}));

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Détails d'un rôle
 *     description: Récupère les détails complets d'un rôle avec ses permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Détails du rôle récupérés avec succès
 *       404:
 *         description: Rôle non trouvé
 */
router.get('/:id', authenticate, requirePermission('roles:read'), [
  param('id').isString().notEmpty().withMessage('ID du rôle requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const role = await prisma.customRole.findUnique({
    where: { id: req.params.id },
    include: {
      rolePermissions: {
        include: {
          permission: true
        }
      },
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      createdByUser: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      updatedByUser: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });

  if (!role) {
    throw new NotFoundError('Rôle non trouvé');
  }

  const roleDetails = {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    createdBy: role.createdByUser,
    updatedBy: role.updatedByUser,
    permissions: role.rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      displayName: rp.permission.displayName,
      description: rp.permission.description,
      resource: rp.permission.resource,
      action: rp.permission.action,
      category: rp.permission.category
    })),
    users: role.userRoles.map(ur => ({
      id: ur.user.id,
      username: ur.user.username,
      email: ur.user.email,
      firstName: ur.user.firstName,
      lastName: ur.user.lastName,
      assignedAt: ur.assignedAt
    }))
  };

  res.json({
    success: true,
    data: roleDetails
  });
}));

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Créer un nouveau rôle
 *     description: Crée un nouveau rôle personnalisé avec des permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom unique du rôle
 *               description:
 *                 type: string
 *                 description: Description du rôle
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des IDs de permissions
 *     responses:
 *       201:
 *         description: Rôle créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Un rôle avec ce nom existe déjà
 */
router.post('/', authenticate, requirePermission('roles:create'), [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nom du rôle requis (2-50 caractères)')
    .matches(/^[a-z_]+$/)
    .withMessage('Le nom ne peut contenir que des lettres minuscules et des underscores'),
  body('description')
    .isString()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Description requise (5-255 caractères)'),
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Au moins une permission requise')
    .custom((permissions: string[]) => {
      return permissions.every(p => typeof p === 'string' && p.length > 0);
    })
    .withMessage('Toutes les permissions doivent être des chaînes non vides')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const user = (req as any).user;
  const { name, description, permissions } = req.body;

  // Vérifier que le rôle n'existe pas déjà
  const existingRole = await prisma.customRole.findUnique({
    where: { name }
  });

  if (existingRole) {
    throw new ConflictError('Un rôle avec ce nom existe déjà');
  }

  // Vérifier que toutes les permissions existent
  const existingPermissions = await prisma.permission.findMany({
    where: {
      id: { in: permissions }
    }
  });

  if (existingPermissions.length !== permissions.length) {
    throw new ValidationError('Une ou plusieurs permissions n\'existent pas');
  }

  // Créer le rôle et assigner les permissions dans une transaction
  const newRole = await prisma.$transaction(async (tx) => {
    const role = await tx.customRole.create({
      data: {
        name,
        description,
        createdBy: user.id
      }
    });

    // Assigner les permissions
    await tx.rolePermission.createMany({
      data: permissions.map((permissionId: string) => ({
        roleId: role.id,
        permissionId
      }))
    });

    return role;
  });

  logger.info('Nouveau rôle créé', {
    roleId: newRole.id,
    roleName: newRole.name,
    createdBy: user.username,
    permissionsCount: permissions.length
  });

  res.status(201).json({
    success: true,
    message: 'Rôle créé avec succès',
    data: {
      id: newRole.id,
      name: newRole.name,
      description: newRole.description
    }
  });
}));

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Modifier un rôle
 *     description: Modifie un rôle existant et ses permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Nouvelle description du rôle
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Nouvelle liste des IDs de permissions
 *               isActive:
 *                 type: boolean
 *                 description: Statut actif/inactif du rôle
 *     responses:
 *       200:
 *         description: Rôle modifié avec succès
 *       404:
 *         description: Rôle non trouvé
 */
router.put('/:id', authenticate, requirePermission('roles:update'), [
  param('id').isString().notEmpty().withMessage('ID du rôle requis'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Description (5-255 caractères)'),
  body('permissions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Au moins une permission requise si spécifiée'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive doit être un booléen')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const user = (req as any).user;
  const { description, permissions, isActive } = req.body;

  const role = await prisma.customRole.findUnique({
    where: { id: req.params.id }
  });

  if (!role) {
    throw new NotFoundError('Rôle non trouvé');
  }

  // Construire les données de mise à jour
  const updateData: any = {
    updatedBy: user.id
  };

  if (description !== undefined) updateData.description = description;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Mettre à jour dans une transaction
  const updatedRole = await prisma.$transaction(async (tx) => {
    const updated = await tx.customRole.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Si des permissions sont spécifiées, les mettre à jour
    if (permissions) {
      // Vérifier que toutes les permissions existent
      const existingPermissions = await tx.permission.findMany({
        where: { id: { in: permissions } }
      });

      if (existingPermissions.length !== permissions.length) {
        throw new ValidationError('Une ou plusieurs permissions n\'existent pas');
      }

      // Supprimer les anciennes permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: req.params.id }
      });

      // Ajouter les nouvelles permissions
      await tx.rolePermission.createMany({
        data: permissions.map((permissionId: string) => ({
          roleId: req.params.id,
          permissionId
        }))
      });
    }

    return updated;
  });

  logger.info('Rôle modifié', {
    roleId: updatedRole.id,
    roleName: updatedRole.name,
    updatedBy: user.username,
    changes: { description, permissions, isActive }
  });

  res.json({
    success: true,
    message: 'Rôle modifié avec succès',
    data: {
      id: updatedRole.id,
      name: updatedRole.name,
      description: updatedRole.description,
      isActive: updatedRole.isActive
    }
  });
}));

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Supprimer un rôle
 *     description: Supprime un rôle personnalisé (impossible pour les rôles système)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Rôle supprimé avec succès
 *       400:
 *         description: Impossible de supprimer un rôle système ou assigné
 *       404:
 *         description: Rôle non trouvé
 */
router.delete('/:id', authenticate, requirePermission('roles:delete'), [
  param('id').isString().notEmpty().withMessage('ID du rôle requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const user = (req as any).user;

  const role = await prisma.customRole.findUnique({
    where: { id: req.params.id },
    include: {
      userRoles: true
    }
  });

  if (!role) {
    throw new NotFoundError('Rôle non trouvé');
  }

  // Vérifier si le rôle est assigné à des utilisateurs
  if (role.userRoles.length > 0) {
    throw new ValidationError(`Impossible de supprimer un rôle assigné à ${role.userRoles.length} utilisateur(s)`);
  }

  // Supprimer le rôle et ses permissions dans une transaction
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: { roleId: req.params.id }
    });

    await tx.customRole.delete({
      where: { id: req.params.id }
    });
  });

  logger.info('Rôle supprimé', {
    roleId: role.id,
    roleName: role.name,
    deletedBy: user.username
  });

  res.json({
    success: true,
    message: 'Rôle supprimé avec succès'
  });
}));

/**
 * @swagger
 * /api/roles/{id}/users:
 *   post:
 *     summary: Assigner un rôle à un utilisateur
 *     description: Assigne un rôle à un utilisateur
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur
 *     responses:
 *       201:
 *         description: Rôle assigné avec succès
 *       400:
 *         description: L'utilisateur a déjà ce rôle
 *       404:
 *         description: Rôle ou utilisateur non trouvé
 */
router.post('/:id/users', authenticate, requirePermission('roles:update'), [
  param('id').isString().notEmpty().withMessage('ID du rôle requis'),
  body('userId').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const assignedByUser = (req as any).user;
  const { userId } = req.body;

  // Vérifier que le rôle existe
  const role = await prisma.customRole.findUnique({
    where: { id: req.params.id }
  });

  if (!role) {
    throw new NotFoundError('Rôle non trouvé');
  }

  // Vérifier que l'utilisateur existe
  const targetUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!targetUser) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier que l'utilisateur n'a pas déjà ce rôle
  const existingUserRole = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId: req.params.id
    }
  });

  if (existingUserRole) {
    throw new ConflictError('L\'utilisateur a déjà ce rôle');
  }

  // Assigner le rôle
  await prisma.userRole.create({
    data: {
      userId,
      roleId: req.params.id,
      assignedBy: assignedByUser.id
    }
  });

  logger.info('Rôle assigné à un utilisateur', {
    roleId: role.id,
    roleName: role.name,
    userId: targetUser.id,
    username: targetUser.username,
    assignedBy: assignedByUser.username
  });

  res.status(201).json({
    success: true,
    message: 'Rôle assigné avec succès'
  });
}));

/**
 * @swagger
 * /api/roles/{id}/users/{userId}:
 *   delete:
 *     summary: Retirer un rôle d'un utilisateur
 *     description: Retire un rôle d'un utilisateur
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Rôle retiré avec succès
 *       404:
 *         description: Assignation de rôle non trouvée
 */
router.delete('/:id/users/:userId', authenticate, requirePermission('roles:update'), [
  param('id').isString().notEmpty().withMessage('ID du rôle requis'),
  param('userId').isString().notEmpty().withMessage('ID utilisateur requis')
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Paramètres invalides');
  }

  const unassignedByUser = (req as any).user;

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: req.params.userId,
      roleId: req.params.id
    },
    include: {
      user: {
        select: { username: true }
      },
      role: {
        select: { name: true }
      }
    }
  });

  if (!userRole) {
    throw new NotFoundError('Assignation de rôle non trouvée');
  }

  await prisma.userRole.delete({
    where: { id: userRole.id }
  });

  logger.info('Rôle retiré d\'un utilisateur', {
    roleId: req.params.id,
    roleName: userRole.role.name,
    userId: req.params.userId,
    username: userRole.user.username,
    unassignedBy: unassignedByUser.username
  });

  res.json({
    success: true,
    message: 'Rôle retiré avec succès'
  });
}));

export default router;
