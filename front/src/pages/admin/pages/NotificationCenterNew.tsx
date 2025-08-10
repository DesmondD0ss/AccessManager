import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  User,
  Shield,
  Server,
  Database,
  Network,
  Search,
  Trash2,
  Check,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'security' | 'user' | 'network' | 'database' | 'general';
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: {
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}

const NotificationCenterNew: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'security' | 'user' | 'network'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Nouvelle tentative de connexion suspecte',
          message: 'Plusieurs tentatives de connexion échouées détectées depuis l\'IP 203.45.67.89',
          type: 'warning',
          category: 'security',
          timestamp: '2024-01-20T14:32:15Z',
          read: false,
          priority: 'high',
          actions: [
            { label: 'Bloquer IP', action: 'block_ip', variant: 'danger' },
            { label: 'Voir détails', action: 'view_details', variant: 'secondary' }
          ]
        },
        {
          id: '2',
          title: 'Sauvegarde automatique terminée',
          message: 'La sauvegarde quotidienne de la base de données a été complétée avec succès (2.4 GB)',
          type: 'success',
          category: 'database',
          timestamp: '2024-01-20T14:00:00Z',
          read: true,
          priority: 'low'
        },
        {
          id: '3',
          title: 'Quota utilisateur dépassé',
          message: 'L\'utilisateur john.doe@company.com a dépassé son quota de bande passante mensuel',
          type: 'warning',
          category: 'user',
          timestamp: '2024-01-20T13:45:18Z',
          read: false,
          priority: 'medium',
          actions: [
            { label: 'Augmenter quota', action: 'increase_quota', variant: 'primary' },
            { label: 'Contacter utilisateur', action: 'contact_user', variant: 'secondary' }
          ]
        },
        {
          id: '4',
          title: 'Mise à jour système disponible',
          message: 'AccessManager v2.1.4 est disponible avec des corrections de sécurité importantes',
          type: 'info',
          category: 'system',
          timestamp: '2024-01-20T12:30:00Z',
          read: false,
          priority: 'medium',
          actions: [
            { label: 'Planifier mise à jour', action: 'schedule_update', variant: 'primary' },
            { label: 'Voir notes de version', action: 'view_changelog', variant: 'secondary' }
          ]
        },
        {
          id: '5',
          title: 'Erreur de connexion réseau',
          message: 'Perte de connexion temporaire avec le serveur de sauvegarde externe',
          type: 'error',
          category: 'network',
          timestamp: '2024-01-20T11:15:30Z',
          read: true,
          priority: 'critical',
          actions: [
            { label: 'Diagnostiquer', action: 'diagnose', variant: 'primary' }
          ]
        },
        {
          id: '6',
          title: 'Nouvel utilisateur enregistré',
          message: 'sarah.wilson@company.com s\'est enregistrée et attend l\'approbation d\'un administrateur',
          type: 'info',
          category: 'user',
          timestamp: '2024-01-20T10:22:45Z',
          read: false,
          priority: 'medium',
          actions: [
            { label: 'Approuver', action: 'approve_user', variant: 'primary' },
            { label: 'Rejeter', action: 'reject_user', variant: 'danger' }
          ]
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'system': return Server;
      case 'user': return User;
      case 'network': return Network;
      case 'database': return Database;
      default: return Info;
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'success':
        return { 
          color: 'text-green-400 bg-green-400/10 border-green-400/20', 
          icon: CheckCircle 
        };
      case 'warning':
        return { 
          color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', 
          icon: AlertTriangle 
        };
      case 'error':
        return { 
          color: 'text-red-400 bg-red-400/10 border-red-400/20', 
          icon: XCircle 
        };
      case 'info':
        return { 
          color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', 
          icon: Info 
        };
      default:
        return { 
          color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', 
          icon: Info 
        };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(notif => !notif.read));
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      notification.category === filter;
    
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesPriority && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-slate-800 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Centre de notifications
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-mono">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">
            Gestion des notifications système et alertes
            {criticalCount > 0 && (
              <span className="text-red-400 ml-2">
                • {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </span>
            )}
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
            variant="secondary"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Tout marquer lu
          </Button>
          
          <Button
            variant="danger"
            onClick={deleteAllRead}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer lues
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Total</p>
              <p className="text-2xl font-bold text-white font-mono">{notifications.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Bell className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Non lues</p>
              <p className="text-2xl font-bold text-white font-mono">{unreadCount}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Sécurité</p>
              <p className="text-2xl font-bold text-white font-mono">
                {notifications.filter(n => n.category === 'security').length}
              </p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Critiques</p>
              <p className="text-2xl font-bold text-white font-mono">{criticalCount}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <XCircle className="w-6 h-6 text-purple-400" />
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
                placeholder="Rechercher dans les notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-slate-800 border border-slate-700 text-white px-4 py-2 pr-8 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes</option>
                <option value="unread">Non lues</option>
                <option value="system">Système</option>
                <option value="security">Sécurité</option>
                <option value="user">Utilisateurs</option>
                <option value="network">Réseau</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 text-white px-4 py-2 pr-8 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes priorités</option>
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

      {/* Notifications List */}
      <Card>
        <div className="divide-y divide-slate-700">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucune notification trouvée</p>
              <p className="text-slate-500 text-sm mt-1">
                Modifiez vos filtres pour voir plus de notifications
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const CategoryIcon = getCategoryIcon(notification.category);
              const typeConfig = getTypeConfig(notification.type);
              const TypeIcon = typeConfig.icon;
              
              return (
                <div 
                  key={notification.id} 
                  className={`p-6 hover:bg-slate-800/30 transition-colors ${
                    !notification.read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${typeConfig.color} border flex-shrink-0`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`font-medium font-mono ${
                              notification.read ? 'text-slate-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-mono border ${getPriorityColor(notification.priority)}`}>
                              {notification.priority.toUpperCase()}
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className="text-slate-400 text-sm mb-3">
                            {notification.message}
                          </p>
                          
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {notification.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant={action.variant || 'secondary'}
                                  className="text-xs px-3 py-1"
                                  onClick={() => console.log(`Action: ${action.action}`)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono border ${typeConfig.color}`}>
                              <TypeIcon className="w-3 h-3" />
                              <span>{notification.type.toUpperCase()}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 text-slate-400 hover:text-white transition-colors"
                                  title="Marquer comme lu"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                title="Supprimer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-slate-500 text-xs font-mono">
                            {formatTimestamp(notification.timestamp)}
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

export default NotificationCenterNew;
