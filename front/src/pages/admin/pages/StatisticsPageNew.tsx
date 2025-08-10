import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Activity, 
  Server, 
  Zap,
  RefreshCw,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

const StatisticsPageNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const statsCards: StatCard[] = [
    {
      title: 'Utilisateurs actifs',
      value: '2,247',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      description: 'Utilisateurs connectés dernières 24h'
    },
    {
      title: 'Sessions simultanées',
      value: '189',
      change: '+8.3%',
      trend: 'up',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      description: 'Sessions actives en temps réel'
    },
    {
      title: 'Bande passante',
      value: '14.7 GB',
      change: '-2.1%',
      trend: 'down',
      icon: Server,
      color: 'from-purple-500 to-purple-600',
      description: 'Consommation totale'
    },
    {
      title: 'Performance CPU',
      value: '68.4%',
      change: '+3.2%',
      trend: 'up',
      icon: Zap,
      color: 'from-orange-500 to-orange-600',
      description: 'Utilisation moyenne'
    }
  ];

  const performanceMetrics = [
    { name: 'CPU', value: 68, color: 'from-orange-400 to-orange-600' },
    { name: 'Mémoire', value: 45, color: 'from-blue-400 to-blue-600' },
    { name: 'Stockage', value: 72, color: 'from-purple-400 to-purple-600' },
    { name: 'Réseau', value: 34, color: 'from-green-400 to-green-600' }
  ];

  const detailedStats = [
    {
      metric: 'Connexions uniques',
      today: '2,247',
      yesterday: '2,001',
      week: '14,654',
      trend: 12.3,
      trendDirection: 'up' as const
    },
    {
      metric: 'Données transférées (GB)',
      today: '14.7',
      yesterday: '13.2',
      week: '98.4',
      trend: 11.4,
      trendDirection: 'up' as const
    },
    {
      metric: 'Temps de réponse moyen (ms)',
      today: '142',
      yesterday: '156',
      week: '149',
      trend: -9.0,
      trendDirection: 'down' as const
    },
    {
      metric: 'Erreurs système',
      today: '3',
      yesterday: '7',
      week: '28',
      trend: -57.1,
      trendDirection: 'down' as const
    },
    {
      metric: 'Taux de disponibilité (%)',
      today: '99.94',
      yesterday: '99.87',
      week: '99.91',
      trend: 0.07,
      trendDirection: 'up' as const
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    const data = {
      timeRange,
      statistics: statsCards,
      detailedStats,
      exportDate: new Date().toISOString()
    };
    console.log('Exporting statistics:', data);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-slate-800 rounded-lg"></div>
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
            Statistiques & Analytics
          </h1>
          <p className="text-slate-400 mt-1">
            Analyse détaillée des performances et métriques système
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Dernière heure</option>
            <option value="24h">Dernières 24h</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="3m">3 derniers mois</option>
          </select>
          
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className="p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-mono ${
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-1 font-mono">
                  {stat.value}
                </h3>
                <p className="text-slate-300 text-sm font-medium">
                  {stat.title}
                </p>
                {stat.description && (
                  <p className="text-slate-400 text-xs mt-1">
                    {stat.description}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white font-mono">
              Tendances d'utilisation
            </h2>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">Graphique des tendances</p>
              <p className="text-sm text-slate-500 mt-1">
                Intégration Chart.js en cours
              </p>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white font-mono">
              Métriques de performance
            </h2>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300 font-mono">
                    {metric.name}
                  </span>
                  <span className="text-sm text-slate-400 font-mono">
                    {metric.value}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${metric.color} h-2 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white font-mono">
              Statistiques détaillées
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                  Métrique
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                  Aujourd'hui
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                  Hier
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                  7 jours
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                  Tendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {detailedStats.map((stat, index) => (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white font-mono">
                    {stat.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                    {stat.today}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                    {stat.yesterday}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                    {stat.week}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    <div className={`flex items-center gap-1 ${
                      stat.trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.trendDirection === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {stat.trendDirection === 'up' ? '+' : ''}{stat.trend.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StatisticsPageNew;
