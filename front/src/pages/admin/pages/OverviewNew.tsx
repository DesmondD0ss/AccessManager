import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { 
  Users, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Clock,
  Server,
  UserCheck,
  Globe,
  BarChart3,
  Shield,
  Zap,
  Eye,
  RefreshCw,
  ArrowUp,
  CheckCircle,
  Settings,
  FileText,
  Network,
  Bell,
  Plus,
  Search,
  Filter,
  Download,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';

// Dashboard data interfaces
interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    locked: number;
    activeRate: number;
  };
  sessions: {
    active: number;
    today: number;
    thisWeek: number;
    quotaExceeded: number;
    averagePerDay: number;
  };
  dataUsage: {
    todayMB: number;
    thisWeekMB: number;
    thisMonthMB: number;
    averagePerDayMB: number;
    averagePerUserMB: number;
  };
  timeUsage: {
    todayHours: number;
    thisWeekHours: number;
    averagePerDayHours: number;
  };
  alerts: {
    total: number;
    lockedUsers: number;
    quotaExceeded: number;
    recentErrors: number;
  };
  system: {
    uptime: number;
    memoryUsage: {
      usedMB: number;
      totalMB: number;
      usage: number;
    };
    cpuUsage: number;
    diskUsage: number;
    nodeVersion: string;
    environment: string;
  };
  topUsers: Array<{
    user: { username: string; email: string };
    dataUsedMB: number;
    timeUsedHours: number;
  }>;
  recentActivity: Array<{
    id: string;
    user: { username: string };
    startTime: string;
    status: string;
    dataUsedMB: number;
    ipAddress: string;
  }>;
  networkStats: {
    totalBandwidth: number;
    usedBandwidth: number;
    activeConnections: number;
    blockedRequests: number;
  };
}

