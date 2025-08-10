import React from 'react';
import { BarChart3, TrendingUp, Users, Activity, Server, Zap } from 'lucide-react';

const StatisticsPage: React.FC = () => {
  const statsCards = [
    {
      title: 'Utilisateurs actifs',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Sessions simultanées',
      value: '89',
      change: '+5%',
      trend: 'up',
      icon: Activity,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Bande passante (GB)',
      value: '1,247',
      change: '-3%',
      trend: 'down',
      icon: Server,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Performance CPU',
      value: '68%',
      change: '+2%',
      trend: 'up',
      icon: Zap,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Statistiques</h1>
          <p className="text-slate-600">Analyse détaillée des performances et de l'utilisation du système</p>
        </div>
        <div className="flex space-x-3">
          <select className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Dernières 24h</option>
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
            <option>3 derniers mois</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-slate-600 text-sm">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Tendances d'utilisation</h2>
            <BarChart3 className="w-5 h-5 text-slate-500" />
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Graphique des tendances</p>
              <p className="text-sm text-slate-400">Chart.js integration à venir</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Métriques de performance</h2>
            <Activity className="w-5 h-5 text-slate-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">CPU</span>
                <span className="text-sm text-slate-500">68%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Mémoire</span>
                <span className="text-sm text-slate-500">45%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Stockage</span>
                <span className="text-sm text-slate-500">72%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Réseau</span>
                <span className="text-sm text-slate-500">34%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '34%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Statistiques détaillées</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Métrique</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aujourd'hui</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">7 jours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Connexions uniques</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">247</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">221</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">1,654</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+11.8%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Données transférées (GB)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">1,247</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">1,185</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">8,934</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+5.2%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Temps de réponse moyen (ms)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">142</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">156</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">149</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">-9.0%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Erreurs système</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">3</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">7</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">28</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-57.1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
