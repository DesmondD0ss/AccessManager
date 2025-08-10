import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  AlertTriangle,
  Mail,
  Calendar,
  Globe,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  department: string;
  lastLogin: string;
  createdAt: string;
  sessionsCount: number;
  dataUsage: number;
  country: string;
  avatar?: string;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  department: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  newThisMonth: number;
  activeToday: number;
}

const UserManagementNew: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    newThisMonth: 0,
    activeToday: 0
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: '',
    department: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      role: 'admin',
      status: 'active',
      department: 'IT',
      lastLogin: '2025-01-04T09:30:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      sessionsCount: 145,
      dataUsage: 2.4,
      country: 'France'
    },
    {
      id: '2',
      name: 'Marie Martin',
      email: 'marie.martin@example.com',
      role: 'user',
      status: 'active',
      department: 'Marketing',
      lastLogin: '2025-01-04T08:15:00Z',
      createdAt: '2024-03-10T14:30:00Z',
      sessionsCount: 89,
      dataUsage: 1.8,
      country: 'France'
    },
    {
      id: '3',
      name: 'Pierre Durand',
      email: 'pierre.durand@example.com',
      role: 'user',
      status: 'inactive',
      department: 'Sales',
      lastLogin: '2025-01-02T16:45:00Z',
      createdAt: '2024-06-20T09:15:00Z',
      sessionsCount: 34,
      dataUsage: 0.9,
      country: 'France'
    },
    {
      id: '4',
      name: 'Sophie Bernard',
      email: 'sophie.bernard@example.com',
      role: 'user',
      status: 'suspended',
      department: 'HR',
      lastLogin: '2024-12-28T11:20:00Z',
      createdAt: '2024-09-05T13:45:00Z',
      sessionsCount: 67,
      dataUsage: 1.3,
      country: 'France'
    },
    {
      id: '5',
      name: 'Thomas Petit',
      email: 'thomas.petit@example.com',
      role: 'guest',
      status: 'pending',
      department: 'Support',
      lastLogin: 'Never',
      createdAt: '2025-01-03T15:30:00Z',
      sessionsCount: 0,
      dataUsage: 0,
      country: 'France'
    }
  ];

  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter users based on current filters
      let filteredUsers = mockUsers;

      if (filters.search) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }

      if (filters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }

      if (filters.department) {
        filteredUsers = filteredUsers.filter(user => user.department === filters.department);
      }

      // Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      setUsers(paginatedUsers);
      setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));

      // Calculate stats
      const stats: UserStats = {
        total: mockUsers.length,
        active: mockUsers.filter(u => u.status === 'active').length,
        inactive: mockUsers.filter(u => u.status === 'inactive').length,
        suspended: mockUsers.filter(u => u.status === 'suspended').length,
        newThisMonth: mockUsers.filter(u => {
          const created = new Date(u.createdAt);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length,
        activeToday: mockUsers.filter(u => {
          if (u.lastLogin === 'Never') return false;
          const lastLogin = new Date(u.lastLogin);
          const today = new Date();
          return lastLogin.toDateString() === today.toDateString();
        }).length
      };
      setStats(stats);

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'suspended':
        return <UserX className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'guest':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatLastLogin = (lastLogin: string) => {
    if (lastLogin === 'Never') return 'Jamais';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    
    return date.toLocaleDateString('fr-FR');
  };

  const formatDataUsage = (usage: number) => {
    if (usage >= 1) return `${usage.toFixed(1)} GB`;
    return `${(usage * 1024).toFixed(0)} MB`;
  };

  const handleCreateUser = () => {
    console.log('Creating new user - modal would open here');
  };

  const handleEditUser = (user: User) => {
    console.log('Editing user:', user.id);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      console.log('Deleting user:', userId);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for users:`, selectedUsers);
  };

  const departments = ['IT', 'Marketing', 'Sales', 'HR', 'Support', 'Finance'];

  if (loading && !users.length) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chargement des utilisateurs</h3>
            <p className="text-slate-600">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des Utilisateurs</h1>
          <p className="text-slate-600">Gérez les comptes utilisateurs et leurs permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleCreateUser}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Actifs</p>
                <p className="text-xl font-bold text-slate-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Inactifs</p>
                <p className="text-xl font-bold text-slate-900">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Suspendus</p>
                <p className="text-xl font-bold text-slate-900">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ce mois</p>
                <p className="text-xl font-bold text-slate-900">{stats.newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Aujourd'hui</p>
                <p className="text-xl font-bold text-slate-900">{stats.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="">Tous les rôles</option>
                  <option value="admin">Admin</option>
                  <option value="user">Utilisateur</option>
                  <option value="guest">Invité</option>
                </select>

                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                  <option value="pending">En attente</option>
                </select>

                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  <option value="">Tous les départements</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleBulkAction('activate')}>
                    Activer ({selectedUsers.length})
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
                    Supprimer ({selectedUsers.length})
                  </Button>
                </div>
              )}
              <Button variant="secondary" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Liste des Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Utilisateur</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Rôle</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Statut</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Département</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Dernière connexion</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Sessions</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700">{user.department}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="text-slate-900">{formatLastLogin(user.lastLogin)}</div>
                        <div className="text-slate-500 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {user.country}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="text-slate-900">{user.sessionsCount}</div>
                        <div className="text-slate-500">{formatDataUsage(user.dataUsage)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-slate-600 mb-6">
              {Object.values(filters).some(f => f) 
                ? 'Aucun utilisateur ne correspond aux critères de recherche.'
                : 'Commencez par créer votre premier utilisateur.'
              }
            </p>
            {!Object.values(filters).some(f => f) && (
              <Button onClick={handleCreateUser}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un utilisateur
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagementNew;
