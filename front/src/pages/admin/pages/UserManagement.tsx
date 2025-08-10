import React, { useState, useEffect } from 'react';
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
  Upload
} from 'lucide-react';
import { apiService } from '../../../services/apiService';

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

const UserManagement: React.FC = () => {
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
      // const response = await apiService.get(`/admin/users?page=${currentPage}&limit=${itemsPerPage}&search=${filters.search}&role=${filters.role}&status=${filters.status}&department=${filters.department}`);
      
      // Mock data for development
      const mockUsers: User[] = Array.from({ length: itemsPerPage }, (_, i) => ({
        id: `user-${currentPage}-${i + 1}`,
        name: `Utilisateur ${(currentPage - 1) * itemsPerPage + i + 1}`,
        email: `user${(currentPage - 1) * itemsPerPage + i + 1}@example.com`,
        role: ['admin', 'user', 'guest'][Math.floor(Math.random() * 3)] as 'admin' | 'user' | 'guest',
        status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as 'active' | 'inactive' | 'suspended',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        phone: Math.random() > 0.5 ? `+33 6 ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}` : undefined,
        department: ['IT', 'RH', 'Finance', 'Marketing', 'Ventes'][Math.floor(Math.random() * 5)],
        quotaUsed: Math.floor(Math.random() * 1000),
        quotaLimit: 1000,
        sessionsCount: Math.floor(Math.random() * 50)
      }));

      setUsers(mockUsers);
      setTotalUsers(234); // Mock total
      setTotalPages(Math.ceil(234 / itemsPerPage));
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

  const handleDeleteUsers = async (userIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userIds.length} utilisateur(s) ?`)) {
      return;
    }

    try {
      await Promise.all(userIds.map(id => apiService.delete(`/admin/users/${id}`)));
      await fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      setError('Erreur lors de la suppression des utilisateurs');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        // Bulk activate users
        break;
      case 'deactivate':
        // Bulk deactivate users
        break;
      case 'delete':
        await handleDeleteUsers(selectedUsers);
        break;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'guest':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="w-4 h-4" />;
      case 'inactive':
        return <Clock className="w-4 h-4" />;
      case 'suspended':
        return <UserX className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-600 mt-2">
            {totalUsers} utilisateurs au total
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => alert('Feature not implemented yet')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel utilisateur</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Importer</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="user">Utilisateur</option>
            <option value="guest">Invité</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les départements</option>
            <option value="IT">IT</option>
            <option value="RH">RH</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Ventes">Ventes</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-blue-800 font-medium">
              {selectedUsers.length} utilisateur(s) sélectionné(s)
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Activer
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Désactiver
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rôle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Département</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Quota</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Dernière connexion</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-slate-400">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      <span className="ml-1 capitalize">{user.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{user.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(user.quotaUsed / user.quotaLimit) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {user.quotaUsed}/{user.quotaLimit} MB
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          alert(`Edit user: ${user.name}`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUsers([user.id])}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Affichage {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, totalUsers)} sur {totalUsers} utilisateurs
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
