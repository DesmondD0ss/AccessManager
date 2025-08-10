import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Users, 
  Globe, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Search,
  Download,
  RefreshCw,
  Settings,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface UserQuota {
  id: number;
  user: string;
  department: string;
  dailyLimit: string;
  dailyUsed: string;
  dailyPercent: number;
  monthlyLimit: string;
  monthlyUsed: string;
  monthlyPercent: number;
  status: 'normal' | 'warning' | 'exceeded';
  lastActivity: string;
}

interface QuotaRule {
  id: number;
  name: string;
  type: 'bandwidth' | 'storage' | 'sessions' | 'time';
  limit: string;
  period: 'daily' | 'weekly' | 'monthly';
  appliedTo: 'all' | 'group' | 'individual';
  groupName?: string;
  usersCount: number;
  active: boolean;
}

const QuotasPageNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rules'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const quotaStats = [
    {
      title: 'Utilisateurs avec quotas',
      value: '89%',
      change: '+5.2%',
      trend: 'up' as const,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      description: '247 sur 278 utilisateurs'
    },
    {
      title: 'Consommation moyenne',
      value: '68.4%',
      change: '+12.3%',
      trend: 'up' as const,
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      description: 'des quotas alloués'
    },
    {
      title: 'Dépassements ce mois',
      value: '12',
      change: '-25.0%',
      trend: 'down' as const,
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      description: '3 critiques, 9 mineurs'
    },
    {
      title: 'Bande passante totale',
      value: '2.4 TB',
      change: '+15.7%',
      trend: 'up' as const,
      icon: Globe,
      color: 'from-purple-500 to-purple-600',
      description: 'consommée ce mois'
    }
  ];

  const userQuotas: UserQuota[] = [
    {
      id: 1,
      user: 'john.doe@company.com',
      department: 'IT',
      dailyLimit: '5 GB',
      dailyUsed: '3.2 GB',
      dailyPercent: 64,
      monthlyLimit: '150 GB',
      monthlyUsed: '89.4 GB',
      monthlyPercent: 59.6,
      status: 'normal',
      lastActivity: '2024-01-20T14:32:15Z'
    },
    {
      id: 2,
      user: 'jane.smith@company.com',
      department: 'Marketing',
      dailyLimit: '3 GB',
      dailyUsed: '2.8 GB',
      dailyPercent: 93.3,
      monthlyLimit: '90 GB',
      monthlyUsed: '78.2 GB',
      monthlyPercent: 86.9,
      status: 'warning',
      lastActivity: '2024-01-20T13:45:22Z'
    },
    {
      id: 3,
      user: 'mike.johnson@company.com',
      department: 'Sales',
      dailyLimit: '4 GB',
      dailyUsed: '4.8 GB',
      dailyPercent: 120,
      monthlyLimit: '120 GB',
      monthlyUsed: '127.3 GB',
      monthlyPercent: 106.1,
      status: 'exceeded',
      lastActivity: '2024-01-20T15:12:08Z'
    },
    {
      id: 4,
      user: 'sarah.wilson@company.com',
      department: 'Finance',
      dailyLimit: '2 GB',
      dailyUsed: '1.1 GB',
      dailyPercent: 55,
      monthlyLimit: '60 GB',
      monthlyUsed: '34.7 GB',
      monthlyPercent: 57.8,
      status: 'normal',
      lastActivity: '2024-01-20T12:28:41Z'
    }
  ];

  const quotaRules: QuotaRule[] = [
    {
      id: 1,
      name: 'Quota standard employés',
      type: 'bandwidth',
      limit: '100 GB',
      period: 'monthly',
      appliedTo: 'group',
      groupName: 'Employés',
      usersCount: 180,
      active: true
    },
    {
      id: 2,
      name: 'Limite IT équipe',
      type: 'bandwidth',
      limit: '200 GB',
      period: 'monthly',
      appliedTo: 'group',
      groupName: 'IT',
      usersCount: 25,
      active: true
    },
    {
      id: 3,
      name: 'Quota invités',
      type: 'bandwidth',
      limit: '10 GB',
      period: 'daily',
      appliedTo: 'group',
      groupName: 'Invités',
      usersCount: 43,
      active: true
    },
    {
      id: 4,
      name: 'Limite sessions simultanées',
      type: 'sessions',
      limit: '5',
      period: 'daily',
      appliedTo: 'all',
      usersCount: 278,
      active: false
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'normal':
        return { 
          color: 'text-green-400 bg-green-400/10 border-green-400/20', 
          icon: CheckCircle,
          label: 'Normal' 
        };
      case 'warning':
        return { 
          color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', 
          icon: AlertTriangle,
          label: 'Attention' 
        };
      case 'exceeded':
        return { 
          color: 'text-red-400 bg-red-400/10 border-red-400/20', 
          icon: XCircle,
          label: 'Dépassé' 
        };
      default:
        return { 
          color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', 
          icon: Clock,
          label: 'Inconnu' 
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bandwidth': return 'Bande passante';
      case 'storage': return 'Stockage';
      case 'sessions': return 'Sessions';
      case 'time': return 'Temps';
      default: return type;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Jour';
      case 'weekly': return 'Semaine';
      case 'monthly': return 'Mois';
      default: return period;
    }
  };

  const filteredUsers = userQuotas.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = Array.from(new Set(userQuotas.map(u => u.department)));

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            Gestion des quotas
          </h1>
          <p className="text-slate-400 mt-1">
            Surveillance et configuration des limites utilisateur
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
            Actualiser
          </Button>
          
          <Button
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quotaStats.map((stat, index) => {
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

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'users', label: 'Utilisateurs', icon: Users },
          { id: 'rules', label: 'Règles', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Distribution */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white font-mono">
                Distribution des quotas
              </h2>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300 font-mono">Normale (0-70%)</span>
                  <span className="text-sm text-slate-400 font-mono">156 utilisateurs</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300 font-mono">Attention (70-90%)</span>
                  <span className="text-sm text-slate-400 font-mono">67 utilisateurs</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300 font-mono">Dépassement (&gt;90%)</span>
                  <span className="text-sm text-slate-400 font-mono">24 utilisateurs</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Consumers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white font-mono">
                Plus gros consommateurs
              </h2>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="space-y-4">
              {userQuotas
                .sort((a, b) => b.monthlyPercent - a.monthlyPercent)
                .slice(0, 5)
                .map((user, index) => {
                  const statusConfig = getStatusConfig(user.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-mono text-slate-300">#{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium font-mono text-sm truncate">
                          {user.user.split('@')[0]}
                        </p>
                        <p className="text-slate-400 text-xs font-mono">
                          {user.department} • {user.monthlyUsed}/{user.monthlyLimit}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{user.monthlyPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 text-white px-4 py-2 pr-8 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tous les départements</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 text-white px-4 py-2 pr-8 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="normal">Normal</option>
                    <option value="warning">Attention</option>
                    <option value="exceeded">Dépassé</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                
                <Button variant="secondary" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exporter
                </Button>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white font-mono">
                Quotas utilisateurs ({filteredUsers.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      Quota journalier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      Quota mensuel
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      Dernière activité
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Aucun utilisateur trouvé</p>
                        <p className="text-slate-500 text-sm mt-1">
                          Modifiez vos filtres pour voir plus d'utilisateurs
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const statusConfig = getStatusConfig(user.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-white font-medium font-mono text-sm">
                                {user.user}
                              </div>
                              <div className="text-slate-400 text-xs font-mono">
                                {user.department}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-slate-300 text-sm font-mono">
                                {user.dailyUsed} / {user.dailyLimit}
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    user.dailyPercent > 100 ? 'bg-red-500' : 
                                    user.dailyPercent > 80 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(user.dailyPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-slate-300 text-sm font-mono">
                                {user.monthlyUsed} / {user.monthlyLimit}
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    user.monthlyPercent > 100 ? 'bg-red-500' : 
                                    user.monthlyPercent > 80 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(user.monthlyPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusConfig.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm font-mono">
                            {formatTimestamp(user.lastActivity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'rules' && (
        <Card>
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white font-mono">
                Règles de quotas ({quotaRules.length})
              </h2>
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle règle
              </Button>
            </div>
          </div>
          
          <div className="divide-y divide-slate-700">
            {quotaRules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium font-mono">
                        {rule.name}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-mono border ${
                        rule.active 
                          ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                          : 'bg-slate-400/10 text-slate-400 border-slate-400/20'
                      }`}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400 font-mono">Type:</span>
                        <p className="text-slate-300 font-mono">{getTypeLabel(rule.type)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono">Limite:</span>
                        <p className="text-slate-300 font-mono">{rule.limit}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono">Période:</span>
                        <p className="text-slate-300 font-mono">{getPeriodLabel(rule.period)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono">Utilisateurs:</span>
                        <p className="text-slate-300 font-mono">
                          {rule.usersCount} {rule.groupName && `(${rule.groupName})`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuotasPageNew;
