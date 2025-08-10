import React, { useState } from 'react';
import { Wrench, Server, Database, Shield, RefreshCw, AlertTriangle, CheckCircle, Clock, Download, Upload, Play, Square, Settings } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

const MaintenancePageGitHub: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const maintenanceTasks = [
    {
      id: 1,
      name: 'Nettoyage de la base de données',
      description: 'Suppression des logs anciens et optimisation des tables',
      lastRun: '2024-01-20 02:00:00',
      nextRun: '2024-01-21 02:00:00',
      status: 'completed',
      duration: '15 min',
      type: 'database'
    },
    {
      id: 2,
      name: 'Mise à jour des signatures de sécurité',
      description: 'Téléchargement des dernières définitions antivirus',
      lastRun: '2024-01-20 12:00:00',
      nextRun: '2024-01-20 18:00:00',
      status: 'running',
      duration: '5 min',
      type: 'security'
    },
    {
      id: 3,
      name: 'Sauvegarde système complète',
      description: 'Sauvegarde complète de la configuration et des données',
      lastRun: '2024-01-19 01:00:00',
      nextRun: '2024-01-21 01:00:00',
      status: 'scheduled',
      duration: '45 min',
      type: 'backup'
    },
    {
      id: 4,
      name: 'Vérification de l\'intégrité des fichiers',
      description: 'Contrôle de l\'intégrité des fichiers système critiques',
      lastRun: '2024-01-19 03:00:00',
      nextRun: '2024-01-22 03:00:00',
      status: 'error',
      duration: '20 min',
      type: 'system'
    }
  ];

  const systemHealth = [
    { name: 'CPU', value: 45, status: 'good', unit: '%' },
    { name: 'Mémoire', value: 72, status: 'warning', unit: '%' },
    { name: 'Stockage', value: 34, status: 'good', unit: '%' },
    { name: 'Température', value: 42, status: 'good', unit: '°C' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'warning';
      case 'scheduled': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return RefreshCw;
      case 'scheduled': return Clock;
      case 'error': return AlertTriangle;
      default: return Clock;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return Database;
      case 'security': return Shield;
      case 'backup': return Server;
      case 'system': return Wrench;
      default: return Wrench;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <PageLayout
      title="Maintenance système"
      description="Gestion des tâches de maintenance et surveillance de la santé du système"
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
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            size="sm"
            variant={maintenanceMode ? 'danger' : 'secondary'}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {maintenanceMode ? 'Désactiver maintenance' : 'Mode maintenance'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Maintenance Mode Alert */}
        {maintenanceMode && (
          <Card className="border-attention-emphasis bg-attention-subtle">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-attention-fg" />
                <div>
                  <h4 className="font-medium text-attention-fg">Mode maintenance activé</h4>
                  <p className="text-sm text-attention-fg/80">
                    Le système est en mode maintenance. Les utilisateurs ne peuvent pas se connecter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemHealth.map((health, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-fg-muted">{health.name}</p>
                    <p className="text-2xl font-semibold text-fg-default">
                      {health.value}{health.unit}
                    </p>
                  </div>
                  <Badge variant={getHealthColor(health.status)} size="sm">
                    {health.status}
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="mt-3 w-full bg-canvas-subtle rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      health.status === 'good' ? 'bg-success-emphasis' : 
                      health.status === 'warning' ? 'bg-attention-emphasis' : 'bg-danger-emphasis'
                    }`}
                    style={{ width: `${Math.min(health.value, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Maintenance Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tâches de maintenance ({maintenanceTasks.length})</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">Planifier nouvelle tâche</Button>
                <Button size="sm" variant="secondary">Exécuter toutes</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceTasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                const TypeIcon = getTaskTypeIcon(task.type);
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-canvas-subtle rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-canvas-default rounded-lg">
                        <TypeIcon className="w-5 h-5 text-fg-muted" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-fg-default">{task.name}</h4>
                          <Badge variant={getStatusColor(task.status)} size="sm">
                            {task.status}
                          </Badge>
                          <span className="text-xs text-fg-muted">
                            Durée: {task.duration}
                          </span>
                        </div>
                        <p className="text-sm text-fg-muted mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-fg-muted">
                          {task.lastRun && (
                            <span>
                              Dernière exécution: {new Date(task.lastRun).toLocaleString()}
                            </span>
                          )}
                          {task.nextRun && (
                            <span>
                              Prochaine exécution: {new Date(task.nextRun).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-5 h-5 text-fg-muted ${task.status === 'running' ? 'animate-spin' : ''}`} />
                      <div className="flex items-center gap-1">
                        {task.status === 'error' ? (
                          <Button size="sm" variant="ghost">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        ) : task.status === 'scheduled' ? (
                          <Button size="sm" variant="ghost">
                            <Play className="w-4 h-4" />
                          </Button>
                        ) : task.status === 'running' ? (
                          <Button size="sm" variant="ghost">
                            <Square className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions de maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Optimiser la base de données
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Server className="w-4 h-4 mr-2" />
                  Nettoyer les fichiers temporaires
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Mise à jour sécurité
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Redémarrer les services
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sauvegarde et restauration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Créer une sauvegarde complète
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Restaurer depuis une sauvegarde
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration des sauvegardes
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Vérifier l'intégrité
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default MaintenancePageGitHub;
