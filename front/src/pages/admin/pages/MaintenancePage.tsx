import React, { useState } from 'react';
import { Wrench, Server, Database, Shield, RefreshCw, AlertTriangle, CheckCircle, Clock, Download, Play, Square, Settings } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';

const MaintenancePage: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const maintenanceStats = [
    {
      title: 'Tâches Actives',
      value: '3',
      icon: Wrench,
      variant: 'success' as const
    },
    {
      title: 'Tâches Planifiées',
      value: '12',
      icon: Clock,
      variant: 'info' as const
    },
    {
      title: 'Dernière Maintenance',
      value: '2h ago',
      icon: CheckCircle,
      variant: 'success' as const
    },
    {
      title: 'Mode Maintenance',
      value: maintenanceMode ? 'Activé' : 'Désactivé',
      icon: AlertTriangle,
      variant: maintenanceMode ? 'warning' as const : 'secondary' as const
    }
  ];

  const maintenanceTasks = [
    {
      id: 1,
      name: 'Nettoyage de la base de données',
      description: 'Suppression des logs anciens et optimisation des tables',
      lastRun: '2024-01-20 02:00:00',
      nextRun: '2024-01-21 02:00:00',
      status: 'completed',
      duration: '15 min',
      type: 'database',
      icon: Database
    },
    {
      id: 2,
      name: 'Mise à jour des signatures de sécurité',
      description: 'Téléchargement des dernières définitions antivirus',
      lastRun: '2024-01-20 12:00:00',
      nextRun: '2024-01-20 18:00:00',
      status: 'running',
      duration: '5 min',
      type: 'security',
      icon: Shield
    },
    {
      id: 3,
      name: 'Redémarrage des services',
      description: 'Redémarrage planifié des services système',
      lastRun: '2024-01-19 23:00:00',
      nextRun: '2024-01-20 23:00:00',
      status: 'scheduled',
      duration: '10 min',
      type: 'system',
      icon: Server
    },
    {
      id: 4,
      name: 'Sauvegarde automatique',
      description: 'Sauvegarde complète du système et des données',
      lastRun: '2024-01-20 01:00:00',
      nextRun: '2024-01-21 01:00:00',
      status: 'failed',
      duration: '45 min',
      type: 'backup',
      icon: Download
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleToggleMaintenanceMode = () => {
    setMaintenanceMode(!maintenanceMode);
  };

  const handleRunTask = (id: number) => {
    console.log('Exécuter la tâche:', id);
  };

  const handleStopTask = (id: number) => {
    console.log('Arrêter la tâche:', id);
  };

  const handleConfigureTask = (id: number) => {
    console.log('Configurer la tâche:', id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'scheduled':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'running':
        return RefreshCw;
      case 'scheduled':
        return Clock;
      case 'failed':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'running':
        return 'En cours';
      case 'scheduled':
        return 'Planifié';
      case 'failed':
        return 'Échec';
      default:
        return 'Inconnu';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'database':
        return 'info';
      case 'security':
        return 'warning';
      case 'system':
        return 'success';
      case 'backup':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const filteredTasks = maintenanceTasks.filter(task =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Maintenance Système"
      description="Gérez les tâches de maintenance et surveillez l'état du système"
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant={maintenanceMode ? "danger" : "secondary"}
            onClick={handleToggleMaintenanceMode}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {maintenanceMode ? 'Désactiver' : 'Activer'} Mode Maintenance
          </Button>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      }
    >
      {/* Statistiques de maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {maintenanceStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="github-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gh-fg-muted mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gh-fg-default">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    stat.variant === 'success' ? 'bg-gh-success-subtle' :
                    stat.variant === 'info' ? 'bg-gh-accent-subtle' :
                    stat.variant === 'warning' ? 'bg-gh-attention-subtle' :
                    stat.variant === 'secondary' ? 'bg-gh-canvas-subtle' :
                    'bg-gh-danger-subtle'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      stat.variant === 'success' ? 'text-gh-success-fg' :
                      stat.variant === 'info' ? 'text-gh-accent-fg' :
                      stat.variant === 'warning' ? 'text-gh-attention-fg' :
                      stat.variant === 'secondary' ? 'text-gh-fg-muted' :
                      'text-gh-danger-fg'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerte mode maintenance */}
      {maintenanceMode && (
        <div className="mb-6">
          <Card className="github-card border-gh-attention-emphasis bg-gh-attention-subtle/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-gh-attention-fg" />
                <div>
                  <h3 className="text-sm font-medium text-gh-fg-default">
                    Mode Maintenance Activé
                  </h3>
                  <p className="text-sm text-gh-fg-muted">
                    Le système est actuellement en mode maintenance. Les utilisateurs ne peuvent pas se connecter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="Rechercher une tâche de maintenance (nom, description, type)..."
        />
      </div>

      {/* Liste des tâches de maintenance */}
      <Card className="github-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Tâches de Maintenance ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                Aucune tâche trouvée
              </h3>
              <p className="text-gh-fg-muted">
                {searchQuery ? 'Aucune tâche ne correspond à votre recherche.' : 'Aucune tâche de maintenance configurée.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                const TaskIcon = task.icon;
                return (
                  <div key={task.id} className="github-item">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            task.status === 'completed' ? 'bg-gh-success-subtle' :
                            task.status === 'running' ? 'bg-gh-accent-subtle' :
                            task.status === 'scheduled' ? 'bg-gh-attention-subtle' :
                            task.status === 'failed' ? 'bg-gh-danger-subtle' :
                            'bg-gh-canvas-subtle'
                          }`}>
                            <TaskIcon className={`w-5 h-5 ${
                              task.status === 'completed' ? 'text-gh-success-fg' :
                              task.status === 'running' ? 'text-gh-accent-fg' :
                              task.status === 'scheduled' ? 'text-gh-attention-fg' :
                              task.status === 'failed' ? 'text-gh-danger-fg' :
                              'text-gh-fg-muted'
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gh-fg-default truncate">
                              {task.name}
                            </p>
                            <Badge variant={getStatusColor(task.status) as any}>
                              <StatusIcon className={`w-3 h-3 mr-1 ${
                                task.status === 'running' ? 'animate-spin' : ''
                              }`} />
                              {getStatusText(task.status)}
                            </Badge>
                            <Badge variant={getTypeColor(task.type) as any}>
                              {task.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gh-fg-muted truncate mb-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gh-fg-muted">
                            <span>Durée: {task.duration}</span>
                            <span>Dernière: {new Date(task.lastRun).toLocaleString()}</span>
                            <span>Prochaine: {new Date(task.nextRun).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleConfigureTask(task.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        {task.status === 'running' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStopTask(task.id)}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Arrêter
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleRunTask(task.id)}
                            disabled={task.status === 'running'}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Exécuter
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default MaintenancePage;
