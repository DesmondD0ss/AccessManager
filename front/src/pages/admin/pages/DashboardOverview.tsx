import React, { useState, useEffect } from 'react';
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
  MemoryStick
} from 'lucide-react';
import { apiService } from '../../../services/apiService';

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
}

interface RecentActivity {
  id: string;
  type: 'user' | 'system' | 'security' | 'network';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  timestamp: string;
  resolved: boolean;
}

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activitiesResponse, alertsResponse] = await Promise.all([
        apiService.get('/admin/dashboard/stats'),
        apiService.get('/admin/dashboard/activities'),
        apiService.get('/admin/dashboard/alerts')
      ]);

      setStats(statsResponse.data as SystemStats);
      setActivities(activitiesResponse.data as RecentActivity[]);
      setAlerts(alertsResponse.data as SystemAlert[]);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données du dashboard');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-emerald-500';
      case 'warning':
        return 'text-amber-500';
      case 'critical':
      case 'error':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'critical':
      case 'error':
      case 'disconnected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
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
        return 'text-emerald-500 bg-emerald-500/10';
      case 'warning':
        return 'text-amber-500 bg-amber-500/10';
      case 'error':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-blue-500 bg-blue-500/10';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Dashboard Administrateur
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Vue d'ensemble du système et des activités
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-slate-500">Dernière mise à jour</p>
            <p className="text-slate-700 font-medium">
              {new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-amber-900">
              Alertes Système ({alerts.filter(a => !a.resolved).length})
            </h2>
          </div>
          <div className="space-y-3">
            {alerts.filter(a => !a.resolved).slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.type === 'error' ? 'bg-red-500' : 
                  alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{alert.title}</p>
                  <p className="text-sm text-slate-600">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              +{stats?.activeUsers || 0} actifs
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">Utilisateurs</h3>
            <p className="text-3xl font-bold text-blue-800">{stats?.totalUsers || 0}</p>
            <p className="text-sm text-blue-600 mt-1">
              {stats?.activeUsers || 0} utilisateurs actifs
            </p>
          </div>
        </div>

        {/* Sessions Stats */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-emerald-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-600 rounded-lg shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-emerald-700 bg-emerald-200 px-2 py-1 rounded-full">
              {stats?.activeSessions || 0} actives
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-900 mb-1">Sessions</h3>
            <p className="text-3xl font-bold text-emerald-800">{stats?.totalSessions || 0}</p>
            <p className="text-sm text-emerald-600 mt-1">
              Sessions totales aujourd'hui
            </p>
          </div>
        </div>

        {/* System Load */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg shadow-md">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              (stats?.systemLoad || 0) > 80 ? 'text-red-700 bg-red-200' :
              (stats?.systemLoad || 0) > 60 ? 'text-amber-700 bg-amber-200' :
              'text-emerald-700 bg-emerald-200'
            }`}>
              {(stats?.systemLoad || 0) > 80 ? 'Élevée' :
               (stats?.systemLoad || 0) > 60 ? 'Modérée' : 'Normale'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-1">Charge CPU</h3>
            <p className="text-3xl font-bold text-purple-800">{stats?.systemLoad || 0}%</p>
            <p className="text-sm text-purple-600 mt-1">
              Utilisation processeur
            </p>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-xl shadow-lg border border-rose-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-600 rounded-lg shadow-md">
              <MemoryStick className="w-6 h-6 text-white" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              (stats?.memoryUsage || 0) > 80 ? 'text-red-700 bg-red-200' :
              (stats?.memoryUsage || 0) > 60 ? 'text-amber-700 bg-amber-200' :
              'text-emerald-700 bg-emerald-200'
            }`}>
              {(stats?.memoryUsage || 0) > 80 ? 'Critique' :
               (stats?.memoryUsage || 0) > 60 ? 'Attention' : 'OK'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-rose-900 mb-1">Mémoire</h3>
            <p className="text-3xl font-bold text-rose-800">{stats?.memoryUsage || 0}%</p>
            <p className="text-sm text-rose-600 mt-1">
              Utilisation mémoire
            </p>
          </div>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Network Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Network className="w-6 h-6 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Réseau</h3>
            </div>
            <div className={`flex items-center space-x-2 ${getStatusColor(stats?.networkStatus || 'healthy')}`}>
              {getStatusIcon(stats?.networkStatus || 'healthy')}
              <span className="font-medium capitalize">{stats?.networkStatus || 'healthy'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Statut</span>
              <span className={`font-medium ${getStatusColor(stats?.networkStatus || 'healthy')}`}>
                {stats?.networkStatus === 'healthy' ? 'Opérationnel' :
                 stats?.networkStatus === 'warning' ? 'Attention' : 'Critique'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Uptime</span>
              <span className="font-medium text-slate-900">{stats?.uptime || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Base de données</h3>
            </div>
            <div className={`flex items-center space-x-2 ${getStatusColor(stats?.databaseStatus || 'connected')}`}>
              {getStatusIcon(stats?.databaseStatus || 'connected')}
              <span className="font-medium capitalize">{stats?.databaseStatus || 'connected'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Statut</span>
              <span className={`font-medium ${getStatusColor(stats?.databaseStatus || 'connected')}`}>
                {stats?.databaseStatus === 'connected' ? 'Connectée' :
                 stats?.databaseStatus === 'disconnected' ? 'Déconnectée' : 'Erreur'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Stockage</span>
              <span className="font-medium text-slate-900">{stats?.diskUsage || 0}% utilisé</span>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Sécurité</h3>
            </div>
            <div className="flex items-center space-x-2 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Sécurisé</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Alertes</span>
              <span className="font-medium text-slate-900">{stats?.alertsCount || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Dernière analyse</span>
              <span className="font-medium text-slate-900">Il y a 5 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Activité Récente</h3>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {activities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(activity.severity)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
