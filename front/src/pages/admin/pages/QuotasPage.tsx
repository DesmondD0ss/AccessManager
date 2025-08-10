import React, { useState } from 'react';
import { AlertTriangle, Users, Globe, BarChart3, Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const QuotasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const quotaStats = [
    {
      title: 'Utilisateurs avec limites',
      value: '89%',
      change: '+5%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Consommation moyenne',
      value: '68%',
      change: '+12%',
      trend: 'up',
      icon: BarChart3,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Dépassements ce mois',
      value: '12',
      change: '-8%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Bande passante totale',
      value: '2.4 TB',
      change: '+15%',
      trend: 'up',
      icon: Globe,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const userQuotas = [
    {
      id: 1,
      user: 'john.doe@company.com',
      department: 'IT',
      dailyLimit: '5 GB',
      dailyUsed: '3.2 GB',
      dailyPercent: 64,
      monthlyLimit: '150 GB',
      monthlyUsed: '89 GB',
      monthlyPercent: 59,
      status: 'normal',
      lastActivity: '2024-01-20 14:30'
    },
    {
      id: 2,
      user: 'jane.smith@company.com',
      department: 'Marketing',
      dailyLimit: '3 GB',
      dailyUsed: '2.9 GB',
      dailyPercent: 97,
      monthlyLimit: '90 GB',
      monthlyUsed: '85 GB',
      monthlyPercent: 94,
      status: 'warning',
      lastActivity: '2024-01-20 14:25'
    },
    {
      id: 3,
      user: 'mike.johnson@company.com',
      department: 'Sales',
      dailyLimit: '2 GB',
      dailyUsed: '2.1 GB',
      dailyPercent: 105,
      monthlyLimit: '60 GB',
      monthlyUsed: '62 GB',
      monthlyPercent: 103,
      status: 'exceeded',
      lastActivity: '2024-01-20 14:20'
    },
    {
      id: 4,
      user: 'sarah.wilson@company.com',
      department: 'HR',
      dailyLimit: '1.5 GB',
      dailyUsed: '0.8 GB',
      dailyPercent: 53,
      monthlyLimit: '45 GB',
      monthlyUsed: '28 GB',
      monthlyPercent: 62,
      status: 'normal',
      lastActivity: '2024-01-20 14:15'
    }
  ];

  const quotaPolicies = [
    {
      id: 1,
      name: 'Équipe IT',
      description: 'Quota élevé pour l\'équipe technique',
      dailyLimit: '5 GB',
      monthlyLimit: '150 GB',
      users: 12,
      department: 'IT',
      status: 'active'
    },
    {
      id: 2,
      name: 'Employés standard',
      description: 'Quota standard pour tous les employés',
      dailyLimit: '2 GB',
      monthlyLimit: '60 GB',
      users: 45,
      department: 'General',
      status: 'active'
    },
    {
      id: 3,
      name: 'Invités temporaires',
      description: 'Quota limité pour les accès temporaires',
      dailyLimit: '500 MB',
      monthlyLimit: '15 GB',
      users: 8,
      department: 'Guest',
      status: 'active'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'exceeded':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-orange-500';
    if (percent >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des quotas</h1>
          <p className="text-slate-600">Surveillance et contrôle de l'utilisation de la bande passante</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle politique
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quotaStats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-4 h-4" />
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Quotas utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'policies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Politiques de quota
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Utilisation globale des quotas</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Utilisation par département</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">IT</span>
                        <span className="text-sm text-slate-500">78%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Marketing</span>
                        <span className="text-sm text-slate-500">92%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Sales</span>
                        <span className="text-sm text-slate-500">65%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">HR</span>
                        <span className="text-sm text-slate-500">43%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '43%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-900 mb-4">Tendances mensuelles</h3>
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-500">Graphique des tendances</p>
                      <p className="text-sm text-slate-400">Chart.js integration à venir</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Quotas par utilisateur</h2>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Tous les départements</option>
                    <option>IT</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                    <option>HR</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Département</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quota journalier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quota mensuel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {userQuotas.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{user.user}</div>
                            <div className="text-sm text-slate-500">Dernière activité: {user.lastActivity}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-slate-900">{user.dailyUsed} / {user.dailyLimit}</div>
                            <div className="w-24 bg-slate-200 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full ${getUsageColor(user.dailyPercent)}`}
                                style={{ width: `${Math.min(user.dailyPercent, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-slate-500">{user.dailyPercent}%</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-slate-900">{user.monthlyUsed} / {user.monthlyLimit}</div>
                            <div className="w-24 bg-slate-200 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full ${getUsageColor(user.monthlyPercent)}`}
                                style={{ width: `${Math.min(user.monthlyPercent, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-slate-500">{user.monthlyPercent}%</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status === 'normal' ? 'Normal' : 
                             user.status === 'warning' ? 'Attention' : 'Dépassé'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Politiques de quota</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotaPolicies.map((policy) => (
                  <div key={policy.id} className="bg-slate-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">{policy.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                        Actif
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4">{policy.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Limite journalière</span>
                        <span className="text-sm font-medium text-slate-900">{policy.dailyLimit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Limite mensuelle</span>
                        <span className="text-sm font-medium text-slate-900">{policy.monthlyLimit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Utilisateurs</span>
                        <span className="text-sm font-medium text-slate-900">{policy.users} personnes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Département</span>
                        <span className="text-sm font-medium text-slate-900">{policy.department}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <button className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Modifier
                      </button>
                      <button className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotasPage;
