import React, { useState } from 'react';
import { Clock, User, Shield, AlertCircle, CheckCircle, XCircle, Filter, Search } from 'lucide-react';

const ActivityPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const activities = [
    {
      id: 1,
      type: 'login',
      user: 'john.doe@company.com',
      action: 'Connexion réussie',
      timestamp: '2024-01-20 14:32:15',
      ip: '192.168.1.45',
      status: 'success',
      details: 'Authentification par mot de passe'
    },
    {
      id: 2,
      type: 'security',
      user: 'admin@system',
      action: 'Modification des règles de sécurité',
      timestamp: '2024-01-20 14:28:42',
      ip: '10.0.0.1',
      status: 'success',
      details: 'Mise à jour des politiques de mot de passe'
    },
    {
      id: 3,
      type: 'error',
      user: 'jane.smith@company.com',
      action: 'Tentative de connexion échouée',
      timestamp: '2024-01-20 14:25:33',
      ip: '192.168.1.67',
      status: 'error',
      details: 'Mot de passe incorrect (3ème tentative)'
    },
    {
      id: 4,
      type: 'system',
      user: 'system',
      action: 'Sauvegarde automatique effectuée',
      timestamp: '2024-01-20 14:00:00',
      ip: 'localhost',
      status: 'success',
      details: 'Sauvegarde complète de la base de données'
    },
    {
      id: 5,
      type: 'user',
      user: 'admin@system',
      action: 'Création d\'un nouvel utilisateur',
      timestamp: '2024-01-20 13:45:18',
      ip: '10.0.0.1',
      status: 'success',
      details: 'Utilisateur: mike.johnson@company.com'
    },
    {
      id: 6,
      type: 'network',
      user: 'system',
      action: 'Blocage d\'adresse IP suspecte',
      timestamp: '2024-01-20 13:30:25',
      ip: '203.45.67.89',
      status: 'warning',
      details: 'IP ajoutée à la liste noire automatiquement'
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
        return Clock;
      case 'user':
        return User;
      case 'network':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500 bg-green-50';
      case 'error':
        return 'text-red-500 bg-red-50';
      case 'warning':
        return 'text-orange-500 bg-orange-50';
      default:
        return 'text-slate-500 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return CheckCircle;
      case 'error':
        return XCircle;
      case 'warning':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = selectedFilter === 'all' || activity.type === selectedFilter;
    const matchesSearch = searchTerm === '' || 
      activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Activité du système</h1>
          <p className="text-slate-600">Suivi en temps réel de toutes les activités et événements</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Aujourd'hui</p>
              <p className="text-2xl font-bold text-slate-900">247</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Connexions</p>
              <p className="text-2xl font-bold text-slate-900">89</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <User className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Erreurs</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Alertes</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="login">Connexions</option>
              <option value="security">Sécurité</option>
              <option value="system">Système</option>
              <option value="user">Utilisateurs</option>
              <option value="network">Réseau</option>
              <option value="error">Erreurs</option>
            </select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une activité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Journal d'activité</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredActivities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);
            const StatusIcon = getStatusIcon(activity.status);
            
            return (
              <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                    <ActivityIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-900">{activity.action}</h3>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(activity.status).split(' ')[0]}`} />
                        <span className="text-xs text-slate-500">{activity.timestamp}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Utilisateur:</span> {activity.user}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>IP: {activity.ip}</span>
                      <span>{activity.details}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredActivities.length === 0 && (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune activité trouvée</h3>
            <p className="text-slate-500">Essayez de modifier les filtres ou le terme de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
