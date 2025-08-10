import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Unlock,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  User,
  Globe,
  Terminal,
  FileText,
  Activity
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | 'config_change' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  resolved: boolean;
}

interface SecurityStats {
  totalEvents: number;
  criticalAlerts: number;
  suspiciousActivities: number;
  blockedAttempts: number;
  activeThreats: number;
  lastScanTime: string;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rules: string[];
  lastUpdated: string;
}

const SecurityAudit: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'events' | 'policies' | 'analysis'>('events');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    severity: '',
    dateRange: '7',
    resolved: ''
  });
  const [currentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchSecurityData();
  }, [currentPage, filters, selectedTab]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
      const mockStats: SecurityStats = {
        totalEvents: 1247,
        criticalAlerts: 3,
        suspiciousActivities: 12,
        blockedAttempts: 45,
        activeThreats: 2,
        lastScanTime: new Date().toISOString()
      };

      const mockEvents: SecurityEvent[] = Array.from({ length: itemsPerPage }, (_, i) => {
        const types: SecurityEvent['type'][] = ['login', 'logout', 'failed_login', 'permission_denied', 'data_access', 'config_change', 'suspicious_activity'];
        const severities: SecurityEvent['severity'][] = ['low', 'medium', 'high', 'critical'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
          id: `event-${currentPage}-${i + 1}`,
          type,
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: getEventMessage(type),
          userId: `user-${Math.floor(Math.random() * 100)}`,
          userName: `Utilisateur ${Math.floor(Math.random() * 100)}`,
          userEmail: `user${Math.floor(Math.random() * 100)}@example.com`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          resolved: Math.random() > 0.3
        };
      });

      const mockPolicies: SecurityPolicy[] = [
        {
          id: 'policy-1',
          name: 'Tentatives de connexion multiples',
          description: 'Détecter les tentatives de connexion répétées depuis la même IP',
          enabled: true,
          severity: 'high',
          rules: ['Max 5 tentatives par IP/15min', 'Blocage automatique 1h'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'policy-2',
          name: 'Accès aux données sensibles',
          description: 'Surveiller les accès aux données critiques',
          enabled: true,
          severity: 'critical',
          rules: ['Log tous les accès', 'Alerte temps réel', 'Validation 2FA'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'policy-3',
          name: 'Modifications de configuration',
          description: 'Auditer tous les changements de configuration système',
          enabled: true,
          severity: 'medium',
          rules: ['Log détaillé', 'Approbation requise', 'Sauvegarde automatique'],
          lastUpdated: new Date().toISOString()
        }
      ];

      setStats(mockStats);
      setEvents(mockEvents);
      setPolicies(mockPolicies);
    } catch (err) {
      console.error('Security data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventMessage = (type: SecurityEvent['type']): string => {
    const messages = {
      login: 'Connexion utilisateur réussie',
      logout: 'Déconnexion utilisateur',
      failed_login: 'Tentative de connexion échouée',
      permission_denied: 'Accès refusé - permissions insuffisantes',
      data_access: 'Accès aux données sensibles',
      config_change: 'Modification de configuration système',
      suspicious_activity: 'Activité suspecte détectée'
    };
    return messages[type];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'failed_login':
        return <Ban className="w-4 h-4 text-red-500" />;
      case 'permission_denied':
        return <Lock className="w-4 h-4 text-orange-500" />;
      case 'data_access':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'config_change':
        return <Terminal className="w-4 h-4 text-purple-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'events', label: 'Événements', icon: FileText },
    { id: 'policies', label: 'Politiques', icon: Shield },
    { id: 'analysis', label: 'Analyse', icon: Activity }
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des données de sécurité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Sécurité & Audit
          </h1>
          <p className="text-slate-600 mt-2">
            Surveillance et analyse des événements de sécurité
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exporter rapport</span>
          </button>
        </div>
      </div>

      {/* Security Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{stats.totalEvents}</p>
            <p className="text-sm text-blue-600">Événements</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Critique</span>
            </div>
            <p className="text-2xl font-bold text-red-800">{stats.criticalAlerts}</p>
            <p className="text-sm text-red-600">Alertes</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">Suspect</span>
            </div>
            <p className="text-2xl font-bold text-orange-800">{stats.suspiciousActivities}</p>
            <p className="text-sm text-orange-600">Activités</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Ban className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">Bloqué</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">{stats.blockedAttempts}</p>
            <p className="text-sm text-purple-600">Tentatives</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Actives</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{stats.activeThreats}</p>
            <p className="text-sm text-green-600">Menaces</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as 'events' | 'policies' | 'analysis')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'events' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous les types</option>
                  <option value="login">Connexions</option>
                  <option value="failed_login">Échecs connexion</option>
                  <option value="permission_denied">Accès refusé</option>
                  <option value="suspicious_activity">Activité suspecte</option>
                </select>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes les sévérités</option>
                  <option value="critical">Critique</option>
                  <option value="high">Élevée</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </select>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Dernières 24h</option>
                  <option value="7">7 derniers jours</option>
                  <option value="30">30 derniers jours</option>
                  <option value="90">3 derniers mois</option>
                </select>
                <select
                  value={filters.resolved}
                  onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tous les statuts</option>
                  <option value="true">Résolus</option>
                  <option value="false">Non résolus</option>
                </select>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-slate-900">{event.message}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                              {event.severity}
                            </span>
                            {event.resolved && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Résolu
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            {event.userName && (
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{event.userName}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Globe className="w-4 h-4" />
                              <span>{event.ipAddress}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(event.timestamp).toLocaleString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Politiques de Sécurité</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Nouvelle politique
                </button>
              </div>

              <div className="grid gap-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="bg-slate-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{policy.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(policy.severity)}`}>
                            {policy.severity}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            policy.enabled 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {policy.enabled ? 'Activée' : 'Désactivée'}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-3">{policy.description}</p>
                        <div className="space-y-1">
                          {policy.rules.map((rule, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          {policy.enabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Dernière mise à jour: {new Date(policy.lastUpdated).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'analysis' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Analyse de Sécurité</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Tendances des Menaces</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Tentatives de connexion</span>
                      <span className="font-medium text-red-600">+23%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Accès non autorisés</span>
                      <span className="font-medium text-orange-600">+8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Modifications suspectes</span>
                      <span className="font-medium text-green-600">-15%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Top IP Suspectes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">192.168.1.45</span>
                      <span className="font-medium text-red-600">12 tentatives</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">10.0.0.23</span>
                      <span className="font-medium text-orange-600">8 tentatives</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">172.16.0.101</span>
                      <span className="font-medium text-yellow-600">5 tentatives</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
