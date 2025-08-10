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
  Settings
} from 'lucide-react';
import { apiService } from '../../../services/apiService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'security' | 'user' | 'network' | 'database' | 'general';
  timestamp: string;
  read: boolean;
  actions?: {
    label: string;
    action: string;
  }[];
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'security' | 'user'>('all');
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Mock data for development
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Alerte de sécurité',
          message: 'Tentatives de connexion multiples détectées depuis l\'IP 192.168.1.45',
          type: 'warning',
          category: 'security',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read: false,
          actions: [
            { label: 'Bloquer IP', action: 'block_ip' },
            { label: 'Voir détails', action: 'view_details' }
          ]
        },
        {
          id: '2',
          title: 'Utilisateur créé',
          message: 'Nouvel utilisateur john.doe@company.com ajouté au système',
          type: 'success',
          category: 'user',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'Sauvegarde terminée',
          message: 'Sauvegarde automatique quotidienne terminée avec succès',
          type: 'success',
          category: 'system',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '4',
          title: 'Quota dépassé',
          message: 'L\'utilisateur alice@company.com a dépassé son quota de données (1.2GB/1GB)',
          type: 'warning',
          category: 'user',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: true,
          actions: [
            { label: 'Ajuster quota', action: 'adjust_quota' },
            { label: 'Contacter utilisateur', action: 'contact_user' }
          ]
        },
        {
          id: '5',
          title: 'Maintenance programmée',
          message: 'Maintenance système prévue le 15/08/2025 de 02:00 à 04:00',
          type: 'info',
          category: 'system',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.put(`/admin/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/admin/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.delete(`/admin/notifications/${notificationId}`);
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'system':
        return <Server className="w-4 h-4" />;
      case 'network':
        return <Network className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Centre de Notifications
          </h1>
          <p className="text-slate-600 mt-2">
            {unreadCount} notification(s) non lue(s) sur {notifications.length} au total
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Marquer tout comme lu
            </button>
          )}
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="relative p-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-700">Filtrer:</span>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'unread', label: 'Non lues' },
              { key: 'security', label: 'Sécurité' },
              { key: 'system', label: 'Système' },
              { key: 'user', label: 'Utilisateurs' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === f.key
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                notification.read ? 'bg-white border-slate-200' : getTypeColor(notification.type)
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(notification.type)}
                    <div className="text-slate-500">
                      {getCategoryIcon(notification.category)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className="text-slate-600 mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(notification.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      
                      {notification.actions && (
                        <div className="flex items-center space-x-2">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Marquer comme lu"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-slate-500">
              {filter === 'all' 
                ? 'Vous n\'avez aucune notification pour le moment.'
                : `Aucune notification ${filter === 'unread' ? 'non lue' : `de type "${filter}"`} trouvée.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
