import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
import { appConfig } from './config.js';

/**
 * Configuration Swagger/OpenAPI pour GAIS
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GAIS - API Documentation',
      version: '1.0.0',
      description: `
        Documentation complète de l'API GAIS (Gestionnaire d'Accès Internet Sécurisé).
        
        Cette API permet de gérer l'accès internet des utilisateurs avec un système de quotas,
        d'authentification, et de gestion des sessions. Elle inclut également un système
        d'accès temporaire pour invités et des fonctionnalités d'administration avancées.
        
        ## Fonctionnalités principales
        - 🔐 Authentification JWT
        - 👥 Gestion des utilisateurs et rôles
        - 📊 Système de quotas (données/temps)
        - 🕒 Sessions d'accès avec suivi en temps réel
        - 👤 Accès temporaire pour invités
        - 📈 Statistiques et monitoring
        - 💾 Sauvegarde automatique
        - 📧 Notifications email
        - 🔧 Interface d'administration
        
        ## Authentification
        L'API utilise l'authentification JWT. Incluez le token dans l'en-tête Authorization :
        \`Authorization: Bearer <votre_token>\`
        
        ## Codes de statut
        - 200: Succès
        - 201: Créé avec succès
        - 400: Requête invalide
        - 401: Non authentifié
        - 403: Accès refusé
        - 404: Ressource non trouvée
        - 429: Trop de requêtes
        - 500: Erreur serveur
      `,
      contact: {
        name: 'Équipe GAIS',
        email: 'admin@gais.local'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${appConfig.PORT}`,
        description: 'Serveur de développement'
      },
      {
        url: 'http://localhost:3001',
        description: 'Serveur local par défaut'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT pour l\'authentification'
        }
      },
      schemas: {
        // Schémas de données principaux
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Identifiant unique de l\'utilisateur' },
            username: { type: 'string', description: 'Nom d\'utilisateur unique' },
            email: { type: 'string', format: 'email', description: 'Adresse email' },
            firstName: { type: 'string', description: 'Prénom' },
            lastName: { type: 'string', description: 'Nom de famille' },
            role: { 
              type: 'string', 
              enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
              description: 'Rôle de l\'utilisateur'
            },
            isActive: { type: 'boolean', description: 'Compte actif ou non' },
            createdAt: { type: 'string', format: 'date-time', description: 'Date de création' },
            lastLoginAt: { type: 'string', format: 'date-time', description: 'Dernière connexion' }
          }
        },
        AccessSession: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Identifiant unique de la session' },
            userId: { type: 'string', description: 'ID de l\'utilisateur' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'EXPIRED', 'TERMINATED', 'QUOTA_EXCEEDED'],
              description: 'Statut de la session'
            },
            startedAt: { type: 'string', format: 'date-time', description: 'Début de session' },
            endedAt: { type: 'string', format: 'date-time', description: 'Fin de session' },
            ipAddress: { type: 'string', description: 'Adresse IP' },
            dataUsedMB: { type: 'number', description: 'Données consommées en MB' },
            timeUsedMinutes: { type: 'number', description: 'Temps utilisé en minutes' }
          }
        },
        GuestAccessCode: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Identifiant unique du code' },
            code: { type: 'string', description: 'Code d\'accès (8 caractères)' },
            level: {
              type: 'string',
              enum: ['PREMIUM', 'STANDARD', 'BASIC', 'CUSTOM'],
              description: 'Niveau d\'accès'
            },
            description: { type: 'string', description: 'Description du code' },
            isActive: { type: 'boolean', description: 'Code actif ou non' },
            expiresAt: { type: 'string', format: 'date-time', description: 'Date d\'expiration' },
            maxUses: { type: 'integer', description: 'Nombre max d\'utilisations' },
            currentUses: { type: 'integer', description: 'Utilisations actuelles' },
            customQuotas: {
              type: 'object',
              description: 'Quotas personnalisés pour niveau CUSTOM',
              properties: {
                dataQuotaMB: { type: 'integer', description: 'Quota de données en MB' },
                timeQuotaMinutes: { type: 'integer', description: 'Quota de temps en minutes' }
              }
            }
          }
        },
        GuestSession: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Identifiant unique de la session' },
            accessCodeId: { type: 'string', description: 'ID du code d\'accès utilisé' },
            ipAddress: { type: 'string', description: 'Adresse IP' },
            userAgent: { type: 'string', description: 'User Agent du navigateur' },
            location: { type: 'string', description: 'Localisation géographique' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'EXPIRED', 'TERMINATED', 'QUOTA_EXCEEDED'],
              description: 'Statut de la session'
            },
            startedAt: { type: 'string', format: 'date-time', description: 'Début de session' },
            expiresAt: { type: 'string', format: 'date-time', description: 'Expiration de session' },
            dataConsumedMB: { type: 'number', description: 'Données consommées en MB' },
            timeConsumedMinutes: { type: 'number', description: 'Temps consommé en minutes' }
          }
        },
        Backup: {
          type: 'object',
          properties: {
            fileName: { type: 'string', description: 'Nom du fichier de sauvegarde' },
            size: { type: 'integer', description: 'Taille en octets' },
            sizeFormatted: { type: 'string', description: 'Taille formatée (ex: 2.5 MB)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Date de création' },
            compressed: { type: 'boolean', description: 'Fichier compressé ou non' },
            metadata: {
              type: 'object',
              description: 'Métadonnées de la sauvegarde',
              properties: {
                description: { type: 'string', description: 'Description de la sauvegarde' },
                tableCount: { type: 'integer', description: 'Nombre de tables sauvegardées' },
                databaseVersion: { type: 'string', description: 'Version de la base de données' }
              }
            }
          }
        },
        // Schémas de réponse standardisés
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indication de succès' },
            message: { type: 'string', description: 'Message descriptif' },
            data: { type: 'object', description: 'Données de la réponse' },
            timestamp: { type: 'string', format: 'date-time', description: 'Horodatage' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', description: 'Message d\'erreur' },
            error: { type: 'string', description: 'Détails de l\'erreur' },
            code: { type: 'string', description: 'Code d\'erreur' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: {} },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: { type: 'integer', description: 'Page actuelle' },
                    totalPages: { type: 'integer', description: 'Total des pages' },
                    totalCount: { type: 'integer', description: 'Total des éléments' },
                    limit: { type: 'integer', description: 'Limite par page' },
                    hasNext: { type: 'boolean', description: 'A une page suivante' },
                    hasPrev: { type: 'boolean', description: 'A une page précédente' }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token d\'authentification manquant ou invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Token d\'authentification requis',
                error: 'UNAUTHORIZED',
                code: 'AUTH_TOKEN_MISSING'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Accès refusé - permissions insuffisantes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Accès refusé',
                error: 'FORBIDDEN',
                code: 'INSUFFICIENT_PERMISSIONS'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Données invalides',
                error: 'VALIDATION_ERROR',
                code: 'INVALID_INPUT'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Ressource non trouvée',
                error: 'NOT_FOUND',
                code: 'RESOURCE_NOT_FOUND'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentification et gestion des tokens'
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs'
      },
      {
        name: 'Sessions',
        description: 'Gestion des sessions d\'accès'
      },
      {
        name: 'Quotas',
        description: 'Gestion des quotas et consommation'
      },
      {
        name: 'Guest Access',
        description: 'Système d\'accès temporaire pour invités'
      },
      {
        name: 'Admin',
        description: 'Administration du système'
      },
      {
        name: 'Statistics',
        description: 'Statistiques et rapports'
      },
      {
        name: 'Backups',
        description: 'Gestion des sauvegardes'
      },
      {
        name: 'Health',
        description: 'Monitoring et santé du système'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/middleware/*.ts'
  ]
};

/**
 * Configuration de l'interface Swagger UI
 */
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .description { color: #64748b; }
    .swagger-ui .btn.authorize { background-color: #3b82f6; border-color: #3b82f6; }
    .swagger-ui .btn.authorize:hover { background-color: #2563eb; }
  `,
  customSiteTitle: 'GAIS API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
};

/**
 * Initialise la documentation Swagger dans l'application Express
 */
export function setupSwagger(app: express.Application): void {
  try {
    // Génération de la spécification OpenAPI
    const specs = swaggerJsdoc(swaggerOptions);
    
    // Log pour debug
    console.log('📚 Swagger specs generated:', !!specs);
    
    // Configuration de l'interface Swagger UI
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
    
    // Endpoint pour récupérer la spécification JSON
    app.get('/api/docs.json', (_req: express.Request, res: express.Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });

    console.log(`📚 Documentation API disponible sur: http://localhost:${appConfig.PORT}/api/docs`);
    console.log(`📄 Spécification OpenAPI: http://localhost:${appConfig.PORT}/api/docs.json`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Swagger:', error);
  }
}

/**
 * Génère une collection Postman à partir de la spécification OpenAPI
 */
export function generatePostmanCollection(): object {
  return {
    info: {
      name: 'GAIS API Collection',
      description: 'Collection Postman pour l\'API GAIS',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{access_token}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'base_url',
        value: `http://localhost:${appConfig.PORT}`,
        type: 'string'
      },
      {
        key: 'access_token',
        value: '',
        type: 'string'
      }
    ],
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Login',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  username: 'admin',
                  password: 'admin123'
                })
              },
              url: {
                raw: '{{base_url}}/api/auth/login',
                host: ['{{base_url}}'],
                path: ['api', 'auth', 'login']
              }
            }
          }
        ]
      },
      {
        name: 'Admin',
        item: [
          {
            name: 'Dashboard',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{access_token}}'
                }
              ],
              url: {
                raw: '{{base_url}}/api/admin/dashboard',
                host: ['{{base_url}}'],
                path: ['api', 'admin', 'dashboard']
              }
            }
          }
        ]
      }
    ]
  };
}
