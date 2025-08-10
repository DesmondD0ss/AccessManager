import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { emailService } from './emailService.js';

/**
 * Service de sauvegarde automatique pour GAIS
 * Gère la sauvegarde, compression, restauration et planification
 */
export class BackupService {
  private prisma: PrismaClient;
  private backupDir: string;
  private maxBackups: number;
  private compressionEnabled: boolean;

  constructor() {
    this.prisma = new PrismaClient();
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = 10; // Garder les 10 dernières sauvegardes
    this.compressionEnabled = true;
    this.ensureBackupDirectory();
  }

  /**
   * Assure que le répertoire de sauvegarde existe
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info('Répertoire de sauvegarde créé', { backupDir: this.backupDir });
    }
  }

  /**
   * Crée une sauvegarde complète de la base de données
   */
  async createBackup(description?: string): Promise<{
    success: boolean;
    backupFile?: string;
    size?: number;
    duration?: number;
    message: string;
  }> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `gais-backup-${timestamp}`;
    const sqlFile = path.join(this.backupDir, `${backupName}.sql`);
    const finalFile = this.compressionEnabled ? `${sqlFile}.gz` : sqlFile;

    try {
      logger.info('Début de la sauvegarde de la base de données', {
        backupName,
        compression: this.compressionEnabled,
        description
      });

      // Étape 1: Export SQL de la base de données SQLite
      await this.exportDatabase(sqlFile);

      // Étape 2: Compression (si activée)
      if (this.compressionEnabled) {
        await this.compressFile(sqlFile, `${sqlFile}.gz`);
        await fs.unlink(sqlFile); // Supprimer le fichier non compressé
      }

      // Étape 3: Vérification et métadonnées
      const stats = await fs.stat(finalFile);
      const duration = Date.now() - startTime;

      // Étape 4: Création du fichier de métadonnées
      const metadata = {
        backupName,
        timestamp: new Date().toISOString(),
        description: description || 'Sauvegarde automatique',
        fileName: path.basename(finalFile),
        size: Number(stats.size),
        compressed: this.compressionEnabled,
        duration: Number(duration),
        databaseVersion: await this.getDatabaseVersion(),
        tableCount: await this.getTableCount()
      };

      await fs.writeFile(
        path.join(this.backupDir, `${backupName}.meta.json`),
        JSON.stringify(metadata, null, 2)
      );

      // Étape 5: Nettoyage des anciennes sauvegardes
      await this.cleanupOldBackups();

      logger.info('Sauvegarde terminée avec succès', {
        backupFile: finalFile,
        size: stats.size,
        duration,
        compressed: this.compressionEnabled
      });

      return {
        success: true,
        backupFile: finalFile,
        size: Number(stats.size),
        duration: Number(duration),
        message: `Sauvegarde créée avec succès (${this.formatFileSize(Number(stats.size))}, ${duration}ms)`
      };

    } catch (error: any) {
      logger.error('Erreur lors de la sauvegarde', { error: error.message });
      
      // Nettoyage en cas d'erreur
      try {
        await fs.unlink(sqlFile);
      } catch {}
      try {
        await fs.unlink(`${sqlFile}.gz`);
      } catch {}

      return {
        success: false,
        message: `Erreur lors de la sauvegarde: ${error.message}`
      };
    }
  }

  /**
   * Exporte la base de données SQLite vers un fichier SQL
   */
  private async exportDatabase(outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Pour SQLite, on utilise sqlite3 pour faire un dump
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      
      const sqlite3Process = spawn('sqlite3', [dbPath, '.dump'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const writeStream = createWriteStream(outputFile);
      
      sqlite3Process.stdout.pipe(writeStream);
      
      sqlite3Process.stderr.on('data', (data) => {
        logger.error('Erreur sqlite3:', data.toString());
      });

      sqlite3Process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`sqlite3 exited with code ${code}`));
        }
      });

      sqlite3Process.on('error', (error) => {
        reject(new Error(`Failed to start sqlite3: ${error.message}`));
      });
    });
  }

  /**
   * Compresse un fichier avec gzip
   */
  private async compressFile(inputFile: string, outputFile: string): Promise<void> {
    const readStream = createReadStream(inputFile);
    const writeStream = createWriteStream(outputFile);
    const gzipStream = createGzip({ level: 9 }); // Compression maximale

    await pipeline(readStream, gzipStream, writeStream);
  }

  /**
   * Décompresse un fichier gzip
   */
  private async decompressFile(inputFile: string, outputFile: string): Promise<void> {
    const readStream = createReadStream(inputFile);
    const writeStream = createWriteStream(outputFile);
    const gunzipStream = createGunzip();

    await pipeline(readStream, gunzipStream, writeStream);
  }

  /**
   * Restaure une sauvegarde
   */
  async restoreBackup(backupFileName: string): Promise<{
    success: boolean;
    message: string;
    tablesRestored?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const backupFilePath = path.join(this.backupDir, backupFileName);
      
      // Vérifier que le fichier de sauvegarde existe
      await fs.access(backupFilePath);

      logger.info('Début de la restauration', { backupFile: backupFileName });

      // Décompresser si nécessaire
      let sqlFile = backupFilePath;
      if (backupFileName.endsWith('.gz')) {
        sqlFile = backupFilePath.replace('.gz', '');
        await this.decompressFile(backupFilePath, sqlFile);
      }

      // Restaurer la base de données
      await this.importDatabase(sqlFile);

      // Nettoyer le fichier décompressé temporaire
      if (backupFileName.endsWith('.gz')) {
        await fs.unlink(sqlFile);
      }

      const duration = Date.now() - startTime;
      const tableCount = await this.getTableCount();

      logger.info('Restauration terminée avec succès', {
        backupFile: backupFileName,
        duration,
        tablesRestored: tableCount
      });

      return {
        success: true,
        message: `Restauration réussie en ${duration}ms`,
        tablesRestored: tableCount
      };

    } catch (error: any) {
      logger.error('Erreur lors de la restauration', { 
        error: error.message,
        backupFile: backupFileName 
      });

      return {
        success: false,
        message: `Erreur lors de la restauration: ${error.message}`
      };
    }
  }

  /**
   * Importe un fichier SQL dans la base de données
   */
  private async importDatabase(sqlFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      
      // Créer une sauvegarde de sécurité avant la restauration
      const backupDbPath = `${dbPath}.restore-backup`;
      fs.copyFile(dbPath, backupDbPath).catch(() => {}); // Ignore les erreurs

      const sqlite3Process = spawn('sqlite3', [dbPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Lire le fichier SQL et l'envoyer à sqlite3
      fs.readFile(sqlFile, 'utf8').then(sqlContent => {
        sqlite3Process.stdin.write(sqlContent);
        sqlite3Process.stdin.end();
      }).catch(reject);

      sqlite3Process.stderr.on('data', (data) => {
        logger.error('Erreur sqlite3 import:', data.toString());
      });

      sqlite3Process.on('close', (code) => {
        if (code === 0) {
          // Supprimer la sauvegarde de sécurité en cas de succès
          fs.unlink(backupDbPath).catch(() => {});
          resolve();
        } else {
          // Restaurer la sauvegarde de sécurité en cas d'erreur
          fs.copyFile(backupDbPath, dbPath).catch(() => {});
          reject(new Error(`sqlite3 import failed with code ${code}`));
        }
      });

      sqlite3Process.on('error', (error) => {
        reject(new Error(`Failed to start sqlite3: ${error.message}`));
      });
    });
  }

  /**
   * Liste toutes les sauvegardes disponibles
   */
  async listBackups(): Promise<Array<{
    fileName: string;
    metadata?: any;
    size: number;
    createdAt: Date;
    compressed: boolean;
  }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.endsWith('.sql') || file.endsWith('.sql.gz')
      );

      const backups = await Promise.all(
        backupFiles.map(async (fileName) => {
          const filePath = path.join(this.backupDir, fileName);
          const stats = await fs.stat(filePath);
          
          // Essayer de charger les métadonnées
          const metaFile = fileName.replace(/\.sql(\.gz)?$/, '.meta.json');
          let metadata = null;
          try {
            const metaContent = await fs.readFile(
              path.join(this.backupDir, metaFile), 
              'utf8'
            );
            metadata = JSON.parse(metaContent);
          } catch {}

          return {
            fileName,
            metadata,
            size: Number(stats.size),
            createdAt: stats.birthtime,
            compressed: fileName.endsWith('.gz')
          };
        })
      );

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      logger.error('Erreur lors de la liste des sauvegardes', { error: error.message });
      return [];
    }
  }

  /**
   * Supprime une sauvegarde
   */
  async deleteBackup(fileName: string): Promise<{ success: boolean; message: string }> {
    try {
      const filePath = path.join(this.backupDir, fileName);
      await fs.unlink(filePath);

      // Supprimer aussi le fichier de métadonnées s'il existe
      const metaFile = fileName.replace(/\.sql(\.gz)?$/, '.meta.json');
      try {
        await fs.unlink(path.join(this.backupDir, metaFile));
      } catch {}

      logger.info('Sauvegarde supprimée', { fileName });
      return {
        success: true,
        message: 'Sauvegarde supprimée avec succès'
      };
    } catch (error: any) {
      logger.error('Erreur lors de la suppression', { error: error.message, fileName });
      return {
        success: false,
        message: `Erreur: ${error.message}`
      };
    }
  }

  /**
   * Nettoie les anciennes sauvegardes (garde seulement les N plus récentes)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.fileName);
        }

        logger.info('Nettoyage des anciennes sauvegardes', {
          deleted: toDelete.length,
          kept: this.maxBackups
        });
      }
    } catch (error: any) {
      logger.error('Erreur lors du nettoyage des sauvegardes', { error: error.message });
    }
  }

  /**
   * Obtient la version de la base de données
   */
  private async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.prisma.$queryRaw`SELECT sqlite_version() as version` as any[];
      return String(result[0]?.version || 'Unknown');
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Obtient le nombre de tables dans la base de données
   */
  private async getTableCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ` as any[];
      return Number(result[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  /**
   * Planifie les sauvegardes automatiques
   */
  scheduleAutomaticBackups(): void {
    // Sauvegarde quotidienne à 2h du matin
    const scheduleNext = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(2, 0, 0, 0); // 2h du matin
      
      // Si on a dépassé 2h aujourd'hui, programmer pour demain
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      const delay = next.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.performScheduledBackup();
        scheduleNext(); // Programmer la prochaine sauvegarde
      }, delay);

      logger.info('Prochaine sauvegarde automatique programmée', {
        nextBackup: next.toISOString()
      });
    };

    scheduleNext();
  }

  /**
   * Effectue une sauvegarde planifiée
   */
  private async performScheduledBackup(): Promise<void> {
    try {
      const result = await this.createBackup('Sauvegarde automatique quotidienne');
      
      if (result.success) {
        logger.info('Sauvegarde automatique réussie', result);
        
        // Envoyer une notification email aux admins (optionnel)
        if (emailService.isEnabled()) {
          // Cette fonctionnalité pourrait être ajoutée plus tard
        }
      } else {
        logger.error('Échec de la sauvegarde automatique', result);
        
        // Envoyer une alerte email en cas d'échec
        if (emailService.isEnabled()) {
          // Cette fonctionnalité pourrait être ajoutée plus tard
        }
      }
    } catch (error: any) {
      logger.error('Erreur lors de la sauvegarde automatique', { error: error.message });
    }
  }

  /**
   * Formate la taille d'un fichier pour l'affichage
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Obtient les statistiques des sauvegardes
   */
  async getBackupStatistics(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
    compressionRatio?: number;
  }> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length === 0) {
        return { totalBackups: 0, totalSize: 0 };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const dates = backups.map(b => b.createdAt);
      
      return {
        totalBackups: backups.length,
        totalSize: Number(totalSize),
        oldestBackup: new Date(Math.min(...dates.map(d => d.getTime()))),
        newestBackup: new Date(Math.max(...dates.map(d => d.getTime()))),
        compressionRatio: this.compressionEnabled ? 0.3 : 1.0 // Estimation
      };
    } catch (error: any) {
      logger.error('Erreur lors du calcul des statistiques', { error: error.message });
      return { totalBackups: 0, totalSize: 0 };
    }
  }
}

// Instance singleton du service de sauvegarde
export const backupService = new BackupService();
