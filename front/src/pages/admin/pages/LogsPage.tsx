import React, { useState } from 'react';
import { FileText, Download, RefreshCw, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { EmptyState } from '../../../components/ui/EmptyState';

const LogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const logStats = [
    {
      title: 'Logs Système',
      value: '2,456',
      icon: FileText,
      variant: 'info' as const
    },
    {
      title: 'Erreurs',
      value: '23',
      icon: XCircle,
      variant: 'error' as const
    },
    {
      title: 'Avertissements',
      value: '156',
      icon: AlertTriangle,
      variant: 'warning' as const
    },
    {
      title: 'Succès',
      value: '2,277',
      icon: CheckCircle,
      variant: 'success' as const
    }
  ];

  const sampleLogs = [
    {
      id: 1,
      timestamp: '2024-01-20T14:30:25.123Z',
      level: 'INFO',
      source: 'auth-service',
      message: 'User successfully authenticated: jean.dupont@company.com',
      category: 'authentication'
    },
    {
      id: 2,
      timestamp: '2024-01-20T14:29:18.456Z',
      level: 'WARN',
      source: 'network-service',
      message: 'High bandwidth usage detected from IP 192.168.1.156',
      category: 'network'
    },
    {
      id: 3,
      timestamp: '2024-01-20T14:28:45.789Z',
      level: 'ERROR',
      source: 'database',
      message: 'Connection timeout while executing query: SELECT * FROM users',
      category: 'database'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleDownloadLogs = () => {
    console.log('Télécharger les logs');
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warn':
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return XCircle;
      case 'warn':
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return CheckCircle;
    }
  };

  const filteredLogs = sampleLogs.filter(log =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Journaux Système"
      description="Consultez et analysez les logs système, erreurs et événements"
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleDownloadLogs}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
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
      {/* Statistiques des logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {logStats.map((stat, index) => {
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

      {/* Onglets */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gh-canvas-subtle rounded-lg p-1">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'system'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Logs Système
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'application'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Logs Application
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'security'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Logs Sécurité
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="Rechercher dans les logs (message, source, niveau)..."
        />
      </div>

      {/* Liste des logs */}
      <Card className="github-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Entrées de Journal ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                Aucun log trouvé
              </h3>
              <p className="text-gh-fg-muted">
                Aucune entrée ne correspond à votre recherche.
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon="file"
              title="Collecte des logs en cours"
              description="Les logs système sont en cours de collecte et d'indexation. Cette section affichera bientôt l'historique complet des événements système."
              action={{
                label: "Actualiser les logs",
                onClick: handleRefresh
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const LevelIcon = getLevelIcon(log.level);
                return (
                  <div key={log.id} className="github-item">
                    <div className="flex items-start space-x-4 p-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          log.level === 'ERROR' ? 'bg-gh-danger-subtle' :
                          log.level === 'WARN' ? 'bg-gh-attention-subtle' :
                          log.level === 'INFO' ? 'bg-gh-accent-subtle' :
                          'bg-gh-canvas-subtle'
                        }`}>
                          <LevelIcon className={`w-4 h-4 ${
                            log.level === 'ERROR' ? 'text-gh-danger-fg' :
                            log.level === 'WARN' ? 'text-gh-attention-fg' :
                            log.level === 'INFO' ? 'text-gh-accent-fg' :
                            'text-gh-fg-muted'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getLevelColor(log.level) as any}>
                            {log.level}
                          </Badge>
                          <span className="text-xs text-gh-fg-muted">
                            {log.source}
                          </span>
                          <span className="text-xs text-gh-fg-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gh-fg-default font-mono bg-gh-canvas-subtle p-2 rounded border">
                          {log.message}
                        </p>
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

export default LogsPage;
