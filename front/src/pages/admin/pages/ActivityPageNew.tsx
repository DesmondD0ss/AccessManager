import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  Activity,
  Server,
  ChevronDown
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface ActivityLog {
  id: number;
  type: 'login' | 'security' | 'error' | 'system' | 'user' | 'network' | 'admin';
  user: string;
  action: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'error' | 'warning' | 'info';
  details: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const ActivityPageNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const activities: ActivityLog[] = [
    {
      id: 1,
      type: 'login',
      user: 'john.doe@company.com',
      action: 'Connexion réussie',
      timestamp: '2024-01-20 14:32:15',
      ip: '192.168.1.45',
      status: 'success',
      details: 'Authentification par mot de passe - Navigateur: Chrome 120',
      severity: 'low'
    },
    {
      id: 2,
      type: 'security',
      user: 'admin@system',
      action: 'Modification des règles de sécurité',
      timestamp: '2024-01-20 14:28:42',
      ip: '10.0.0.1',
      status: 'warning',
      details: 'Mise à jour des politiques de mot de passe - Complexité augmentée',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'error',
      user: 'jane.smith@company.com',
      action: 'Tentative de connexion échouée',
      timestamp: '2024-01-20 14:25:33',
      ip: '192.168.1.67',
      status: 'error',
      details: 'Mot de passe incorrect (3ème tentative) - Compte temporairement verrouillé',
      severity: 'high'
    },
    {
      id: 4,
      type: 'system',
      user: 'system',
      action: 'Sauvegarde automatique effectuée',
      timestamp: '2024-01-20 14:00:00',
      ip: 'localhost',
      status: 'success',
      details: 'Sauvegarde complète de la base de données - 2.4 GB sauvegardés',
      severity: 'low'
    },
    {
      id: 5,
      type: 'user',
      user: 'admin@system',
      action: 'Création d\'un nouvel utilisateur',
      timestamp: '2024-01-20 13:45:18',
      ip: '10.0.0.1',
      status: 'success',
      details: 'Utilisateur: mike.johnson@company.com - Rôle: Utilisateur standard',
      severity: 'low'
    },
    {
      id: 6,
      type: 'network',
      user: 'system',
      action: 'Blocage d\'adresse IP suspecte',
      timestamp: '2024-01-20 13:30:25',
      ip: '203.45.67.89',
      status: 'warning',
      details: 'IP ajoutée à la liste noire automatiquement - Tentatives multiples détectées',
      severity: 'high'
    },
    {
      id: 7,
      type: 'admin',
      user: 'admin@system',
      action: 'Modification des quotas utilisateur',
      timestamp: '2024-01-20 13:15:00',
      ip: '10.0.0.1',
      status: 'success',
      details: 'Quota de bande passante augmenté pour le groupe "Développeurs"',
      severity: 'medium'
    },
    {
      id: 8,
      type: 'system',
      user: 'system',
      action: 'Alerte de performance détectée',
      timestamp: '2024-01-20 12:58:45',
      ip: 'localhost',
      status: 'warning',
      details: 'Utilisation CPU > 85% pendant 5 minutes consécutives',
      severity: 'critical'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return User;
      case 'security':
        return Shield;
      case 'error':
        return XCircle;
      case 'system':
        return Server;
      case 'user':
        return User;
      case 'network':
        return AlertCircle;
      case 'admin':
        return Shield;
      default:
        return Clock;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return { 
          color: 'text-green-400 bg-green-400/10 border-green-400/20', 
          icon: CheckCircle 
        };
      case 'error':
        return { 
          color: 'text-red-400 bg-red-400/10 border-red-400/20', 
          icon: XCircle 
        };
      case 'warning':
        return { 
          color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', 
          icon: AlertTriangle 
        };
      case 'info':
        return { 
          color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', 
          icon: Clock 
        };
      default:
        return { 
          color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', 
          icon: Clock 
        };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'medium':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'high':
        return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
      case 'critical':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = selectedFilter === 'all' || activity.type === selectedFilter;
    const matchesSeverity = selectedSeverity === 'all' || activity.severity === selectedSeverity;
    const matchesSearch = searchTerm === '' || 
      activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSeverity && matchesSearch;
  });

  const activityStats = {
    today: activities.filter(a => a.timestamp.includes('2024-01-20')).length,
    logins: activities.filter(a => a.type === 'login').length,
    errors: activities.filter(a => a.status === 'error').length,
    warnings: activities.filter(a => a.status === 'warning').length
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    const data = {
      activities: filteredActivities,
      filters: { selectedFilter, selectedSeverity, searchTerm },
      exportDate: new Date().toISOString()
    };
    console.log('Exporting activity logs:', data);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-slate-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">
            Activité & Événements
          </h1>
          <p className="text-slate-400 mt-1">
            Suivi en temps réel de toutes les activités système et utilisateur
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Aujourd'hui</p>
              <p className="text-2xl font-bold text-white font-mono">{activityStats.today}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Connexions</p>
              <p className="text-2xl font-bold text-white font-mono">{activityStats.logins}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <User className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Erreurs</p>
              <p className="text-2xl font-bold text-white font-mono">{activityStats.errors}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Alertes</p>
              <p className="text-2xl font-bold text-white font-mono">{activityStats.warnings}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans les activités..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-white px-4 py-2 pr-8 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="login">Connexions</option>
                <option value="security">Sécurité</option>
                <option value="system">Système</option>
                <option value="user">Utilisateurs</option>
                <option value="network">Réseau</option>
                <option value="admin">Administration</option>
                <option value="error">Erreurs</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-white px-4 py-2 pr-8 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les sévérités</option>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Log */}
      <Card>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white font-mono">
              Journal d'activité ({filteredActivities.length})
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Eye className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-700">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucune activité trouvée</p>
              <p className="text-slate-500 text-sm mt-1">
                Modifiez vos filtres pour voir plus d'événements
              </p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const statusConfig = getStatusConfig(activity.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={activity.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${statusConfig.color} border`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-medium font-mono">
                              {activity.action}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-mono border ${getSeverityColor(activity.severity || 'low')}`}>
                              {activity.severity?.toUpperCase() || 'LOW'}
                            </div>
                          </div>
                          
                          <p className="text-slate-300 text-sm mb-2 font-mono">
                            <span className="text-slate-400">Utilisateur:</span> {activity.user}
                            <span className="text-slate-500 mx-2">•</span>
                            <span className="text-slate-400">IP:</span> {activity.ip}
                          </p>
                          
                          <p className="text-slate-400 text-sm">
                            {activity.details}
                          </p>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono border ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{activity.status.toUpperCase()}</span>
                          </div>
                          <p className="text-slate-500 text-xs mt-2 font-mono">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default ActivityPageNew;
