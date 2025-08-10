import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/network/devices
 * Scanner et lister les appareils réseau
 */
router.get('/devices', async (req, res) => {
  try {
    const networkService = req.services?.networkService;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const devices = await networkService.scanDevices();

    return res.json({
      success: true,
      data: {
        devices,
        scannedAt: new Date().toISOString(),
        total: devices.length
      }
    });

  } catch (error) {
    logger.error('Erreur lors du scan des appareils:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de scanner les appareils réseau'
    });
  }
});

/**
 * POST /api/network/rules
 * Créer une règle réseau (autoriser/bloquer)
 */
router.post('/rules', async (req, res) => {
  try {
    const networkService = req.services?.networkService;
    const webSocketService = req.services?.webSocketService;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const { macAddress, ipAddress, action, sessionId } = req.body;

    // Validation
    if (!macAddress || !ipAddress || !action) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'MAC address, IP address et action sont requis'
      });
    }

    if (!['ALLOW', 'DENY', 'THROTTLE'].includes(action)) {
      return res.status(400).json({
        error: 'Action invalide',
        message: 'L\'action doit être ALLOW, DENY ou THROTTLE'
      });
    }

    // Créer la règle
    const rule = await networkService.createRule({
      macAddress,
      ipAddress,
      action,
      priority: 100,
      sessionId
    });

    // Notification WebSocket si applicable
    if (webSocketService && sessionId) {
      const session = await req.services?.prisma.accessSession.findUnique({
        where: { id: sessionId },
        include: { user: true }
      });

      if (session?.user?.id) {
        webSocketService.notifyUser(session.user.id, {
          type: action === 'ALLOW' ? 'admin_broadcast' : 'session_terminated',
          title: action === 'ALLOW' ? 'Accès autorisé' : 'Accès restreint',
          message: action === 'ALLOW' 
            ? 'Votre connexion a été autorisée' 
            : 'Votre connexion a été restreinte',
          severity: action === 'ALLOW' ? 'success' : 'warning',
          data: { rule, sessionId }
        });
      }
    }

    logger.info('Règle réseau créée:', {
      rule,
      createdBy: req.user?.id,
      sessionId
    });

    return res.json({
      success: true,
      message: 'Règle réseau créée avec succès',
      data: rule
    });

  } catch (error) {
    logger.error('Erreur lors de la création de la règle réseau:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de créer la règle réseau'
    });
  }
});

/**
 * GET /api/network/stats
 * Obtenir les statistiques réseau
 */
router.get('/stats', async (req, res) => {
  try {
    const networkService = req.services?.networkService;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const stats = await networkService.getNetworkStatus();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des stats réseau:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques réseau'
    });
  }
});

/**
 * POST /api/network/test-connectivity
 * Tester la connectivité réseau
 */
router.post('/test-connectivity', async (req, res) => {
  try {
    const networkService = req.services?.networkService;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const { target = 'google.com' } = req.body;

    const result = await networkService.testConnectivity(target);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors du test de connectivité:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de tester la connectivité'
    });
  }
});

/**
 * GET /api/network/bandwidth
 * Obtenir les statistiques de bande passante
 */
router.get('/bandwidth', async (req, res) => {
  try {
    const networkService = req.services?.networkService;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const bandwidth = await networkService.getBandwidthStats();

    return res.json({
      success: true,
      data: bandwidth
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de la bande passante:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les statistiques de bande passante'
    });
  }
});

/**
 * DELETE /api/network/rules/:macAddress
 * Supprimer une règle réseau
 */
router.delete('/rules/:macAddress', async (req, res) => {
  try {
    const networkService = req.services?.networkService;
    const { macAddress } = req.params;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const result = await networkService.removeRule(macAddress);

    logger.info('Règle réseau supprimée:', {
      macAddress,
      result,
      removedBy: req.user?.id
    });

    return res.json({
      success: true,
      message: 'Règle réseau supprimée avec succès',
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression de la règle réseau:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de supprimer la règle réseau'
    });
  }
});

/**
 * GET /api/network/status
 * Obtenir le statut général du réseau
 */
router.get('/status', async (req, res) => {
  try {
    const networkService = req.services?.networkService;

    if (!networkService) {
      return res.status(500).json({ error: 'Service réseau non disponible' });
    }

    const status = await networkService.getNetworkStatus();

    return res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du statut réseau:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer le statut réseau'
    });
  }
});

/**
 * GET /api/network/rules
 * Récupérer les règles réseau
 */
router.get('/rules', authenticate, async (_req, res) => {
  try {
    // Simuler des règles réseau par défaut
    const rules = [
      {
        id: '1',
        type: 'allow',
        source: '192.168.1.0/24',
        destination: 'any',
        port: 'any',
        protocol: 'tcp',
        description: 'Autoriser le réseau local',
        enabled: true,
        createdAt: new Date()
      },
      {
        id: '2',
        type: 'block',
        source: 'any',
        destination: '0.0.0.0/0',
        port: '22',
        protocol: 'tcp',
        description: 'Bloquer SSH externe',
        enabled: true,
        createdAt: new Date()
      }
    ];

    return res.json({
      success: true,
      data: rules
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des règles réseau:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les règles réseau'
    });
  }
});

/**
 * GET /api/network/status
 * Récupérer le statut réseau
 */
router.get('/status', authenticate, async (_req, res) => {
  try {
    // Simuler un statut réseau
    const status = {
      connectivity: {
        internet: true,
        starlink: true,
        localNetwork: true
      },
      interfaces: [
        {
          name: 'eth0',
          status: 'up',
          ip: '192.168.1.100',
          mac: '00:11:22:33:44:55',
          speed: '1000Mbps',
          duplex: 'full'
        }
      ],
      traffic: {
        bytesIn: 1234567890,
        bytesOut: 987654321,
        packetsIn: 12345,
        packetsOut: 9876
      },
      uptime: Math.floor(Date.now() / 1000) - 86400, // 24h d'uptime
      lastUpdate: new Date()
    };

    return res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du statut réseau:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer le statut réseau'
    });
  }
});

export default router;
