import nodemailer from 'nodemailer';
import { appConfig } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Service d'envoi d'emails pour GAIS
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialise le transporteur d'emails
   */
  private initializeTransporter(): void {
    if (!appConfig.email.enabled) {
      logger.warn('Service email désactivé - Configuration SMTP manquante');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: appConfig.email.host,
        port: appConfig.email.port,
        secure: appConfig.email.port === 465, // true pour 465, false pour autres ports
        auth: {
          user: appConfig.email.user,
          pass: appConfig.email.password,
        },
        tls: {
          rejectUnauthorized: !appConfig.isDevelopment, // Moins strict en dev
        },
      });

      logger.info('Service email initialisé', {
        host: appConfig.email.host,
        port: appConfig.email.port,
        user: appConfig.email.user,
      });
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du service email', { error });
    }
  }

  /**
   * Vérifie si le service email est disponible
   */
  public isEnabled(): boolean {
    return this.transporter !== null;
  }

  /**
   * Teste la connexion au serveur SMTP
   */
  public async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Connexion SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      logger.error('Erreur de connexion SMTP', { error });
      return false;
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  public async sendPasswordResetEmail(
    email: string, 
    resetToken: string, 
    userName?: string
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Service email non disponible');
      return false;
    }

    try {
      const resetUrl = `${appConfig.cors.origin}/auth/reset-password?token=${resetToken}`;
      const displayName = userName || email;

      const mailOptions = {
        from: {
          name: 'GAIS - Gestionnaire d\'Accès Internet',
          address: appConfig.email.from!,
        },
        to: email,
        subject: '[GAIS] Réinitialisation de votre mot de passe',
        html: this.generatePasswordResetHtml(displayName, resetUrl),
        text: this.generatePasswordResetText(displayName, resetUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email de réinitialisation envoyé', {
        to: email,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de réinitialisation', {
        error,
        email,
      });
      return false;
    }
  }

  /**
   * Génère le contenu HTML de l'email de réinitialisation
   */
  private generatePasswordResetHtml(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - GAIS</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .content h2 {
            color: #1e293b;
            margin-top: 0;
            font-size: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            opacity: 0.9;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 GAIS</div>
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          
          <div class="content">
            <h2>Bonjour ${userName},</h2>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte GAIS.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong><br>                • Ce lien est valide pendant <strong>15 minutes</strong> seulement<br>
              • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email<br>
              • Ne partagez jamais ce lien avec personne
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p>Si vous avez des questions, contactez l'administrateur système.</p>
            
            <p>Cordialement,<br>L'équipe GAIS</p>
          </div>
          
          <div class="footer">
            <p>© 2025 GAIS - Gestionnaire d'Accès Internet Sécurisé</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère le contenu texte de l'email de réinitialisation
   */
  private generatePasswordResetText(userName: string, resetUrl: string): string {
    return `
Bonjour ${userName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte GAIS.

Pour créer un nouveau mot de passe, cliquez sur ce lien :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 15 minutes seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec personne

Si vous avez des questions, contactez l'administrateur système.

Cordialement,
L'équipe GAIS

© 2025 GAIS - Gestionnaire d'Accès Internet Sécurisé
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;
  }

  /**
   * Envoie un email de confirmation d'inscription (bonus)
   */
  public async sendWelcomeEmail(
    email: string, 
    userName?: string
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Service email non disponible');
      return false;
    }

    try {
      const displayName = userName || email;

      const mailOptions = {
        from: {
          name: 'GAIS - Gestionnaire d\'Accès Internet',
          address: appConfig.email.from!,
        },
        to: email,
        subject: '[GAIS] Bienvenue ! Votre compte a été créé',
        html: `
          <h2>Bienvenue ${displayName} !</h2>
          <p>Votre compte GAIS a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter et profiter d'un accès internet sécurisé.</p>
          <p>Cordialement,<br>L'équipe GAIS</p>
        `,
        text: `
Bienvenue ${displayName} !

Votre compte GAIS a été créé avec succès.
Vous pouvez maintenant vous connecter et profiter d'un accès internet sécurisé.

Cordialement,
L'équipe GAIS
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email de bienvenue envoyé', {
        to: email,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de bienvenue', {
        error,
        email,
      });
      return false;
    }
  }

  /**
   * Envoie une alerte de quota par email
   */
  async sendQuotaAlert(
    email: string, 
    userName: string | null, 
    quotaType: 'data' | 'time',
    usedPercentage: number,
    remainingAmount: string
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Service email non disponible');
      return false;
    }

    try {
      const displayName = userName || email;
      const quotaTypeText = quotaType === 'data' ? 'données' : 'temps';
      
      let alertLevel = 'attention';
      let alertColor = '#ff9800'; // Orange
      if (usedPercentage >= 90) {
        alertLevel = 'critique';
        alertColor = '#f44336'; // Rouge
      } else if (usedPercentage >= 80) {
        alertLevel = 'élevé';
        alertColor = '#ff5722'; // Rouge orangé
      }

      const mailOptions = {
        from: {
          name: 'GAIS - Gestionnaire d\'Accès Internet',
          address: appConfig.email.from!,
        },
        to: email,
        subject: `[GAIS] ⚠️ Alerte Quota ${quotaTypeText} - ${usedPercentage}% utilisé`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${alertColor}; color: white; padding: 20px; text-align: center;">
              <h2>⚠️ Alerte Quota ${quotaTypeText}</h2>
              <p style="font-size: 18px; margin: 0;">Niveau ${alertLevel}</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Bonjour ${displayName},</p>
              <p>Votre quota de <strong>${quotaTypeText}</strong> a atteint <strong>${usedPercentage}%</strong> de votre limite autorisée.</p>
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Restant :</strong> ${remainingAmount}</p>
                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background: ${alertColor}; height: 100%; width: ${usedPercentage}%; transition: width 0.3s;"></div>
                </div>
                <p style="text-align: center; margin: 5px 0 0 0; font-size: 12px;">${usedPercentage}% utilisé</p>
              </div>
              <p>Nous vous recommandons de surveiller votre consommation pour éviter une interruption de service.</p>
              <p>Cordialement,<br>L'équipe GAIS</p>
            </div>
          </div>
        `,
        text: `
ALERTE QUOTA ${quotaTypeText.toUpperCase()} - Niveau ${alertLevel}

Bonjour ${displayName},

Votre quota de ${quotaTypeText} a atteint ${usedPercentage}% de votre limite autorisée.
Restant : ${remainingAmount}

Nous vous recommandons de surveiller votre consommation pour éviter une interruption de service.

Cordialement,
L'équipe GAIS
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Alerte quota envoyée par email', {
        to: email,
        quotaType,
        usedPercentage,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'alerte quota', {
        error,
        email,
        quotaType,
        usedPercentage,
      });
      return false;
    }
  }

  /**
   * Envoie une alerte de sécurité
   */
  async sendSecurityAlert(
    email: string,
    userName: string | null,
    alertType: 'login_failed' | 'suspicious_activity' | 'account_locked' | 'password_changed',
    details: {
      ipAddress?: string;
      userAgent?: string;
      timestamp?: Date;
      attemptCount?: number;
      location?: string;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Service email non disponible');
      return false;
    }

    try {
      const displayName = userName || email;
      const now = details.timestamp || new Date();
      
      const alertMessages = {
        login_failed: {
          subject: '🔒 Tentatives de connexion échouées',
          title: 'Tentatives de connexion suspectes',
          message: `Nous avons détecté ${details.attemptCount || 'plusieurs'} tentatives de connexion échouées sur votre compte.`,
          action: 'Si ce n\'était pas vous, changez immédiatement votre mot de passe.'
        },
        suspicious_activity: {
          subject: '⚠️ Activité suspecte détectée',
          title: 'Activité inhabituelle',
          message: 'Une activité suspecte a été détectée sur votre compte.',
          action: 'Vérifiez vos sessions actives et changez votre mot de passe si nécessaire.'
        },
        account_locked: {
          subject: '🚫 Compte temporairement verrouillé',
          title: 'Compte verrouillé pour sécurité',
          message: 'Votre compte a été temporairement verrouillé suite à plusieurs tentatives de connexion échouées.',
          action: 'Contactez l\'administrateur ou attendez la levée automatique du verrouillage.'
        },
        password_changed: {
          subject: '✅ Mot de passe modifié',
          title: 'Mot de passe changé avec succès',
          message: 'Votre mot de passe a été modifié avec succès.',
          action: 'Si ce n\'était pas vous, contactez immédiatement l\'administrateur.'
        }
      };

      const alert = alertMessages[alertType];

      const mailOptions = {
        from: {
          name: 'GAIS - Sécurité',
          address: appConfig.email.from!,
        },
        to: email,
        subject: `[GAIS] ${alert.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
              <h2>${alert.title}</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Bonjour ${displayName},</p>
              <p>${alert.message}</p>
              
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f44336;">
                <h4>Détails de l'événement :</h4>
                <p><strong>Date/Heure :</strong> ${now.toLocaleString('fr-FR')}</p>
                ${details.ipAddress ? `<p><strong>Adresse IP :</strong> ${details.ipAddress}</p>` : ''}
                ${details.location ? `<p><strong>Localisation :</strong> ${details.location}</p>` : ''}
                ${details.userAgent ? `<p><strong>Navigateur :</strong> ${details.userAgent}</p>` : ''}
                ${details.attemptCount ? `<p><strong>Nombre de tentatives :</strong> ${details.attemptCount}</p>` : ''}
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Action recommandée :</strong> ${alert.action}</p>
              </div>

              <p>Si vous avez des questions, contactez l'administrateur système.</p>
              <p>Cordialement,<br>L'équipe Sécurité GAIS</p>
            </div>
          </div>
        `,
        text: `
${alert.title}

Bonjour ${displayName},

${alert.message}

Détails de l'événement :
- Date/Heure : ${now.toLocaleString('fr-FR')}
${details.ipAddress ? `- Adresse IP : ${details.ipAddress}` : ''}
${details.location ? `- Localisation : ${details.location}` : ''}
${details.attemptCount ? `- Nombre de tentatives : ${details.attemptCount}` : ''}

Action recommandée : ${alert.action}

Si vous avez des questions, contactez l'administrateur système.

Cordialement,
L'équipe Sécurité GAIS
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Alerte sécurité envoyée par email', {
        to: email,
        alertType,
        messageId: result.messageId,
        details
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'alerte sécurité', {
        error,
        email,
        alertType,
      });
      return false;
    }
  }

  /**
   * Envoie un email de reset de mot de passe
   */
  async sendPasswordReset(
    email: string,
    userName: string | null,
    resetToken: string,
    resetUrl: string
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Service email non disponible');
      return false;
    }

    try {
      const displayName = userName || email;
      const expirationTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const mailOptions = {
        from: {
          name: 'GAIS - Gestionnaire d\'Accès Internet',
          address: appConfig.email.from!,
        },
        to: email,
        subject: '[GAIS] 🔑 Réinitialisation de votre mot de passe',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2196f3; color: white; padding: 20px; text-align: center;">
              <h2>🔑 Réinitialisation de mot de passe</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Bonjour ${displayName},</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe GAIS.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="
                  background: #2196f3; 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  display: inline-block;
                  font-weight: bold;
                ">Réinitialiser mon mot de passe</a>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>⏰ Important :</strong> Ce lien expire le ${expirationTime.toLocaleString('fr-FR')}</p>
                <p><strong>🔒 Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              </div>

              <p style="font-size: 12px; color: #666;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}">${resetUrl}</a>
              </p>

              <p>Cordialement,<br>L'équipe GAIS</p>
            </div>
          </div>
        `,
        text: `
Réinitialisation de mot de passe

Bonjour ${displayName},

Vous avez demandé la réinitialisation de votre mot de passe GAIS.

Cliquez sur ce lien pour réinitialiser votre mot de passe :
${resetUrl}

IMPORTANT : Ce lien expire le ${expirationTime.toLocaleString('fr-FR')}

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe GAIS
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email de reset mot de passe envoyé', {
        to: email,
        resetToken: resetToken.substring(0, 8) + '***', // Log partiel pour sécurité
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de reset', {
        error,
        email,
      });
      return false;
    }
  }

  /**
   * Envoie un rapport périodique (hebdomadaire/mensuel)
   */
  async sendPeriodicReport(
    email: string,
    userName: string | null,
    reportType: 'weekly' | 'monthly',
    reportData: {
      period: string;
      totalDataUsed: number;
      totalTimeUsed: number;
      sessionsCount: number;
      quotaUsagePercentage: number;
      topActivities?: Array<{
        date: string;
        dataUsed: number;
        timeUsed: number;
      }>;
    }
  ): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Service email non disponible');
      return false;
    }

    try {
      const displayName = userName || email;
      const periodText = reportType === 'weekly' ? 'hebdomadaire' : 'mensuel';
      const periodEmoji = reportType === 'weekly' ? '📅' : '📊';

      // Formatage des données
      const dataGB = (reportData.totalDataUsed / 1024).toFixed(2);
      const timeHours = (reportData.totalTimeUsed / 60).toFixed(1);

      const mailOptions = {
        from: {
          name: 'GAIS - Rapports',
          address: appConfig.email.from!,
        },
        to: email,
        subject: `[GAIS] ${periodEmoji} Rapport ${periodText} - ${reportData.period}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4caf50; color: white; padding: 20px; text-align: center;">
              <h2>${periodEmoji} Rapport ${periodText}</h2>
              <p style="margin: 0; font-size: 18px;">${reportData.period}</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Bonjour ${displayName},</p>
              <p>Voici votre rapport d'utilisation ${periodText} GAIS :</p>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #2196f3;">
                  <h3 style="margin: 0 0 10px 0; color: #2196f3;">📊 Données</h3>
                  <p style="font-size: 24px; font-weight: bold; margin: 0;">${dataGB} GB</p>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #ff9800;">
                  <h3 style="margin: 0 0 10px 0; color: #ff9800;">⏰ Temps</h3>
                  <p style="font-size: 24px; font-weight: bold; margin: 0;">${timeHours}h</p>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0;">📈 Résumé de la période</h3>
                <p><strong>Sessions :</strong> ${reportData.sessionsCount}</p>
                <p><strong>Utilisation quota :</strong> ${reportData.quotaUsagePercentage}%</p>
                
                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                  <div style="
                    background: ${reportData.quotaUsagePercentage > 80 ? '#f44336' : reportData.quotaUsagePercentage > 60 ? '#ff9800' : '#4caf50'}; 
                    height: 100%; 
                    width: ${Math.min(reportData.quotaUsagePercentage, 100)}%; 
                    transition: width 0.3s;
                  "></div>
                </div>
              </div>

              ${reportData.topActivities && reportData.topActivities.length > 0 ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0;">🔥 Activité la plus importante</h3>
                ${reportData.topActivities.slice(0, 3).map(activity => `
                  <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span>${activity.date}</span>
                    <span><strong>${(activity.dataUsed / 1024).toFixed(1)} GB</strong> • ${(activity.timeUsed / 60).toFixed(1)}h</span>
                  </div>
                `).join('')}
              </div>
              ` : ''}

              <p>Merci d'utiliser GAIS de manière responsable !</p>
              <p>Cordialement,<br>L'équipe GAIS</p>
            </div>
          </div>
        `,
        text: `
Rapport ${periodText} GAIS - ${reportData.period}

Bonjour ${displayName},

Voici votre rapport d'utilisation ${periodText} :

DONNÉES CONSOMMÉES : ${dataGB} GB
TEMPS D'UTILISATION : ${timeHours} heures
NOMBRE DE SESSIONS : ${reportData.sessionsCount}
UTILISATION QUOTA : ${reportData.quotaUsagePercentage}%

${reportData.topActivities && reportData.topActivities.length > 0 ? `
ACTIVITÉ LA PLUS IMPORTANTE :
${reportData.topActivities.slice(0, 3).map(activity => 
  `- ${activity.date} : ${(activity.dataUsed / 1024).toFixed(1)} GB, ${(activity.timeUsed / 60).toFixed(1)}h`
).join('\n')}
` : ''}

Merci d'utiliser GAIS de manière responsable !

Cordialement,
L'équipe GAIS
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Rapport périodique envoyé par email', {
        to: email,
        reportType,
        period: reportData.period,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du rapport périodique', {
        error,
        email,
        reportType,
      });
      return false;
    }
  }


}

// Instance singleton du service email
export const emailService = new EmailService();
