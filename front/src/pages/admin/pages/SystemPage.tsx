import React, { useState } from 'react';
import { Server, HardDrive, Cpu, MemoryStick, RefreshCw, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

const SystemPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const systemStats = [
    {
      title: 'CPU Usage',
      value: '45%',
      icon: Cpu,
      variant: 'success' as const,
      change: '+2%'
    },
    {
      title: 'Memory Usage',
      value: '8.2/16 GB',
      icon: MemoryStick,
      variant: 'warning' as const,
      change: '+0.5GB'
    },
    {
      title: 'Disk Usage',
      value: '120/500 GB',
      icon: HardDrive,
      variant: 'info' as const,
      change: '+2GB'
    },
    {
      title: 'Active Processes',
      value: '156',
      icon: Activity,
      variant: 'success' as const,
      change: '+12'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <PageLayout
      title="Surveillance Système"
      description="Surveillez les performances et l'état du système en temps réel"
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
      {/* Statistiques système */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {systemStats.map((stat, index) => {
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
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-3 h-3 text-gh-success-fg mr-1" />
                      <span className="text-xs text-gh-success-fg">
                        {stat.change}
                      </span>
                    </div>
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

      {/* État temporaire - en attente d'implémentation complète */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Processus Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="settings"
              title="Surveillance des processus"
              description="La surveillance détaillée des processus système sera bientôt disponible."
              action={{
                label: "Configurer la surveillance",
                onClick: handleRefresh
              }}
            />
          </CardContent>
        </Card>

        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Alertes Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="alert"
              title="Système d'alertes"
              description="Les alertes système automatiques et notifications seront configurées prochainement."
              action={{
                label: "Configurer les alertes",
                onClick: handleRefresh
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de performance (placeholder) */}
      <div className="mt-8">
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Graphiques de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="plus"
              title="Graphiques temps réel"
              description="Les graphiques de performance en temps réel (CPU, mémoire, réseau) seront intégrés dans cette section."
              action={{
                label: "Activer la surveillance",
                onClick: handleRefresh
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SystemPage;