const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get('/admin/dashboard');
      setData(response.data.data.dashboard);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
      // Mock data for development
      setData({
        users: { total: 156, active: 89, newToday: 12, newThisWeek: 34, locked: 3, activeRate: 57 },
        sessions: { active: 45, today: 123, thisWeek: 567, quotaExceeded: 8, averagePerDay: 81 },
        dataUsage: { todayMB: 15420, thisWeekMB: 98765, thisMonthMB: 387650, averagePerDayMB: 14109, averagePerUserMB: 2483 },
        timeUsage: { todayHours: 234, thisWeekHours: 1456, averagePerDayHours: 208 },
        alerts: { total: 5, lockedUsers: 3, quotaExceeded: 8, recentErrors: 2 },
        system: { uptime: 2847329, memoryUsage: { usedMB: 2048, totalMB: 8192, usage: 25 }, cpuUsage: 34, diskUsage: 67, nodeVersion: 'v18.17.0', environment: 'production' },
        topUsers: [
          { user: { username: 'john_doe', email: 'john@example.com' }, dataUsedMB: 2048, timeUsedHours: 45 },
          { user: { username: 'jane_smith', email: 'jane@example.com' }, dataUsedMB: 1856, timeUsedHours: 42 }
        ],
        recentActivity: [
          { id: '1', user: { username: 'alice_wilson' }, startTime: new Date().toISOString(), status: 'ACTIVE', dataUsedMB: 128, ipAddress: '192.168.1.45' },
          { id: '2', user: { username: 'bob_johnson' }, startTime: new Date().toISOString(), status: 'TERMINATED', dataUsedMB: 256, ipAddress: '192.168.1.67' }
        ],
        networkStats: { totalBandwidth: 1000, usedBandwidth: 340, activeConnections: 67, blockedRequests: 12 }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f6fc] mb-2">Admin Dashboard</h1>
            <p className="text-[#7d8590]">System overview and management</p>
          </div>
        </div>
        
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-[#f85149] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#f0f6fc] mb-2">Error Loading Dashboard</h3>
              <p className="text-[#7d8590] mb-4">{error}</p>
              <Button onClick={fetchData} className="bg-[#1f6feb] hover:bg-[#1158c7] text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#f0f6fc] mb-2">
            Welcome back, {user?.username}
          </h1>
          <p className="text-[#7d8590] text-lg">
            Here's what's happening with your Zentry system today
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2 text-sm text-[#7d8590]">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span>Live data</span>
            <span>•</span>
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchData}
              disabled={refreshing}
              className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button className="bg-[#1f6feb] hover:bg-[#1158c7] text-white">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">Total Users</CardTitle>
            <div className="p-2 bg-[#1f6feb] bg-opacity-20 rounded-lg">
              <Users className="h-5 w-5 text-[#1f6feb]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f0f6fc] mb-2">{data?.users.total.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-[#10b981] text-sm">
                <ArrowUp className="h-3 w-3 mr-1" />
                <span>{data?.users.active} active</span>
              </div>
              <span className="text-[#7d8590] text-sm">{data?.users.activeRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">Active Sessions</CardTitle>
            <div className="p-2 bg-[#10b981] bg-opacity-20 rounded-lg">
              <Activity className="h-5 w-5 text-[#10b981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f0f6fc] mb-2">{data?.sessions.active}</div>
            <div className="flex items-center justify-between">
              <span className="text-[#7d8590] text-sm">{data?.sessions.today} today</span>
              <span className="text-[#7d8590] text-sm">avg {data?.sessions.averagePerDay}/day</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">Data Usage Today</CardTitle>
            <div className="p-2 bg-[#7c3aed] bg-opacity-20 rounded-lg">
              <Database className="h-5 w-5 text-[#7c3aed]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#f0f6fc] mb-2">
              {formatBytes(data?.dataUsage.todayMB || 0)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7d8590] text-sm">
                {formatBytes(data?.dataUsage.thisWeekMB || 0)} this week
              </span>
              <TrendingUp className="h-4 w-4 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">System Status</CardTitle>
            <div className={`p-2 rounded-lg ${(data?.alerts.total || 0) > 0 ? 'bg-[#f85149] bg-opacity-20' : 'bg-[#10b981] bg-opacity-20'}`}>
              <Server className={`h-5 w-5 ${(data?.alerts.total || 0) > 0 ? 'text-[#f85149]' : 'text-[#10b981]'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold mb-2 ${(data?.alerts.total || 0) > 0 ? 'text-[#f85149]' : 'text-[#10b981]'}`}>
              {(data?.alerts.total || 0) > 0 ? `${data?.alerts.total} Issues` : 'Healthy'}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7d8590] text-sm">
                {formatUptime(data?.system.uptime || 0)} uptime
              </span>
              <CheckCircle className="h-4 w-4 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance & Network Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-[#10b981]" />
              <span>System Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Memory Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-[#7d8590]" />
                  <span className="text-[#7d8590] text-sm">Memory Usage</span>
                </div>
                <div className="text-right">
                  <span className="text-[#f0f6fc] font-medium">{data?.system.memoryUsage.usage}%</span>
                  <div className="text-xs text-[#7d8590]">{data?.system.memoryUsage.usedMB}MB / {data?.system.memoryUsage.totalMB}MB</div>
                </div>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#10b981] to-[#1f6feb] h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(data?.system.memoryUsage.usage || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* CPU Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#7d8590]" />
                  <span className="text-[#7d8590] text-sm">CPU Usage</span>
                </div>
                <span className="text-[#f0f6fc] font-medium">{data?.system.cpuUsage}%</span>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#7c3aed] to-[#f59e0b] h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(data?.system.cpuUsage || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Disk Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-[#7d8590]" />
                  <span className="text-[#7d8590] text-sm">Disk Usage</span>
                </div>
                <span className="text-[#f0f6fc] font-medium">{data?.system.diskUsage}%</span>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#f85149] to-[#ff6b35] h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(data?.system.diskUsage || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* System Info */}
            <div className="pt-2 border-t border-[#21262d] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Environment</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  data?.system.environment === 'production' 
                    ? 'bg-[#1f6feb] text-white' 
                    : 'bg-[#f59e0b] text-black'
                }`}>
                  {data?.system.environment}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Node.js</span>
                <span className="text-[#f0f6fc] font-medium">{data?.system.nodeVersion}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Overview */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-[#1f6feb]" />
              <span>Network Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bandwidth Usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-[#7d8590]" />
                  <span className="text-[#7d8590] text-sm">Bandwidth Usage</span>
                </div>
                <div className="text-right">
                  <span className="text-[#f0f6fc] font-medium">
                    {data?.networkStats.usedBandwidth} / {data?.networkStats.totalBandwidth} Mbps
                  </span>
                  <div className="text-xs text-[#7d8590]">
                    {Math.round(((data?.networkStats.usedBandwidth || 0) / (data?.networkStats.totalBandwidth || 1)) * 100)}% utilized
                  </div>
                </div>
              </div>
              <div className="w-full bg-[#21262d] rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#1f6feb] to-[#7c3aed] h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(((data?.networkStats.usedBandwidth || 0) / (data?.networkStats.totalBandwidth || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Network Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0d1117] rounded-lg border border-[#21262d]">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-[#10b981]" />
                  <span className="text-[#7d8590] text-sm">Active Connections</span>
                </div>
                <div className="text-2xl font-bold text-[#f0f6fc]">{data?.networkStats.activeConnections}</div>
              </div>
              
              <div className="p-4 bg-[#0d1117] rounded-lg border border-[#21262d]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[#f85149]" />
                  <span className="text-[#7d8590] text-sm">Blocked Requests</span>
                </div>
                <div className="text-2xl font-bold text-[#f0f6fc]">{data?.networkStats.blockedRequests}</div>
              </div>
            </div>

            {/* Quick Network Actions */}
            <div className="pt-2 border-t border-[#21262d] space-y-2">
              <Button className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Network Configuration
              </Button>
              <Button className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Network Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-[#f59e0b]" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-[#1f6feb] hover:bg-[#1158c7] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
            <Button className="w-full justify-start bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d]">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d]">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button className="w-full justify-start bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d]">
              <FileText className="h-4 w-4 mr-2" />
              System Logs
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-[#f85149]" />
                <span>System Alerts</span>
              </div>
              <span className="px-2 py-1 bg-[#f85149] bg-opacity-20 text-[#f85149] rounded-full text-xs">
                {data?.alerts.total || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.alerts.total || 0) > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 bg-[#f85149] bg-opacity-10 rounded-lg border border-[#f85149] border-opacity-30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#f85149]" />
                    <span className="text-[#f85149] text-sm">High Priority</span>
                  </div>
                  <span className="text-[#f85149] font-medium">{data?.alerts.recentErrors}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#f59e0b] bg-opacity-10 rounded-lg border border-[#f59e0b] border-opacity-30">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#f59e0b]" />
                    <span className="text-[#f59e0b] text-sm">Locked Users</span>
                  </div>
                  <span className="text-[#f59e0b] font-medium">{data?.alerts.lockedUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#7c3aed] bg-opacity-10 rounded-lg border border-[#7c3aed] border-opacity-30">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#7c3aed]" />
                    <span className="text-[#7c3aed] text-sm">Quota Exceeded</span>
                  </div>
                  <span className="text-[#7c3aed] font-medium">{data?.alerts.quotaExceeded}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-[#10b981] mx-auto mb-3" />
                <p className="text-[#7d8590] text-sm">No active alerts</p>
                <p className="text-[#10b981] text-sm">System running normally</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data & Time Usage */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-[#7c3aed]" />
              <span>Usage Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Data consumed this week</span>
                <span className="text-[#f0f6fc] font-medium">
                  {formatBytes(data?.dataUsage.thisWeekMB || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Time spent this week</span>
                <span className="text-[#f0f6fc] font-medium">{data?.timeUsage.thisWeekHours}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Average per user</span>
                <span className="text-[#f0f6fc] font-medium">
                  {formatBytes(data?.dataUsage.averagePerUserMB || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Daily average</span>
                <span className="text-[#f0f6fc] font-medium">
                  {formatBytes(data?.dataUsage.averagePerDayMB || 0)}
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#21262d]">
              <Button className="w-full bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Usage Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-[#10b981]" />
                <span>Top Users This Week</span>
              </div>
              <Button className="bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-[#f0f6fc]">
                <Eye className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topUsers.slice(0, 5).map((userStat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#21262d] hover:border-[#30363d] transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {userStat.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#10b981] rounded-full border-2 border-[#161b22]"></div>
                    </div>
                    <div>
                      <p className="text-[#f0f6fc] font-medium text-sm">{userStat.user.username}</p>
                      <p className="text-[#7d8590] text-xs">{userStat.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f0f6fc] font-medium text-sm">{formatBytes(userStat.dataUsedMB)}</p>
                    <p className="text-[#7d8590] text-xs">{userStat.timeUsedHours}h online</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-[#1f6feb]" />
                <span>Recent Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <Button className="bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-[#f0f6fc]">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button className="bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-[#f0f6fc]">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-lg border border-[#21262d] hover:border-[#30363d] transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'ACTIVE' ? 'bg-[#10b981] animate-pulse' : 
                      activity.status === 'TERMINATED' ? 'bg-[#7d8590]' : 'bg-[#f85149]'
                    }`}></div>
                    <div>
                      <p className="text-[#f0f6fc] font-medium text-sm">{activity.user.username}</p>
                      <p className="text-[#7d8590] text-xs">
                        {new Date(activity.startTime).toLocaleString()} • {activity.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f0f6fc] text-sm">{formatBytes(activity.dataUsedMB)}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'ACTIVE' ? 'bg-[#10b981] bg-opacity-20 text-[#10b981] border border-[#10b981] border-opacity-30' : 
                      activity.status === 'TERMINATED' ? 'bg-[#7d8590] bg-opacity-20 text-[#7d8590] border border-[#7d8590] border-opacity-30' : 
                      'bg-[#f85149] bg-opacity-20 text-[#f85149] border border-[#f85149] border-opacity-30'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
