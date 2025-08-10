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
      guestEmail: 'robert.smith@client.com',
      purpose: 'Réunion projet Q1 2024',
      requestedDuration: '8 heures',
      requestedAt: '2024-01-20 13:15:00',
      status: 'pending'
    },
    {
      id: 2,
      requesterName: 'Thomas Leroy',
      requesterEmail: 'thomas.leroy@company.com',
      guestName: 'Emma Davis',
      guestEmail: 'emma.davis@supplier.com',
      purpose: 'Formation technique',
      requestedDuration: '2 jours',
      requestedAt: '2024-01-20 12:45:00',
      status: 'pending'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'pending': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const filteredGuests = activeGuests.filter(guest => {
    if (!searchQuery) return true;
    return guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           guest.guestCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const tabs = [
    { id: 'active', label: 'Invités actifs', count: activeGuests.length },
    { id: 'expired', label: 'Expirés', count: 5 },
    { id: 'pending', label: 'En attente', count: pendingRequests.length },
    { id: 'blocked', label: 'Bloqués', count: 2 }
  ];

  return (
    <PageLayout
      title="Gestion des invités"
      description="Gestion des comptes invités temporaires et des demandes d'accès"
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
            Nouveau code invité
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {guestStats.map((stat, index) => {
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
                <Badge variant="default" size="sm">{tab.count}</Badge>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Rechercher par nom, email ou code invité..."
                  onSearch={handleSearch}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <select className="input w-40">
                  <option>Tous les sponsors</option>
                  <option>marie.martin@company.com</option>
                  <option>paul.bernard@company.com</option>
                </select>
                <select className="input w-32">
                  <option>Toutes les dates</option>
                  <option>Aujourd'hui</option>
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Invités actifs ({filteredGuests.length})</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">Sélectionner tout</Button>
                  <Button size="sm" variant="secondary">Actions groupées</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredGuests.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-fg-muted mx-auto mb-4" />
                  <p className="text-fg-muted">Aucun invité trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGuests.map((guest) => (
                    <div key={guest.id} className="flex items-center justify-between p-4 bg-canvas-subtle rounded-lg">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" className="rounded" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-fg-default">{guest.name}</h4>
                            <Badge variant={getStatusColor(guest.status)} size="sm">
                              {guest.status}
                            </Badge>
                            <span className="text-xs text-fg-muted font-mono">
                              {guest.guestCode}
                            </span>
                          </div>
                          <p className="text-sm text-fg-muted mb-1">{guest.email}</p>
                          <div className="flex items-center gap-4 text-xs text-fg-muted">
                            <span>Sponsor: {guest.sponsor}</span>
                            <span>Usage: {guest.usage}</span>
                            <span>IP: {guest.ipAddress}</span>
                            <span>
                              Expire: {new Date(guest.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Demandes en attente ({pendingRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-canvas-subtle rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-fg-default">
                          {request.guestName}
                        </h4>
                        <Badge variant="warning" size="sm">En attente</Badge>
                      </div>
                      <p className="text-sm text-fg-muted mb-1">
                        Email: {request.guestEmail}
                      </p>
                      <p className="text-sm text-fg-muted mb-1">
                        Demandé par: {request.requesterName}
                      </p>
                      <p className="text-sm text-fg-default mb-2">
                        Motif: {request.purpose}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-fg-muted">
                        <span>Durée: {request.requestedDuration}</span>
                        <span>
                          Demandé le: {new Date(request.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <CheckCircle className="w-4 h-4 text-success-fg" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <XCircle className="w-4 h-4 text-danger-fg" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(activeTab === 'expired' || activeTab === 'blocked') && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-fg-muted mx-auto mb-4" />
              <p className="text-fg-muted">
                {activeTab === 'expired' ? 'Liste des invités expirés' : 'Liste des invités bloqués'}
              </p>
              <p className="text-sm text-fg-muted mt-2">Contenu à implémenter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default GuestsPage;
