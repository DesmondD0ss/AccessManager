import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit3,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  department?: string;
  quotaUsed: number;
  quotaLimit: number;
  sessionsCount: number;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  department: string;
}

const UserManagementGitHub: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: '',
    department: ''
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Mock data with GitHub-style structure
      const mockUsers: User[] = Array.from({ length: itemsPerPage }, (_, i) => ({
        id: `user-${currentPage}-${i + 1}`,
        name: `Utilisateur ${(currentPage - 1) * itemsPerPage + i + 1}`,
        email: `user${(currentPage - 1) * itemsPerPage + i + 1}@company.com`,
        role: ['admin', 'user', 'guest'][Math.floor(Math.random() * 3)] as 'admin' | 'user' | 'guest',
        status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as 'active' | 'inactive' | 'suspended',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        phone: Math.random() > 0.5 ? `+33 6 ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}` : undefined,
        department: ['Développement', 'Ressources Humaines', 'Finance', 'Marketing', 'Ventes'][Math.floor(Math.random() * 5)],
        quotaUsed: Math.floor(Math.random() * 1000),
        quotaLimit: 1000,
        sessionsCount: Math.floor(Math.random() * 50)
      }));

      setUsers(mockUsers);
      setTotalUsers(247); // Mock total matching the dashboard
      setTotalPages(Math.ceil(247 / itemsPerPage));
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 icon-warning" />;
      case 'user':
        return <UserCheck className="w-4 h-4 icon-success" />;
      case 'guest':
        return <UserX className="w-4 h-4 text-fg-muted" />;
      default:
        return <Users className="w-4 h-4 text-fg-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'active':
        return (
          <span className={`${baseClasses} status-success`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Actif
          </span>
        );
      case 'inactive':
        return (
          <span className={`${baseClasses} bg-canvas-subtle text-fg-muted border border-default`}>
            <Clock className="w-3 h-3 mr-1" />
            Inactif
          </span>
        );
      case 'suspended':
        return (
          <span className={`${baseClasses} status-error`}>
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspendu
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getQuotaUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-canvas-default min-h-screen p-6">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-fg-default mb-2">Erreur de chargement</h3>
              <p className="text-fg-muted">{error}</p>
              <button 
                onClick={fetchUsers}
                className="btn btn-primary mt-4"
              >
                Réessayer
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-canvas-default min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg-default">Gestion des Utilisateurs</h1>
            <p className="text-fg-muted mt-1">
              Gérez les comptes utilisateurs, les rôles et les permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-default">
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </button>
            <button className="btn btn-default">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Total</p>
                  <p className="text-2xl font-bold text-fg-default">{totalUsers}</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <Users className="h-6 w-6 icon-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Actifs</p>
                  <p className="text-2xl font-bold text-fg-default">189</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <UserCheck className="h-6 w-6 icon-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Admins</p>
                  <p className="text-2xl font-bold text-fg-default">12</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <Shield className="h-6 w-6 icon-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-muted">Suspendus</p>
                  <p className="text-2xl font-bold text-fg-default">3</p>
                </div>
                <div className="h-12 w-12 bg-canvas-subtle rounded-md flex items-center justify-center">
                  <UserX className="h-6 w-6 icon-error" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email..."
                    className="input pl-10 w-full"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
              <select
                className="input w-full sm:w-40"
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Admin</option>
                <option value="user">Utilisateur</option>
                <option value="guest">Invité</option>
              </select>
              <select
                className="input w-full sm:w-40"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Utilisateurs ({totalUsers})</CardTitle>
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-fg-muted">
                    {selectedUsers.length} sélectionné(s)
                  </span>
                  <button className="btn btn-default btn-sm">
                    Actions en lot
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-canvas-subtle border-b border-default">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded border-default"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">
                      Quota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-fg-muted uppercase tracking-wider">
                      Dernière connexion
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-canvas-subtle transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-default"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-fg-default">{user.name}</div>
                            <div className="text-sm text-fg-muted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className="ml-2 text-sm text-fg-default capitalize">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-canvas-subtle rounded-full h-2 mr-2">
                            <div
                              className="bg-accent h-2 rounded-full"
                              style={{ width: `${getQuotaUsagePercentage(user.quotaUsed, user.quotaLimit)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-fg-muted">
                            {getQuotaUsagePercentage(user.quotaUsed, user.quotaLimit)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-fg-muted">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="btn btn-ghost btn-sm">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="btn btn-ghost btn-sm">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="btn btn-ghost btn-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-default">
              <div className="flex items-center justify-between">
                <div className="text-sm text-fg-muted">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalUsers)} sur {totalUsers} utilisateurs
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-default btn-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-fg-muted">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-default btn-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagementGitHub;
