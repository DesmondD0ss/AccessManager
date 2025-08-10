import React, { useState, useEffect } from 'react';
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
  Download,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

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
}

const SecurityAuditGitHub: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    resolved: '',
    search: ''
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Mock data
      const mockMetrics: SecurityMetrics = {
        totalEvents: 1247,
        criticalEvents: 3,
        highEvents: 15,
        mediumEvents: 89,
        lowEvents: 1140,
        resolvedEvents: 1200,
        activeThreats: 47,
        riskScore: 7.2,
        vulnerabilities: 12,
        blockedAttacks: 234,
      };

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'login_attempt',
          severity: 'critical',
          title: 'Tentatives de connexion suspectes',
          description: 'Plusieurs tentatives de connexion échouées depuis une adresse IP suspecte',
          timestamp: '2024-01-20 14:32:15',
          source: 'Authentication System',
          user: 'admin@system',
          ipAddress: '192.168.1.67',
          location: 'France',
          resolved: false,
          riskScore: 9.2,
        },
        {
          id: '2',
          type: 'permission_change',
          severity: 'high',
          title: 'Modification des permissions administrateur',
          description: 'Les permissions d\'un utilisateur ont été élevées au niveau administrateur',
          timestamp: '2024-01-20 13:45:22',
          source: 'User Management',
          user: 'admin@system',
          ipAddress: '10.0.0.1',
          location: 'Local',
          resolved: true,
          riskScore: 7.5,
        },
        {
          id: '3',
          type: 'data_access',
          severity: 'medium',
          title: 'Accès aux données sensibles',
          description: 'Accès inhabituel aux données utilisateurs depuis un terminal externe',
          timestamp: '2024-01-20 12:30:10',
          source: 'Database Monitor',
          user: 'john.doe@company.com',
          ipAddress: '203.45.67.89',
          location: 'Unknown',
          resolved: false,
          riskScore: 6.1,
        },
        {
          id: '4',
          type: 'system_change',
          severity: 'low',
          title: 'Mise à jour de configuration',
          description: 'Configuration système mise à jour avec succès',
          timestamp: '2024-01-20 11:15:30',
          source: 'System Management',
          user: 'system',
          ipAddress: 'localhost',
          location: 'Local',
          resolved: true,
          riskScore: 2.3,
        },
      ];

      setMetrics(mockMetrics);
      setEvents(mockEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des données de sécurité:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (severity) {
      case 'critical':
        return (
          <span className={`${baseClasses} status-error`}>
            <XCircle className="w-3 h-3 mr-1" />
            Critique
          </span>
        );
      case 'high':
        return (
          <span className={`${baseClasses} status-error`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Élevé
          </span>
        );
      case 'medium':
        return (
          <span className={`${baseClasses} status-warning`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Moyen
          </span>
        );
      case 'low':
        return (
          <span className={`${baseClasses} status-success`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Faible
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login_attempt':
        return <Key className="w-4 h-4 icon-info" />;
      case 'permission_change':
        return <Shield className="w-4 h-4 icon-warning" />;
      case 'data_access':
        return <Database className="w-4 h-4 icon-info" />;
      case 'system_change':
        return <Server className="w-4 h-4 icon-success" />;
      case 'network_intrusion':
        return <Network className="w-4 h-4 icon-error" />;
      default:
        return <Activity className="w-4 h-4 text-fg-muted" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'icon-error';
    if (score >= 6) return 'icon-warning';
    if (score >= 4) return 'icon-info';
    return 'icon-success';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-canvas-default min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg-default">Audit de Sécurité</h1>
            <p className="text-fg-muted mt-1">
              Surveillance et analyse des événements de sécurité en temps réel
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchSecurityData(true)}
              className="btn btn-default"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button className="btn btn-default">
              <Download className="w-4 h-4 mr-2" />
              Rapport
            </button>
            <button className="btn btn-primary">
              <Shield className="w-4 h-4 mr-2" />
              Nouveau scan
            </button>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Score de Risque</p>
                  <p className={`text-2xl font-bold ${getRiskScoreColor(metrics?.riskScore || 0)}`}>
                    {metrics?.riskScore}/10
                  </p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <Shield className="h-6 w-6 icon-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Menaces Actives</p>
                  <p className="text-2xl font-bold text-fg-default">{metrics?.activeThreats}</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 icon-error" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Attaques Bloquées</p>
                  <p className="text-2xl font-bold text-fg-default">{metrics?.blockedAttacks}</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <XCircle className="h-6 w-6 icon-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Vulnérabilités</p>
                  <p className="text-2xl font-bold text-fg-default">{metrics?.vulnerabilities}</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <Lock className="h-6 w-6 icon-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
                  <input
                    type="text"
                    placeholder="Rechercher dans les événements..."
                    className="input pl-10 w-full"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
              <select
                className="input w-full sm:w-40"
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="">Toutes les sévérités</option>
                <option value="critical">Critique</option>
                <option value="high">Élevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
              <select
                className="input w-full sm:w-40"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">Tous les types</option>
                <option value="login_attempt">Connexion</option>
                <option value="permission_change">Permissions</option>
                <option value="data_access">Accès données</option>
                <option value="system_change">Système</option>
                <option value="network_intrusion">Réseau</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader>
            <CardTitle>Événements de Sécurité ({events.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {events.map((event) => (
                <div key={event.id} className="border-b border-default last:border-b-0 p-6 hover:bg-canvas-subtle transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-medium text-fg-default truncate">
                            {event.title}
                          </h3>
                          {getSeverityBadge(event.severity)}
                          {!event.resolved && (
                            <span className="bg-canvas-subtle text-fg-muted text-xs px-2 py-1 rounded-full">
                              Non résolu
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-fg-muted mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-fg-muted">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(event.timestamp)}
                          </div>
                          <div className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            {event.ipAddress}
                          </div>
                          {event.user && (
                            <div className="flex items-center">
                              <UserX className="w-3 h-3 mr-1" />
                              {event.user}
                            </div>
                          )}
                          <div className="flex items-center">
                            <TrendingUp className={`w-3 h-3 mr-1 ${getRiskScoreColor(event.riskScore)}`} />
                            Risk: {event.riskScore}/10
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="btn btn-ghost btn-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                      {!event.resolved && (
                        <button className="btn btn-primary btn-sm">
                          Résoudre
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Sévérité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 icon-error mr-2" />
                    <span className="text-sm text-fg-default">Critique</span>
                  </div>
                  <span className="text-sm font-medium text-fg-default">{metrics?.criticalEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 icon-error mr-2" />
                    <span className="text-sm text-fg-default">Élevé</span>
                  </div>
                  <span className="text-sm font-medium text-fg-default">{metrics?.highEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 icon-warning mr-2" />
                    <span className="text-sm text-fg-default">Moyen</span>
                  </div>
                  <span className="text-sm font-medium text-fg-default">{metrics?.mediumEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 icon-success mr-2" />
                    <span className="text-sm text-fg-default">Faible</span>
                  </div>
                  <span className="text-sm font-medium text-fg-default">{metrics?.lowEvents}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques de Résolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fg-default">Total d'événements</span>
                  <span className="text-sm font-medium text-fg-default">{metrics?.totalEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fg-default">Événements résolus</span>
                  <span className="text-sm font-medium icon-success">{metrics?.resolvedEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-fg-default">Taux de résolution</span>
                  <span className="text-sm font-medium icon-success">
                    {metrics ? Math.round((metrics.resolvedEvents / metrics.totalEvents) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditGitHub;
