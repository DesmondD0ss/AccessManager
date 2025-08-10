import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  FileText,
  Zap,
  Shield,
  Settings,
  Plus
} from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

interface DatabaseInfo {
  type: string;
  version: string;
  size: string;
  tablesCount: number;
  recordsCount: number;
  connected: boolean;
  lastBackup?: string;
}

interface BackupFile {
  id: string;
  filename: string;
  size: string;
  created: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
}

interface DatabaseStats {
  totalSize: string;
  usedSpace: string;
  freeSpace: string;
  avgQueryTime: number;
  slowQueries: number;
  connections: {
    active: number;
    max: number;
  };
}

const DatabaseManagementGitHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'backups' | 'maintenance'>('overview');
  const [backing, setBacking] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const dbInfo: DatabaseInfo = {
    type: 'SQLite',
    version: '3.42.0',
    size: '45.6 MB',
    tablesCount: 12,
    recordsCount: 2847,
    connected: true,
    lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  };

  const backups: BackupFile[] = [
    {
      id: '1',
      filename: 'backup_2025-08-04_08-00-00.db',
      size: '45.2 MB',
      created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      type: 'automatic',
      status: 'completed'
    },
    {
      id: '2',
      filename: 'backup_2025-08-03_08-00-00.db',
      size: '44.8 MB',
      created: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      type: 'automatic',
      status: 'completed'
    },
    {
      id: '3',
      filename: 'backup_manual_2025-08-02.db',
      size: '44.5 MB',
      created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      type: 'manual',
      status: 'completed'
    }
  ];

  const stats: DatabaseStats = {
    totalSize: '50 MB',
    usedSpace: '45.6 MB',
    freeSpace: '4.4 MB',
    avgQueryTime: 2.3,
    slowQueries: 3,
    connections: {
      active: 5,
      max: 100
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleBackup = async () => {
    setBacking(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setBacking(false);
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOptimizing(false);
  };

  const getBackupStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getBackupTypeColor = (type: string) => {
    return type === 'automatic' ? 'info' : 'default';
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Database },
    { id: 'backups', label: 'Sauvegardes', icon: HardDrive },
    { id: 'maintenance', label: 'Maintenance', icon: Settings }
  ];

  return (
    <PageLayout
      title="Gestion de la base de données"
      description="Administration, sauvegarde et maintenance de la base de données"
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleBackup}
            disabled={backing}
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className={`w-4 h-4 ${backing ? 'animate-pulse' : ''}`} />
            {backing ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-canvas-subtle rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center
                  ${isActive 
                    ? 'bg-canvas-default text-fg-default shadow-sm' 
                    : 'text-fg-muted hover:text-fg-default hover:bg-canvas-default/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Database Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  État de la base de données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-canvas-subtle rounded-lg">
                      <CheckCircle className="w-6 h-6 text-success-fg" />
                    </div>
                    <div>
                      <p className="font-medium text-fg-default">Connectée</p>
                      <p className="text-sm text-fg-muted">{dbInfo.type} {dbInfo.version}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-canvas-subtle rounded-lg">
                      <HardDrive className="w-6 h-6 text-fg-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-fg-default">{dbInfo.size}</p>
                      <p className="text-sm text-fg-muted">Taille totale</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-canvas-subtle rounded-lg">
                      <FileText className="w-6 h-6 text-fg-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-fg-default">
                        {dbInfo.tablesCount} tables
                      </p>
                      <p className="text-sm text-fg-muted">
                        {dbInfo.recordsCount.toLocaleString()} enregistrements
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-fg-muted">Espace utilisé</p>
                      <p className="text-lg font-semibold text-fg-default">{stats.usedSpace}</p>
                    </div>
                    <HardDrive className="w-6 h-6 text-fg-muted" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-fg-muted">Temps de requête moyen</p>
                      <p className="text-lg font-semibold text-fg-default">{stats.avgQueryTime}ms</p>
                    </div>
                    <Zap className="w-6 h-6 text-fg-muted" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-fg-muted">Connexions actives</p>
                      <p className="text-lg font-semibold text-fg-default">
                        {stats.connections.active}/{stats.connections.max}
                      </p>
                    </div>
                    <Database className="w-6 h-6 text-fg-muted" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-fg-muted">Requêtes lentes</p>
                      <p className="text-lg font-semibold text-attention-fg">{stats.slowQueries}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-attention-fg" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleOptimize}
                    disabled={optimizing}
                    size="sm" 
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Zap className={`w-4 h-4 ${optimizing ? 'animate-pulse' : ''}`} />
                    {optimizing ? 'Optimisation...' : 'Optimiser'}
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Shield className="w-4 h-4 mr-2" />
                    Analyser l'intégrité
                  </Button>
                  <Button size="sm" variant="secondary">
                    <FileText className="w-4 h-4 mr-2" />
                    Voir les logs
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fichiers de sauvegarde ({backups.length})</span>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nouvelle sauvegarde
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 bg-canvas-subtle rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-canvas-default rounded-lg">
                          <HardDrive className="w-5 h-5 text-fg-muted" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-fg-default font-mono text-sm">
                              {backup.filename}
                            </h4>
                            <Badge variant={getBackupStatusColor(backup.status)} size="sm">
                              {backup.status}
                            </Badge>
                            <Badge variant={getBackupTypeColor(backup.type)} size="sm">
                              {backup.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-fg-muted">
                            <span>Taille: {backup.size}</span>
                            <span>
                              Créée: {new Date(backup.created).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Upload className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration des sauvegardes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-fg-default">Sauvegarde automatique</h4>
                      <p className="text-sm text-fg-muted">Sauvegarde quotidienne à 2h00</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-canvas-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-emphasis"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-fg-default">Rétention</h4>
                      <p className="text-sm text-fg-muted">Conserver les sauvegardes 30 jours</p>
                    </div>
                    <select className="input w-32">
                      <option>7 jours</option>
                      <option>15 jours</option>
                      <option>30 jours</option>
                      <option>90 jours</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 text-fg-muted mx-auto mb-4" />
              <p className="text-fg-muted">Outils de maintenance de la base de données</p>
              <p className="text-sm text-fg-muted mt-2">Contenu à implémenter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default DatabaseManagementGitHub;
