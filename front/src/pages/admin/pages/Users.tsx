import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginAttempts?: number;
  lockedUntil?: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      });

      const response = await axios.get(`/admin/users?${params}`);
      const data: UsersResponse = response.data.data;
      
      setUsers(data.users);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.totalCount);
    } catch (err: any) {
      setError('Failed to fetch users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-[#f85149] text-white';
      case 'ADMIN': return 'bg-[#1f6feb] text-white';
      case 'MODERATOR': return 'bg-[#f59e0b] text-black';
      default: return 'bg-[#21262d] text-[#e6edf3]';
    }
  };

  const getStatusIcon = (user: User) => {
    if (user.lockedUntil) {
      return <Lock className="w-4 h-4 text-[#f85149]" />;
    }
    if (user.isActive) {
      return <CheckCircle className="w-4 h-4 text-[#10b981]" />;
    }
    return <AlertCircle className="w-4 h-4 text-[#f59e0b]" />;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#f0f6fc] mb-2">User Management</h1>
          <p className="text-[#7d8590]">
            Manage all users, their roles, and access permissions
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-[#1f6feb] hover:bg-[#1158c7] text-white rounded-md transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UsersIcon className="w-8 h-8 text-[#1f6feb]" />
              <div>
                <p className="text-2xl font-bold text-[#f0f6fc]">{totalUsers}</p>
                <p className="text-sm text-[#7d8590]">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-8 h-8 text-[#10b981]" />
              <div>
                <p className="text-2xl font-bold text-[#f0f6fc]">
                  {users.filter(u => u.isActive).length}
                </p>
                <p className="text-sm text-[#7d8590]">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-8 h-8 text-[#f85149]" />
              <div>
                <p className="text-2xl font-bold text-[#f0f6fc]">
                  {users.filter(u => u.lockedUntil).length}
                </p>
                <p className="text-sm text-[#7d8590]">Locked Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-[#7c3aed]" />
              <div>
                <p className="text-2xl font-bold text-[#f0f6fc]">
                  {users.filter(u => u.lastLoginAt && 
                    new Date(u.lastLoginAt) > new Date(Date.now() - 24*60*60*1000)
                  ).length}
                </p>
                <p className="text-sm text-[#7d8590]">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7d8590]" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-3 py-2 bg-[#0d1117] border border-[#21262d] rounded-md text-[#e6edf3] placeholder-[#7d8590] focus:outline-none focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-[#7d8590]" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-[#0d1117] border border-[#21262d] rounded-md px-3 py-2 text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
                >
                  <option value="all">All Roles</option>
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#0d1117] border border-[#21262d] rounded-md px-3 py-2 text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#1f6feb]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-[#161b22] border-[#21262d]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({totalUsers})</span>
            <span className="text-sm font-normal text-[#7d8590]">
              Page {currentPage} of {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-[#f85149] mx-auto mb-4" />
              <p className="text-[#f85149] mb-2">Error loading users</p>
              <p className="text-[#7d8590]">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#21262d]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7d8590] uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7d8590] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7d8590] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7d8590] uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7d8590] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#7d8590] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#21262d] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-[#f0f6fc] font-medium">{user.username}</p>
                            <p className="text-[#7d8590] text-sm">{user.email}</p>
                            {user.firstName || user.lastName ? (
                              <p className="text-[#7d8590] text-xs">
                                {user.firstName} {user.lastName}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(user)}
                          <span className="text-[#e6edf3] text-sm">
                            {user.lockedUntil ? 'Locked' : user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#7d8590] text-sm">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#7d8590] text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-2 hover:bg-[#21262d] rounded-md text-[#7d8590] hover:text-[#e6edf3] transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-[#21262d] rounded-md text-[#7d8590] hover:text-[#e6edf3] transition-colors">
                            {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <button className="p-2 hover:bg-[#21262d] rounded-md text-[#7d8590] hover:text-[#f85149] transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-[#21262d] rounded-md text-[#7d8590] hover:text-[#e6edf3] transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#21262d] flex items-center justify-between">
              <p className="text-sm text-[#7d8590]">
                Showing {users.length} of {totalUsers} users
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-[#e6edf3] rounded text-sm transition-colors"
                >
                  Previous
                </button>
                <span className="text-[#7d8590] text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-[#e6edf3] rounded text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagementPage;
