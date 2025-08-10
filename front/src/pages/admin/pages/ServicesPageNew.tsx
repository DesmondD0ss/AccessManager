import React, { useState } from 'react';
import { Settings, Play, Square, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { EmptyState } from '../../../components/ui/EmptyState';

const ServicesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const serviceStats = [
    {
      title: 'Services Actifs',
      value: '12',
      icon: CheckCircle,
      variant: 'success' as const
    },
    {
      title: 'Services Arrêtés',
      value: '3',
      icon: XCircle,
      variant: 'error' as const
    },
    {
      title: 'En Maintenance',
      value: '1',
      icon: AlertTriangle,
      variant: 'warning' as const
    },
    {
      title: 'CPU Total',
      value: '45%',
      icon: Settings,
      variant: 'info' as const
    }
  ];

  const services = [
    {
      id: 1,
      name: 'Authentication Service',
      description: 'Service d\'authentification et autorisation',
      status: 'running',
      port: 3001,
      cpu: '12%',
      memory: '256MB',
      uptime: '5d 12h 30m',
      version: '1.2.3'
    },
    {
      id: 2,
      name: 'Database Service',
      description: 'Service de base de données PostgreSQL',
      status: 'running',
      port: 5432,
      cpu: '8%',
      memory: '512MB',
      uptime: '5d 12h 30m',
      version: '13.8'
    },
    {
      id: 3,
      name: 'Network Monitor',
      description: 'Surveillance du trafic réseau',
      status: 'stopped',
      port: 8080,
      cpu: '0%',
      memory: '0MB',
      uptime: '0m',
      version: '2.1.0'
    },
    {
      id: 4,
      name: 'Backup Service',
      description: 'Service de sauvegarde automatique',
      status: 'maintenance',
      port: 9000,
      cpu: '5%',
      memory: '128MB',
      uptime: '2h 15m',
      version: '1.0.5'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleStartService = (id: number) => {
    console.log('Démarrer le service:', id);
  };

  const handleStopService = (id: number) => {
    console.log('Arrêter le service:', id);
  };

  const handleRestartService = (id: number) => {
    console.log('Redémarrer le service:', id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return CheckCircle;
      case 'stopped':
        return XCircle;
      case 'maintenance':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'En cours';
      case 'stopped':
        return 'Arrêté';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Inconnu';
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Gestion des Services"
      description="Surveillez et gérez l'état des services système"
      actions={
        <div className="flex items-center gap-3">
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
      {/* Statistiques des services */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {serviceStats.map((stat, index) => {
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
                    'bg-gh-danger-subtle'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      stat.variant === 'success' ? 'text-gh-success-fg' :
                      stat.variant === 'info' ? 'text-gh-accent-fg' :
                      stat.variant === 'warning' ? 'text-gh-attention-fg' :
                      'text-gh-danger-fg'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="Rechercher un service (nom, description)..."
        />
      </div>

      {/* Liste des services */}
      <Card className="github-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Services Système ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                Aucun service trouvé
              </h3>
              <p className="text-gh-fg-muted">
                Aucun service ne correspond à votre recherche.
              </p>
            </div>
          ) : filteredServices.length === 0 ? (
            <EmptyState
              icon="settings"
              title="Services en cours de découverte"
              description="La découverte automatique des services système est en cours. Cette section affichera bientôt tous les services disponibles."
              action={{
                label: "Découvrir les services",
                onClick: handleRefresh,
                variant: "primary"
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => {
                const StatusIcon = getStatusIcon(service.status);
                return (
                  <div key={service.id} className="github-item">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            service.status === 'running' ? 'bg-gh-success-subtle' :
                            service.status === 'stopped' ? 'bg-gh-danger-subtle' :
                            'bg-gh-attention-subtle'
                          }`}>
                            <StatusIcon className={`w-5 h-5 ${
                              service.status === 'running' ? 'text-gh-success-fg' :
                              service.status === 'stopped' ? 'text-gh-danger-fg' :
                              'text-gh-attention-fg'
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gh-fg-default truncate">
                              {service.name}
                            </p>
                            <Badge variant={getStatusColor(service.status) as any}>
                              {getStatusText(service.status)}
                            </Badge>
                            <span className="text-xs text-gh-fg-muted">
                              v{service.version}
                            </span>
                          </div>
                          <p className="text-sm text-gh-fg-muted truncate mb-2">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gh-fg-muted">
                            <span>Port: {service.port}</span>
                            <span>CPU: {service.cpu}</span>
                            <span>RAM: {service.memory}</span>
                            <span>Uptime: {service.uptime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {service.status === 'stopped' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartService(service.id)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Démarrer
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRestartService(service.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleStopService(service.id)}
                            >
                              <Square className="w-4 h-4 mr-1" />
                              Arrêter
                            </Button>
                          </>
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

export default ServicesPage;
