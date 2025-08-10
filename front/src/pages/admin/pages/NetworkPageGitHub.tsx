import React, { useState } from 'react';
import { Network, Shield, AlertTriangle, CheckCircle, XCircle, Plus, Edit, Trash2, Lock, Unlock, RefreshCw, Eye } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';

const NetworkPageGitHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const networkStats = [
    {
      title: 'Règles actives',
      value: '12',
      icon: Shield,
      variant: 'success' as const
    },
    {
      title: 'IPs bloquées',
      value: '34',
      icon: XCircle,
      variant: 'error' as const
    },
    {
      title: 'Trafic autorisé',
      value: '98.2%',
      icon: CheckCircle,
      variant: 'success' as const
    },
    {
      title: 'Menaces détectées',
      value: '5',
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
      description: 'Blocage du trafic peer-to-peer'
    }
  ];

  const blockedIPs = [
    {
      ip: '203.45.67.89',
      reason: 'Tentatives de brute force',
      blocked_at: '2024-01-20 12:30:15',
      attempts: 45,
      status: 'permanent'
    },
    {
      ip: '185.234.12.56',
      reason: 'Activité malveillante détectée',
      blocked_at: '2024-01-20 11:15:22',
      attempts: 12,
      status: 'temporary'
    },
    {
      ip: '92.168.45.123',
      reason: 'Scan de ports',
      blocked_at: '2024-01-20 10:45:33',
      attempts: 8,
      status: 'permanent'
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getRuleTypeColor = (type: string) => {
    return type === 'allow' ? 'success' : 'error';
  };

  const getRuleStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getBlockStatusColor = (status: string) => {
    return status === 'permanent' ? 'error' : 'warning';
  };

  const filteredRules = networkRules.filter(rule => {
    if (!searchQuery) return true;
    return rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rule.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rule.destination.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tabs = [
    { id: 'rules', label: 'Règles de filtrage', count: networkRules.length },
    { id: 'blocked', label: 'IPs bloquées', count: blockedIPs.length },
    { id: 'monitoring', label: 'Surveillance', count: 0 },
    { id: 'settings', label: 'Configuration', count: 0 }
  ];

  return (
    <PageLayout
      title="Gestion réseau"
      description="Configuration du filtrage réseau et surveillance du trafic"
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
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle règle
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {networkStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-fg-muted">{stat.title}</p>
                      <p className="text-2xl font-semibold text-fg-default">{stat.value}</p>
                    </div>
                    <div className="p-2 bg-canvas-subtle rounded-lg">
                      <Icon className="w-6 h-6 text-fg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-canvas-subtle rounded-lg">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center
                  ${isActive 
                    ? 'bg-canvas-default text-fg-default shadow-sm' 
                    : 'text-fg-muted hover:text-fg-default hover:bg-canvas-default/50'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && <Badge variant="default" size="sm">{tab.count}</Badge>}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <SearchInput
              placeholder="Rechercher par nom de règle, source, destination..."
              onSearch={handleSearch}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Network Rules Tab */}
        {activeTab === 'rules' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Règles de filtrage ({filteredRules.length})</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Importer règles</Button>
                  <Button size="sm" variant="secondary">Exporter</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-canvas-subtle rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-canvas-default rounded-lg">
                        {rule.type === 'allow' ? 
                          <CheckCircle className="w-5 h-5 text-success-fg" /> : 
                          <XCircle className="w-5 h-5 text-danger-fg" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-fg-default">{rule.name}</h4>
                          <Badge variant={getRuleTypeColor(rule.type)} size="sm">
                            {rule.type.toUpperCase()}
                          </Badge>
                          <Badge variant={getRuleStatusColor(rule.status)} size="sm">
                            {rule.status}
                          </Badge>
                          <span className="text-xs text-fg-muted">Priorité: {rule.priority}</span>
                        </div>
                        <p className="text-sm text-fg-muted mb-2">{rule.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-fg-muted">
                          <div>
                            <span className="font-medium">Source:</span> {rule.source}
                          </div>
                          <div>
                            <span className="font-medium">Destination:</span> {rule.destination}
                          </div>
                          <div>
                            <span className="font-medium">Ports:</span> {rule.ports} ({rule.protocol})
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        {rule.status === 'active' ? 
                          <Lock className="w-4 h-4" /> : 
                          <Unlock className="w-4 h-4" />
                        }
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
        )}

        {/* Blocked IPs Tab */}
        {activeTab === 'blocked' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Adresses IP bloquées ({blockedIPs.length})</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Débloquer sélection</Button>
                  <Button size="sm" variant="secondary">Exporter liste</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockedIPs.map((blocked, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-canvas-subtle rounded-lg">
                    <div className="flex items-center gap-4">
                      <input type="checkbox" className="rounded" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-fg-default font-mono">{blocked.ip}</h4>
                          <Badge variant={getBlockStatusColor(blocked.status)} size="sm">
                            {blocked.status}
                          </Badge>
                          <span className="text-xs text-fg-muted">
                            {blocked.attempts} tentatives
                          </span>
                        </div>
                        <p className="text-sm text-fg-muted mb-1">{blocked.reason}</p>
                        <p className="text-xs text-fg-muted">
                          Bloquée le: {new Date(blocked.blocked_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Unlock className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other tabs - placeholder content */}
        {(activeTab === 'monitoring' || activeTab === 'settings') && (
          <Card>
            <CardContent className="p-8 text-center">
              <Network className="w-12 h-12 text-fg-muted mx-auto mb-4" />
              <p className="text-fg-muted">
                {activeTab === 'monitoring' ? 'Surveillance réseau en temps réel' : 'Configuration réseau avancée'}
              </p>
              <p className="text-sm text-fg-muted mt-2">Contenu à implémenter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default NetworkPageGitHub;
