import React, { useState } from 'react';
import { UserCheck, Monitor, Clock, MapPin, Ban, Eye, RefreshCw, LogOut, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';

const SessionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const sessionStats = [
    {
      title: 'Sessions actives',
      value: '47',
      icon: UserCheck,
      variant: 'success' as const
    },
    {
      title: 'Utilisateurs en ligne',
      value: '42',
      icon: Monitor,
      variant: 'info' as const
    },
    {
      title: 'Sessions suspicieuses',
      value: '3',
      icon: AlertTriangle,
      variant: 'warning' as const
    },
    {
      title: 'Durée moyenne',
      value: '2h 34m',
      icon: Clock,
      variant: 'secondary' as const
    }
  ];

  const activeSessions = [
    {
      id: 1,
      user: 'jean.dupont@company.com',
      name: 'Jean Dupont',
      ipAddress: '192.168.1.156',
      location: 'Paris, France',
      device: 'Chrome/Windows',
      startTime: '2024-01-20 08:30:00',
      lastActivity: '2024-01-20 14:45:00',
      duration: '6h 15m',
      status: 'active',
      actions: 156
    },
    {
      id: 2,
      user: 'alice.martin@company.com',
      name: 'Alice Martin',
      ipAddress: '192.168.1.178',
      location: 'Lyon, France',
      device: 'Firefox/macOS',
      startTime: '2024-01-20 09:15:00',
      lastActivity: '2024-01-20 14:42:00',
      duration: '5h 27m',
      status: 'active',
      actions: 89
    },
    {
      id: 3,
      user: 'paul.bernard@company.com',
      name: 'Paul Bernard',
      ipAddress: '10.0.0.45',
      location: 'Marseille, France',
      device: 'Safari/iOS',
      startTime: '2024-01-20 10:00:00',
      lastActivity: '2024-01-20 14:20:00',
      duration: '4h 20m',
      status: 'suspicious',
      actions: 234
    }
  ];

  const suspiciousSessions = [
    {
      id: 4,
      user: 'unknown.user@external.com',
      name: 'Utilisateur Inconnu',
      ipAddress: '203.0.113.42',
      location: 'Beijing, China',
      device: 'Chrome/Linux',
      startTime: '2024-01-20 13:30:00',
      lastActivity: '2024-01-20 14:30:00',
      duration: '1h 00m',
      status: 'blocked',
      actions: 12,
      reason: 'Géolocalisation inhabituelle'
    },
    {
      id: 5,
      user: 'test.account@company.com',
      name: 'Compte Test',
      ipAddress: '192.168.1.200',
      location: 'Paris, France',
      device: 'Chrome/Windows',
      startTime: '2024-01-20 14:00:00',
      lastActivity: '2024-01-20 14:35:00',
      duration: '35m',
      status: 'suspicious',
      actions: 89,
      reason: 'Trop de tentatives de connexion'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleTerminateSession = (id: number) => {
    console.log('Terminer la session:', id);
  };

  const handleViewDetails = (id: number) => {
    console.log('Voir les détails:', id);
  };

  const handleBlockSession = (id: number) => {
    console.log('Bloquer la session:', id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspicious':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'suspicious':
        return AlertTriangle;
      case 'blocked':
        return Ban;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspicious':
        return 'Suspecte';
      case 'blocked':
        return 'Bloquée';
      default:
        return 'Inconnue';
    }
  };

  const filteredActiveSessions = activeSessions.filter(session =>
    session.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuspiciousSessions = suspiciousSessions.filter(session =>
    session.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Gestion des Sessions"
      description="Surveillez et gérez les sessions utilisateur actives et suspectes"
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
      {/* Statistiques des sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {sessionStats.map((stat, index) => {
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
                    'bg-gh-canvas-subtle'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      stat.variant === 'success' ? 'text-gh-success-fg' :
                      stat.variant === 'info' ? 'text-gh-accent-fg' :
                      stat.variant === 'warning' ? 'text-gh-attention-fg' :
                      'text-gh-fg-muted'
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
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'active'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Sessions Actives
          </button>
          <button
            onClick={() => setActiveTab('suspicious')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'suspicious'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Sessions Suspectes
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder={
            activeTab === 'active'
              ? "Rechercher dans les sessions actives (utilisateur, IP, localisation)..."
              : "Rechercher dans les sessions suspectes..."
          }
        />
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'active' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sessions Actives ({filteredActiveSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActiveSessions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucune session trouvée
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucune session ne correspond à votre recherche.' : 'Aucune session active pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActiveSessions.map((session) => {
                  const StatusIcon = getStatusIcon(session.status);
                  return (
                    <div key={session.id} className="github-item">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              session.status === 'active' ? 'bg-gh-success-subtle' :
                              session.status === 'suspicious' ? 'bg-gh-attention-subtle' :
                              'bg-gh-danger-subtle'
                            }`}>
                              <StatusIcon className={`w-5 h-5 ${
                                session.status === 'active' ? 'text-gh-success-fg' :
                                session.status === 'suspicious' ? 'text-gh-attention-fg' :
                                'text-gh-danger-fg'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gh-fg-default truncate">
                                {session.name}
                              </p>
                              <Badge variant={getStatusColor(session.status) as any}>
                                {getStatusText(session.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gh-fg-muted truncate">
                              {session.user}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gh-fg-muted">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.location}
                              </span>
                              <span>IP: {session.ipAddress}</span>
                              <span>Device: {session.device}</span>
                              <span>Durée: {session.duration}</span>
                              <span>Actions: {session.actions}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetails(session.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                          >
                            <LogOut className="w-4 h-4" />
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

      {activeTab === 'suspicious' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Sessions Suspectes ({filteredSuspiciousSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSuspiciousSessions.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucune session suspecte
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucune session suspecte ne correspond à votre recherche.' : 'Aucune activité suspecte détectée.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuspiciousSessions.map((session) => {
                  const StatusIcon = getStatusIcon(session.status);
                  return (
                    <div key={session.id} className="github-item">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              session.status === 'blocked' ? 'bg-gh-danger-subtle' : 'bg-gh-attention-subtle'
                            }`}>
                              <StatusIcon className={`w-5 h-5 ${
                                session.status === 'blocked' ? 'text-gh-danger-fg' : 'text-gh-attention-fg'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gh-fg-default truncate">
                                {session.name}
                              </p>
                              <Badge variant={getStatusColor(session.status) as any}>
                                {getStatusText(session.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gh-fg-muted truncate mb-1">
                              {session.user}
                            </p>
                            <p className="text-sm text-gh-attention-fg font-medium mb-2">
                              ⚠️ {session.reason}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gh-fg-muted">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.location}
                              </span>
                              <span>IP: {session.ipAddress}</span>
                              <span>Device: {session.device}</span>
                              <span>Durée: {session.duration}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDetails(session.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {session.status !== 'blocked' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleBlockSession(session.id)}
                            >
                              <Ban className="w-4 h-4" />
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
      )}
    </PageLayout>
  );
};

export default SessionsPage;
