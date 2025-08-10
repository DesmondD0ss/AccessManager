import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Server, 
  AlertTriangle, 
  Activity, 
  Shield, 
  Network, 
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Cpu,
  MemoryStick,
  HardDrive,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  ArrowRight,
  Calendar,
  Zap,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
  uptime: string;
  alertsCount: number;
  networkStatus: 'healthy' | 'warning' | 'critical';
  databaseStatus: 'connected' | 'disconnected' | 'error';
  dataTransfer: {
    upload: number;
    download: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

interface QuickMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'system' | 'security' | 'network';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  user?: string;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'critical';
  timestamp: string;
  resolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const DashboardOverviewNew: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Simulate API calls - replace with real API calls
      const mockStats: SystemStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalSessions: 156,
        activeSessions: 89,
        systemLoad: 65.2,
        memoryUsage: 78.5,
        diskUsage: 45.8,
        cpuUsage: 42.3,
        uptime: '15j 8h 32m',
        alertsCount: 3,
        networkStatus: 'healthy',
        databaseStatus: 'connected',
        dataTransfer: {
          upload: 2.4,
          download: 8.9
        },
        performance: {
          responseTime: 125,
          throughput: 94.5,
          errorRate: 0.2
        }
      };

      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'user',
          message: 'Nouvel utilisateur enregistré',
          timestamp: '2025-01-04T10:30:00Z',
          severity: 'success',
          user: 'admin@example.com'
        },
        {
          id: '2',
          type: 'security',
          message: 'Tentative de connexion échouée détectée',
          timestamp: '2025-01-04T10:25:00Z',
          severity: 'warning'
        },
        {
          id: '3',
          type: 'system',
          message: 'Sauvegarde automatique terminée',
          timestamp: '2025-01-04T10:00:00Z',
          severity: 'success'
        },
        {
          id: '4',
          type: 'network',
          message: 'Pic de trafic détecté',
          timestamp: '2025-01-04T09:45:00Z',
          severity: 'info'
        }
      ];

      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          title: 'Utilisation mémoire élevée',
          message: 'L\'utilisation de la mémoire a dépassé 75%',
          type: 'warning',
          timestamp: '2025-01-04T10:15:00Z',
          resolved: false,
          priority: 'medium'
        },
        {
          id: '2',
          title: 'Connexions simultanées élevées',
          message: 'Le nombre de connexions simultanées approche la limite',
          type: 'info',
          timestamp: '2025-01-04T09:30:00Z',
          resolved: false,
          priority: 'low'
        }
      ];

      setStats(mockStats);
      setActivities(mockActivities);
      setAlerts(mockAlerts);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données du dashboard');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const quickMetrics: QuickMetric[] = stats ? [
    {
      id: 'users',
      label: 'Utilisateurs Actifs',
      value: stats.activeUsers.toLocaleString(),
      change: 12.5,
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400'
    },
    {
      id: 'sessions',
      label: 'Sessions Actives',
      value: stats.activeSessions.toString(),
      change: -3.2,
      trend: 'down',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-green-400'
    },
    {
      id: 'performance',
      label: 'Performance',
      value: `${stats.performance.throughput}%`,
      change: 8.1,
      trend: 'up',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-yellow-400'
    },
    {
      id: 'uptime',
      label: 'Temps de fonctionnement',
      value: stats.uptime,
      change: 0,
      trend: 'stable',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-purple-400'
    }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
      case 'error':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
      case 'error':
      case 'disconnected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'system':
        return <Server className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'network':
        return <Network className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500 bg-red-500/5';
      case 'error':
        return 'border-l-red-400 bg-red-400/5';
      case 'warning':
        return 'border-l-yellow-400 bg-yellow-400/5';
      default:
        return 'border-l-blue-400 bg-blue-400/5';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-[#f0f6fc] mb-2">Chargement du dashboard</h3>
            <p className="text-[#7d8590]">Récupération des données système...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#f0f6fc] mb-2">Erreur de chargement</h3>
            <p className="text-[#7d8590] mb-6">{error}</p>
            <Button onClick={() => fetchDashboardData()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tableau de Bord</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dernière mise à jour : {lastUpdated.toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickMetrics.map((metric) => (
          <Card key={metric.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-slate-100 ${metric.color}`}>
                  {metric.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                  {metric.change !== 0 && (
                    <div className={`flex items-center text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      {metric.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {metric.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-medium text-slate-700">{metric.label}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">État du Système</CardTitle>
                <Monitor className="w-5 h-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-slate-700">Base de données</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getStatusColor(stats?.databaseStatus || 'unknown')}`}>
                    {getStatusIcon(stats?.databaseStatus || 'unknown')}
                    <span className="text-sm font-medium capitalize">
                      {stats?.databaseStatus || 'Inconnu'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Network className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-slate-700">Réseau</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getStatusColor(stats?.networkStatus || 'unknown')}`}>
                    {getStatusIcon(stats?.networkStatus || 'unknown')}
                    <span className="text-sm font-medium capitalize">
                      {stats?.networkStatus || 'Inconnu'}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Metrics */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Processeur
                    </span>
                    <span className="font-medium text-slate-900">{stats?.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats?.cpuUsage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-2">
                      <MemoryStick className="w-4 h-4" />
                      Mémoire
                    </span>
                    <span className="font-medium text-slate-900">{stats?.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats?.memoryUsage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Stockage
                    </span>
                    <span className="font-medium text-slate-900">{stats?.diskUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats?.diskUsage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Activité Récente</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        {activity.user && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600">{activity.user}</span>
                          </>
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
          {/* Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alertes
                </CardTitle>
                {alerts.length > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    {alerts.filter(a => !a.resolved).length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Aucune alerte active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 mb-1">{alert.title}</h4>
                          <p className="text-xs text-slate-600 mb-2">{alert.message}</p>
                          <span className="text-xs text-slate-500">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <Button variant="secondary" className="w-full" size="sm">
                      Voir toutes les alertes ({alerts.length - 3} de plus)
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="secondary">
                <Users className="w-4 h-4 mr-3" />
                Gérer les utilisateurs
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <Shield className="w-4 h-4 mr-3" />
                Audit de sécurité
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <Database className="w-4 h-4 mr-3" />
                Sauvegarde système
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <Network className="w-4 h-4 mr-3" />
                Configuration réseau
              </Button>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Informations Système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Version</span>
                  <span className="font-medium text-slate-900">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Temps de fonctionnement</span>
                  <span className="font-medium text-slate-900">{stats?.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Utilisateurs connectés</span>
                  <span className="font-medium text-slate-900">{stats?.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sessions actives</span>
                  <span className="font-medium text-slate-900">{stats?.activeSessions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewNew;
