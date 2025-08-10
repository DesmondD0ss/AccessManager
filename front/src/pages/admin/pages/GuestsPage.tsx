import React, { useState } from 'react';
import { Key, User, Clock, Plus, Eye, Ban, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import PageLayout from '../../../components/ui/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';

const GuestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const guestStats = [
    {
      title: 'Invités actifs',
      value: '23',
      icon: User,
      variant: 'success' as const
    },
    {
      title: 'Codes générés aujourd\'hui',
      value: '8',
      icon: Key,
      variant: 'info' as const
    },
    {
      title: 'Sessions en cours',
      value: '15',
      icon: Clock,
      variant: 'warning' as const
    },
    {
      title: 'Codes expirés',
      value: '4',
      icon: AlertTriangle,
      variant: 'error' as const
    }
  ];

  const activeGuests = [
    {
      id: 1,
      guestCode: 'GUEST-2024-001',
      name: 'Jean Dupont',
      email: 'jean.dupont@visitor.com',
      sponsor: 'marie.martin@company.com',
      createdAt: '2024-01-20 09:00:00',
      expiresAt: '2024-01-20 18:00:00',
      status: 'active',
      usage: '2.3 GB',
      lastActivity: '2024-01-20 14:30:00',
      ipAddress: '192.168.1.156'
    },
    {
      id: 2,
      guestCode: 'GUEST-2024-002',
      name: 'Alice Johnson',
      email: 'alice.johnson@partner.com',
      sponsor: 'paul.bernard@company.com',
      createdAt: '2024-01-20 10:15:00',
      expiresAt: '2024-01-21 17:00:00',
      status: 'active',
      usage: '1.8 GB',
      lastActivity: '2024-01-20 14:25:00',
      ipAddress: '192.168.1.178'
    },
    {
      id: 3,
      guestCode: 'GUEST-2024-003',
      name: 'Mark Wilson',
      email: 'mark.wilson@consultant.com',
      sponsor: 'sophie.dubois@company.com',
      createdAt: '2024-01-20 11:30:00',
      expiresAt: '2024-01-20 16:00:00',
      status: 'expired',
      usage: '450 MB',
      lastActivity: '2024-01-20 15:45:00',
      ipAddress: '192.168.1.189'
    }
  ];

  const pendingRequests = [
    {
      id: 1,
      requesterName: 'Lisa Chen',
      requesterEmail: 'lisa.chen@company.com',
      guestName: 'Robert Smith',
      guestEmail: 'robert.smith@external.com',
      requestedAt: '2024-01-20 08:30:00',
      validUntil: '2024-01-22 18:00:00',
      reason: 'Réunion projet Q1'
    },
    {
      id: 2,
      requesterName: 'Tom Johnson',
      requesterEmail: 'tom.johnson@company.com',
      guestName: 'Emma Davis',
      guestEmail: 'emma.davis@contractor.com',
      requestedAt: '2024-01-20 10:45:00',
      validUntil: '2024-01-21 17:00:00',
      reason: 'Formation technique'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleGenerateCode = () => {
    console.log('Générer un nouveau code invité');
  };

  const handleApproveRequest = (id: number) => {
    console.log('Approuver la demande:', id);
  };

  const handleRejectRequest = (id: number) => {
    console.log('Rejeter la demande:', id);
  };

  const handleRevokeAccess = (id: number) => {
    console.log('Révoquer l\'accès:', id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'expired':
        return XCircle;
      case 'suspended':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const filteredGuests = activeGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.guestCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = pendingRequests.filter(request =>
    request.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.guestEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout
      title="Gestion des Invités"
      description="Gérez les accès invités, codes d'accès et demandes d'autorisation"
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
          <Button onClick={handleGenerateCode}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Code
          </Button>
        </div>
      }
    >
      {/* Statistiques des invités */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {guestStats.map((stat, index) => {
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
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'active'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Invités Actifs
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'requests'
                ? 'bg-gh-canvas-default text-gh-fg-default shadow-sm'
                : 'text-gh-fg-muted hover:text-gh-fg-default hover:bg-gh-canvas-default/50'
            }`}
          >
            Demandes en Attente
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder={
            activeTab === 'active' 
              ? "Rechercher un invité (nom, email, code)..."
              : "Rechercher une demande..."
          }
        />
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'active' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Invités Actifs ({filteredGuests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredGuests.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucun invité trouvé
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucun invité ne correspond à votre recherche.' : 'Aucun invité actif pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGuests.map((guest) => {
                  const StatusIcon = getStatusIcon(guest.status);
                  return (
                    <div key={guest.id} className="github-item">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gh-accent-subtle rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gh-accent-fg" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gh-fg-default truncate">
                                {guest.name}
                              </p>
                              <Badge variant={getStatusColor(guest.status) as any}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {guest.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gh-fg-muted truncate">
                              {guest.email}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gh-fg-muted">
                              <span>Code: {guest.guestCode}</span>
                              <span>Usage: {guest.usage}</span>
                              <span>IP: {guest.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleRevokeAccess(guest.id)}
                          >
                            <Ban className="w-4 h-4" />
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

      {activeTab === 'requests' && (
        <Card className="github-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Demandes en Attente ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gh-fg-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gh-fg-default mb-2">
                  Aucune demande en attente
                </h3>
                <p className="text-gh-fg-muted">
                  {searchQuery ? 'Aucune demande ne correspond à votre recherche.' : 'Toutes les demandes ont été traitées.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="github-item">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gh-attention-subtle rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gh-attention-fg" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gh-fg-default">
                              {request.guestName}
                            </p>
                            <Badge variant="warning">En attente</Badge>
                          </div>
                          <p className="text-sm text-gh-fg-muted">
                            {request.guestEmail}
                          </p>
                          <div className="mt-2 text-xs text-gh-fg-muted">
                            <p>Demandé par: {request.requesterName}</p>
                            <p>Raison: {request.reason}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
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
    </PageLayout>
  );
};

export default GuestsPage;
