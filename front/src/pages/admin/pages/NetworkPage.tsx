import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus, Edit, Trash2, Globe, Lock, Unlock, RefreshCw, Activity } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';

const NetworkPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const networkStats = [
    {
      title: 'Règles Actives',
      value: '24',
      icon: Shield,
      variant: 'success' as const
    },
    {
      title: 'Trafic Bloqué',
      value: '156 MB',
      icon: XCircle,
      variant: 'error' as const
    },
    {
      title: 'Connexions Actives',
      value: '89',
      icon: Activity,
      variant: 'info' as const
    },
    {
      title: 'Alertes',
      value: '3',
      icon: AlertTriangle,
      variant: 'warning' as const
    }
  ];

  const networkRules = [
    {
      id: 1,
      name: 'Accès Web Standard',
      type: 'allow',
      source: '192.168.1.0/24',
      destination: '*',
      ports: '80, 443',
      protocol: 'TCP',
      status: 'active',
      priority: 1,
      description: 'Accès web standard pour tous les utilisateurs'
    },
    {
      id: 2,
      name: 'Blocage Réseaux Sociaux',
      type: 'deny',
      source: '192.168.1.0/24',
      destination: 'facebook.com, twitter.com, instagram.com',
      ports: '80, 443',
      protocol: 'TCP',
      status: 'active',
      priority: 2,
      description: 'Blocage des principaux réseaux sociaux'
    },
    {
      id: 3,
      name: 'Accès SSH Admin',
      type: 'allow',
      source: '10.0.0.0/8',
      destination: 'servers.local',
      ports: '22',
      protocol: 'TCP',
      status: 'active',
      priority: 3,
      description: 'Accès SSH pour les administrateurs'
    },
    {
      id: 4,
      name: 'Blocage P2P',
      type: 'deny',
      source: '*',
      destination: '*',
      ports: '6881-6889, 1337',
      protocol: 'TCP/UDP',
      status: 'inactive',
      priority: 4,
      description: 'Blocage du trafic P2P'
    }
  ];

  const connectionLogs = [
    {
      id: 1,
      timestamp: '2024-01-20 14:30:25',
      source: '192.168.1.156',
      destination: 'google.com:443',
      action: 'ALLOW',
      rule: 'Accès Web Standard',
      bytes: '2.3 MB',
      user: 'jean.dupont'
    },
    {
      id: 2,
      timestamp: '2024-01-20 14:29:18',
      source: '192.168.1.178',
      destination: 'facebook.com:443',
      action: 'DENY',
      rule: 'Blocage Réseaux Sociaux',
      bytes: '156 KB',
      user: 'alice.johnson'
    },
    {
      id: 3,
      timestamp: '2024-01-20 14:28:45',
      source: '10.0.0.15',
      destination: 'servers.local:22',
      action: 'ALLOW',
      rule: 'Accès SSH Admin',
      bytes: '45 KB',
      user: 'admin'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAddRule = () => {
    console.log('Ajouter une nouvelle règle');
  };

  const handleEditRule = (id: number) => {
    console.log('Modifier la règle:', id);
  };

  const handleDeleteRule = (id: number) => {
    console.log('Supprimer la règle:', id);
  };

  const handleToggleRule = (id: number) => {
    console.log('Basculer l\'état de la règle:', id);
  };

  const getRuleTypeColor = (type: string) => {
    return type === 'allow' ? 'success' : 'error';
  };

  const getRuleTypeIcon = (type: string) => {
    return type === 'allow' ? CheckCircle : XCircle;
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  const getActionColor = (action: string) => {
    return action === 'ALLOW' ? 'success' : 'error';
  };

  const filteredRules = networkRules.filter(rule =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = connectionLogs.filter(log =>
    log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.rule.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Gestion Réseau"
      description="Configurez les règles de sécurité réseau et surveillez le trafic"
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
          <Button onClick={handleAddRule}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Règle
          </Button>
        </div>
      }
    >
      {/* Statistiques réseau */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {networkStats.map((stat, index) => {
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
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'rules'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Règles de Sécurité
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'logs'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Journaux de Connexion
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder={
            activeTab === 'rules' 
              ? "Rechercher une règle (nom, source, destination)..."
              : "Rechercher dans les logs (IP, utilisateur, règle)..."
          }
        />
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'rules' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Règles de Sécurité ({filteredRules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRules.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucune règle trouvée
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucune règle ne correspond à votre recherche.' : 'Aucune règle de sécurité configurée.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRules.map((rule) => {
                  const TypeIcon = getRuleTypeIcon(rule.type);
                  return (
                    <div key={rule.id} className="github-item">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              rule.type === 'allow' ? 'bg-gh-success-subtle' : 'bg-gh-danger-subtle'
                            }`}>
                              <TypeIcon className={`w-5 h-5 ${
                                rule.type === 'allow' ? 'text-gh-success-fg' : 'text-gh-danger-fg'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gh-fg-default truncate">
                                {rule.name}
                              </p>
                              <Badge variant={getRuleTypeColor(rule.type) as any}>
                                {rule.type.toUpperCase()}
                              </Badge>
                              <Badge variant={getStatusColor(rule.status) as any}>
                                {rule.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gh-fg-muted truncate mb-2">
                              {rule.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gh-fg-muted">
                              <span>Source: {rule.source}</span>
                              <span>Dest: {rule.destination}</span>
                              <span>Ports: {rule.ports}</span>
                              <span>Priorité: {rule.priority}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleRule(rule.id)}
                          >
                            {rule.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditRule(rule.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Journaux de Connexion ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucun log trouvé
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucun log ne correspond à votre recherche.' : 'Aucune connexion enregistrée.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="github-item">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            log.action === 'ALLOW' ? 'bg-gh-success-subtle' : 'bg-gh-danger-subtle'
                          }`}>
                            <Globe className={`w-5 h-5 ${
                              log.action === 'ALLOW' ? 'text-gh-success-fg' : 'text-gh-danger-fg'
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gh-fg-default">
                              {log.source} → {log.destination}
                            </p>
                            <Badge variant={getActionColor(log.action) as any}>
                              {log.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-gh-fg-muted mb-2">
                            Règle: {log.rule}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gh-fg-muted">
                            <span>Utilisateur: {log.user}</span>
                            <span>Taille: {log.bytes}</span>
                            <span>Heure: {log.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
};

export default NetworkPage;
