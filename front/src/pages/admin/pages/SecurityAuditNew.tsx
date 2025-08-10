import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Key,
  UserX,
  Activity,
  Clock,
  Globe,
  Server,
  Network,
  Database,
  FileText,
  Download,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Bell,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'permission_change' | 'data_access' | 'system_change' | 'network_intrusion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  user?: string;
  ipAddress: string;
  location: string;
  resolved: boolean;
  riskScore: number;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  resolvedEvents: number;
  activeThreats: number;
  riskScore: number;
  vulnerabilities: number;
  blockedAttacks: number;
  falsePositives: number;
  lastScan: string;
}

interface ThreatSource {
  country: string;
  attempts: number;
  blocked: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface VulnerabilityItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data' | 'network' | 'system';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
  discoveredAt: string;
}

const SecurityAuditNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [threatSources, setThreatSources] = useState<ThreatSource[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityItem[]>([]);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    resolved: '',
    search: ''
  });

  const fetchSecurityData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Mock data - replace with real API calls
      const mockMetrics: SecurityMetrics = {
        totalEvents: 1247,
        criticalEvents: 12,
        highEvents: 45,
        mediumEvents: 156,
        lowEvents: 1034,
        resolvedEvents: 1180,
        activeThreats: 67,
        riskScore: 7.8,
        vulnerabilities: 23,
        blockedAttacks: 892,
        falsePositives: 34,
        lastScan: '2025-01-04T09:30:00Z'
      };

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login_attempt',
          severity: 'high',
          title: 'Tentatives de connexion multiples échouées',
          description: 'Plus de 10 tentatives de connexion échouées depuis la même IP',
          timestamp: '2025-01-04T10:30:00Z',
          source: 'Authentication System',
          user: 'admin@example.com',
          ipAddress: '192.168.1.100',
          location: 'Paris, France',
          resolved: false,
          riskScore: 8.5
        },
        {
          id: '2',
          type: 'permission_change',
          severity: 'medium',
          title: 'Modification de permissions utilisateur',
          description: 'Permissions administrateur accordées à un utilisateur',
          timestamp: '2025-01-04T09:45:00Z',
          source: 'User Management',
          user: 'admin@example.com',
          ipAddress: '10.0.0.50',
          location: 'Lyon, France',
          resolved: true,
          riskScore: 6.2
        },
        {
          id: '3',
          type: 'network_intrusion',
          severity: 'critical',
          title: 'Tentative d\'intrusion réseau détectée',
          description: 'Scan de ports suspects depuis une IP externe',
          timestamp: '2025-01-04T08:15:00Z',
          source: 'Network Monitor',
          ipAddress: '45.123.456.789',
          location: 'Unknown',
          resolved: false,
          riskScore: 9.2
        }
      ];

      const mockThreatSources: ThreatSource[] = [
        { country: 'Chine', attempts: 234, blocked: 230, riskLevel: 'high' },
        { country: 'Russie', attempts: 187, blocked: 183, riskLevel: 'high' },
        { country: 'États-Unis', attempts: 89, blocked: 45, riskLevel: 'medium' },
        { country: 'Allemagne', attempts: 34, blocked: 32, riskLevel: 'low' },
        { country: 'Brésil', attempts: 67, blocked: 65, riskLevel: 'medium' }
      ];

      const mockVulnerabilities: VulnerabilityItem[] = [
        {
          id: '1',
          title: 'Politique de mot de passe faible',
          severity: 'medium',
          category: 'authentication',
          description: 'Les mots de passe ne respectent pas les standards de sécurité',
          recommendation: 'Implémenter une politique de mot de passe plus stricte',
          status: 'open',
          discoveredAt: '2025-01-03T14:20:00Z'
        },
        {
          id: '2',
          title: 'Session timeout trop élevé',
          severity: 'low',
          category: 'authorization',
          description: 'Les sessions utilisateur restent actives trop longtemps',
          recommendation: 'Réduire le timeout des sessions à 30 minutes',
          status: 'in_progress',
          discoveredAt: '2025-01-02T11:30:00Z'
        }
      ];

      setMetrics(mockMetrics);
      setEvents(mockEvents);
      setThreatSources(mockThreatSources);
      setVulnerabilities(mockVulnerabilities);

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(() => fetchSecurityData(true), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Eye className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login_attempt':
        return <Key className="w-4 h-4" />;
      case 'permission_change':
        return <Shield className="w-4 h-4" />;
      case 'data_access':
        return <Database className="w-4 h-4" />;
      case 'system_change':
        return <Server className="w-4 h-4" />;
      case 'network_intrusion':
        return <Network className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-600';
    if (score >= 6) return 'text-orange-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyse de sécurité en cours</h3>
            <p className="text-slate-600">Récupération des données de sécurité...</p>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit de Sécurité</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Surveillance et analyse des événements de sécurité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchSecurityData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exporter le rapport
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Score de Risque</p>
                <p className={`text-3xl font-bold ${getRiskScoreColor(metrics?.riskScore || 0)}`}>
                  {metrics?.riskScore.toFixed(1)}/10
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-slate-600">
              <TrendingUp className="w-4 h-4 mr-1 text-red-500" />
              +2.1 depuis hier
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Menaces Actives</p>
                <p className="text-3xl font-bold text-slate-900">{metrics?.activeThreats}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-slate-600">
              <TrendingDown className="w-4 h-4 mr-1 text-green-500" />
              -5 depuis hier
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Attaques Bloquées</p>
                <p className="text-3xl font-bold text-slate-900">{metrics?.blockedAttacks}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-slate-600">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              +12% cette semaine
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Vulnérabilités</p>
                <p className="text-3xl font-bold text-slate-900">{metrics?.vulnerabilities}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
              3 corrigées cette semaine
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Security Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Events Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="">Toutes les sévérités</option>
                  <option value="critical">Critique</option>
                  <option value="high">Élevée</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </select>
                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.resolved}
                  onChange={(e) => setFilters(prev => ({ ...prev, resolved: e.target.value }))}
                >
                  <option value="">Tous les statuts</option>
                  <option value="false">Non résolus</option>
                  <option value="true">Résolus</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Événements de Sécurité Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${getSeverityColor(event.severity)}`}>
                          {getTypeIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{event.title}</h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                              {getSeverityIcon(event.severity)}
                              {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(event.timestamp)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {event.ipAddress} ({event.location})
                            </div>
                            {event.user && (
                              <div className="flex items-center gap-1">
                                <UserX className="w-3 h-3" />
                                {event.user}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Risque: {event.riskScore}/10
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.resolved ? (
                          <span className="text-green-600 text-sm font-medium">Résolu</span>
                        ) : (
                          <Button size="sm">Examiner</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Threat Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Sources de Menaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {threatSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900">{source.country}</div>
                      <div className="text-sm text-slate-600">
                        {source.attempts} tentatives, {source.blocked} bloquées
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      source.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      source.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {source.riskLevel}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Vulnerabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Vulnérabilités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vulnerabilities.map((vuln) => (
                  <div key={vuln.id} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-slate-900 text-sm">{vuln.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{vuln.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        vuln.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        vuln.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {vuln.status === 'resolved' ? 'Résolu' :
                         vuln.status === 'in_progress' ? 'En cours' : 'Ouvert'}
                      </span>
                      <Button size="sm" variant="secondary">
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="secondary">
                <Shield className="w-4 h-4 mr-3" />
                Scanner les vulnérabilités
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <Lock className="w-4 h-4 mr-3" />
                Vérifier les accès
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <FileText className="w-4 h-4 mr-3" />
                Journal d'audit
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <Bell className="w-4 h-4 mr-3" />
                Configurer les alertes
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">État du Système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Firewall</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 text-sm font-medium">Actif</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Antivirus</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 text-sm font-medium">Protégé</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Détection d'intrusion</span>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-600 text-sm font-medium">Alerte</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Dernière analyse</span>
                <span className="text-sm text-slate-900">{formatTimestamp(metrics?.lastScan || '')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditNew;
