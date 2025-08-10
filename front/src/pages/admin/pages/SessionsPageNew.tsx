import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  Clock,
  Monitor,
  Smartphone,
  Laptop,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Download,
  MapPin,
  Wifi,
  TrendingUp,
  Server,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'admin' | 'user' | 'guest';
  startTime: string;
  lastActivity: string;
  duration: number; // in minutes
  ipAddress: string;
  location: string;
  country: string;
  device: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  status: 'active' | 'idle' | 'expired';
  dataTransfer: {
    upload: number; // in MB
    download: number; // in MB
  };
  riskScore: number;
  isOnline: boolean;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  idleSessions: number;
  expiredSessions: number;
  averageDuration: number;
  totalDataTransfer: number;
  uniqueUsers: number;
  peakConcurrentSessions: number;
  suspiciousActivities: number;
}

const SessionsPageNew: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    deviceType: '',
    userRole: ''
  });
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  const fetchSessionsData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Mock data - replace with real API calls
      const mockSessions: UserSession[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'Jean Dupont',
          userEmail: 'jean.dupont@example.com',
          userRole: 'admin',
          startTime: '2025-01-04T08:30:00Z',
          lastActivity: '2025-01-04T10:25:00Z',
          duration: 115,
          ipAddress: '192.168.1.100',
          location: 'Paris, France',
          country: 'France',
          device: 'Windows PC',
          browser: 'Chrome 120.0',
          os: 'Windows 11',
          deviceType: 'desktop',
          status: 'active',
          dataTransfer: { upload: 15.2, download: 245.8 },
          riskScore: 2.1,
          isOnline: true
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'Marie Martin',
          userEmail: 'marie.martin@example.com',
          userRole: 'user',
          startTime: '2025-01-04T09:15:00Z',
          lastActivity: '2025-01-04T10:20:00Z',
          duration: 65,
          ipAddress: '10.0.0.45',
          location: 'Lyon, France',
          country: 'France',
          device: 'iPhone 15',
          browser: 'Safari 17.0',
          os: 'iOS 17.2',
          deviceType: 'mobile',
          status: 'active',
          dataTransfer: { upload: 8.5, download: 123.4 },
          riskScore: 1.8,
          isOnline: true
        },
        {
          id: '3',
          userId: 'user-3',
          userName: 'Pierre Durand',
          userEmail: 'pierre.durand@example.com',
          userRole: 'user',
          startTime: '2025-01-04T07:45:00Z',
          lastActivity: '2025-01-04T09:30:00Z',
          duration: 105,
          ipAddress: '172.16.0.23',
          location: 'Marseille, France',
          country: 'France',
          device: 'MacBook Pro',
          browser: 'Firefox 121.0',
          os: 'macOS 14.2',
          deviceType: 'desktop',
          status: 'idle',
          dataTransfer: { upload: 22.1, download: 189.7 },
          riskScore: 3.2,
          isOnline: false
        },
        {
          id: '4',
          userId: 'user-4',
          userName: 'Sophie Bernard',
          userEmail: 'sophie.bernard@example.com',
          userRole: 'guest',
          startTime: '2025-01-04T06:00:00Z',
          lastActivity: '2025-01-04T08:15:00Z',
          duration: 135,
          ipAddress: '203.45.67.89',
          location: 'Unknown',
          country: 'Germany',
          device: 'Android Phone',
          browser: 'Chrome Mobile 120.0',
          os: 'Android 14',
          deviceType: 'mobile',
          status: 'expired',
          dataTransfer: { upload: 5.3, download: 67.2 },
          riskScore: 7.8,
          isOnline: false
        }
      ];

      const mockStats: SessionStats = {
        totalSessions: 156,
        activeSessions: 89,
        idleSessions: 34,
        expiredSessions: 33,
        averageDuration: 87,
        totalDataTransfer: 2.4,
        uniqueUsers: 134,
        peakConcurrentSessions: 102,
        suspiciousActivities: 5
      };

      setSessions(mockSessions);
      setStats(mockStats);

    } catch (error) {
      console.error('Error fetching sessions data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsData();
    const interval = setInterval(() => fetchSessionsData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchSessionsData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'idle':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'expired':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'idle':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Laptop className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'user':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'guest':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDataTransfer = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const handleTerminateSession = (sessionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir terminer cette session ?')) {
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    }
  };

  const handleBulkTerminate = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir terminer ${selectedSessions.length} session(s) ?`)) {
      setSessions(prev => prev.filter(session => !selectedSessions.includes(session.id)));
      setSelectedSessions([]);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
                         session.userEmail.toLowerCase().includes(filters.search.toLowerCase()) ||
                         session.ipAddress.includes(filters.search);
    const matchesStatus = !filters.status || session.status === filters.status;
    const matchesDeviceType = !filters.deviceType || session.deviceType === filters.deviceType;
    const matchesRole = !filters.userRole || session.userRole === filters.userRole;

    return matchesSearch && matchesStatus && matchesDeviceType && matchesRole;
  });

  if (loading && !sessions.length) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chargement des sessions</h3>
            <p className="text-slate-600">Récupération des données de session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sessions Utilisateurs</h1>
          <p className="text-slate-600">Surveillance et gestion des sessions actives</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchSessionsData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Sessions Actives</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.activeSessions}</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5% depuis hier
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Utilisateurs Uniques</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.uniqueUsers}</p>
                <div className="flex items-center text-sm text-blue-600 mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12 aujourd'hui
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Durée Moyenne</p>
                <p className="text-3xl font-bold text-slate-900">{formatDuration(stats?.averageDuration || 0)}</p>
                <div className="flex items-center text-sm text-purple-600 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Par session
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Transfert de Données</p>
                <p className="text-3xl font-bold text-slate-900">{formatDataTransfer((stats?.totalDataTransfer || 0) * 1024)}</p>
                <div className="flex items-center text-sm text-orange-600 mt-1">
                  <Database className="w-4 h-4 mr-1" />
                  Aujourd'hui
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Server className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une session..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="idle">Inactif</option>
                  <option value="expired">Expiré</option>
                </select>

                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.deviceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
                >
                  <option value="">Tous les appareils</option>
                  <option value="desktop">Bureau</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablette</option>
                </select>

                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.userRole}
                  onChange={(e) => setFilters(prev => ({ ...prev, userRole: e.target.value }))}
                >
                  <option value="">Tous les rôles</option>
                  <option value="admin">Admin</option>
                  <option value="user">Utilisateur</option>
                  <option value="guest">Invité</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedSessions.length > 0 && (
              <Button variant="danger" onClick={handleBulkTerminate}>
                <XCircle className="w-4 h-4 mr-2" />
                Terminer ({selectedSessions.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Sessions Actives</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSessions(filteredSessions.map(s => s.id));
                        } else {
                          setSelectedSessions([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Utilisateur</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Session</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Appareil</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Localisation</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Activité</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Données</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selectedSessions.includes(session.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSessions(prev => [...prev, session.id]);
                          } else {
                            setSelectedSessions(prev => prev.filter(id => id !== session.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {session.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{session.userName}</div>
                          <div className="text-sm text-slate-500">{session.userEmail}</div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(session.userRole)}`}>
                            {session.userRole === 'admin' && <Shield className="w-3 h-3" />}
                            {session.userRole.charAt(0).toUpperCase() + session.userRole.slice(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        <div className="text-sm text-slate-600">
                          <div>Durée: {formatDuration(session.duration)}</div>
                          <div>Risque: <span className={getRiskColor(session.riskScore)}>{session.riskScore.toFixed(1)}/10</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 mb-1">
                        {getDeviceIcon(session.deviceType)}
                        <span className="text-sm font-medium text-slate-900">{session.device}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        <div>{session.browser}</div>
                        <div>{session.os}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-900">{session.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Wifi className="w-3 h-3" />
                          <span>{session.ipAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm space-y-1">
                        <div className="text-slate-900">
                          Début: {formatTimestamp(session.startTime)}
                        </div>
                        <div className="text-slate-600">
                          Dernière: {formatTimestamp(session.lastActivity)}
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${session.isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${session.isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {session.isOnline ? 'En ligne' : 'Hors ligne'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm space-y-1">
                        <div className="text-green-600">
                          ↑ {formatDataTransfer(session.dataTransfer.upload)}
                        </div>
                        <div className="text-blue-600">
                          ↓ {formatDataTransfer(session.dataTransfer.download)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTerminateSession(session.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Terminer session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune session trouvée</h3>
              <p className="text-slate-600">
                {Object.values(filters).some(f => f) 
                  ? 'Aucune session ne correspond aux critères de recherche.'
                  : 'Aucune session active pour le moment.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionsPageNew;
