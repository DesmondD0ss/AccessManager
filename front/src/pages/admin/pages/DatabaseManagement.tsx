import React, { useState } from 'react';
import { Database, HardDrive, Users, BarChart3, RefreshCw, Plus, Download, Upload, Trash2 } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { EmptyState } from '../../../components/ui/EmptyState';

const DatabaseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tables');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const dbStats = [
    {
      title: 'Tables',
      value: '12',
      icon: Database,
      variant: 'info' as const
    },
    {
      title: 'Enregistrements',
      value: '2,456',
      icon: BarChart3,
      variant: 'success' as const
    },
    {
      title: 'Taille DB',
      value: '156 MB',
      icon: HardDrive,
      variant: 'warning' as const
    },
    {
      title: 'Connexions',
      value: '8',
      icon: Users,
      variant: 'info' as const
    }
  ];

  const tables = [
    {
      id: 1,
      name: 'users',
      records: 1250,
      size: '45 MB',
      lastModified: '2024-01-20 14:30:00',
      status: 'healthy'
    },
    {
      id: 2,
      name: 'sessions',
      records: 856,
      size: '28 MB',
      lastModified: '2024-01-20 14:25:00',
      status: 'healthy'
    },
    {
      id: 3,
      name: 'logs',
      records: 15420,
      size: '78 MB',
      lastModified: '2024-01-20 14:32:00',
      status: 'warning'
    },
    {
      id: 4,
      name: 'network_rules',
      records: 25,
      size: '2 MB',
      lastModified: '2024-01-20 10:15:00',
      status: 'healthy'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleBackup = () => {
    console.log('Créer une sauvegarde');
  };

  const handleImport = () => {
    console.log('Importer des données');
  };

  const handleExport = () => {
    console.log('Exporter des données');
  };

  const handleOptimize = (tableId: number) => {
    console.log('Optimiser la table:', tableId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Saine';
      case 'warning':
        return 'Attention';
      case 'error':
        return 'Erreur';
      default:
        return 'Inconnu';
    }
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Gestion Base de Données"
      description="Administrez les tables, données et sauvegardes de la base de données"
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleImport}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
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
          <Button onClick={handleBackup}>
            <Plus className="w-4 h-4 mr-2" />
            Sauvegarde
          </Button>
        </div>
      }
    >
      {/* Statistiques de la base de données */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {dbStats.map((stat, index) => {
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
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tables'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Tables
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'backups'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Sauvegardes
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'maintenance'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Maintenance
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="Rechercher une table..."
        />
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'tables' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Tables de la Base de Données ({filteredTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTables.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucune table trouvée
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucune table ne correspond à votre recherche.' : 'Aucune table disponible.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTables.map((table) => (
                  <div key={table.id} className="github-item">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            table.status === 'healthy' ? 'bg-gh-success-subtle' :
                            table.status === 'warning' ? 'bg-gh-attention-subtle' :
                            'bg-gh-danger-subtle'
                          }`}>
                            <Database className={`w-5 h-5 ${
                              table.status === 'healthy' ? 'text-gh-success-fg' :
                              table.status === 'warning' ? 'text-gh-attention-fg' :
                              'text-gh-danger-fg'
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gh-fg-default font-mono">
                              {table.name}
                            </p>
                            <Badge variant={getStatusColor(table.status) as any}>
                              {getStatusText(table.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gh-fg-muted">
                            <span>{table.records} enregistrements</span>
                            <span>Taille: {table.size}</span>
                            <span>Modifié: {table.lastModified}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOptimize(table.id)}
                        >
                          Optimiser
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'backups' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Sauvegardes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="file"
              title="Sauvegardes automatiques"
              description="Le système de sauvegarde automatique sera bientôt configuré. Les sauvegardes périodiques et manuelles seront disponibles ici."
              action={{
                label: "Configurer les sauvegardes",
                onClick: handleBackup
              }}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'maintenance' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="settings"
              title="Outils de maintenance"
              description="Les outils de maintenance de la base de données (optimisation, nettoyage, réparation) seront bientôt disponibles."
              action={{
                label: "Accéder aux outils",
                onClick: handleRefresh
              }}
            />
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
};

export default DatabaseManagement;
