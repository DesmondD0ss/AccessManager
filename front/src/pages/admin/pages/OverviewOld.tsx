import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { 
  Users, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Clock,
  Server,
  BarChart3,
  Zap,
  Eye
} from 'lucide-react';

// Dashboard data interfaces
interface DashboardData {
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
}

const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/admin/dashboard');
        setData(response.data.data.dashboard);
      } catch (err: any) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] mb-2">Admin Dashboard</h1>
            <p className="text-[#7d8590]">System overview and management</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-[#f85149] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#f0f6fc] mb-2">Error Loading Dashboard</h3>
              <p className="text-[#7d8590]">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] mb-2">Admin Dashboard</h1>
            <p className="text-[#7d8590]">System overview and management</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Database className="w-12 h-12 text-[#7d8590] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#f0f6fc] mb-2">No Data Available</h3>
              <p className="text-[#7d8590]">Dashboard data could not be loaded</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#f0f6fc] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-[#7d8590] text-lg">
            Welcome back, {user?.username}. Here's your system overview.
          </p>
        </div>
        
        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#21262d] rounded-lg">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-[#10b981] text-sm font-medium">Live</span>
          </div>
          <div className="text-[#7d8590] text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* System Status Alert */}
      {data.alerts.total > 0 && (
        <Card className="border-[#f85149] border-l-4 bg-[#f85149] bg-opacity-5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-[#f85149] flex-shrink-0" />
            <div>
              <p className="text-[#f0f6fc] font-medium">
                {data.alerts.total} system alert{data.alerts.total > 1 ? 's' : ''} require attention
              </p>
              <p className="text-[#7d8590] text-sm">
                {data.alerts.lockedUsers} locked users, {data.alerts.quotaExceeded} quota exceeded, {data.alerts.recentErrors} recent errors
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <Card className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border-[#21262d] hover:border-[#30363d] transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">Total Users</CardTitle>
            <div className="p-2 bg-[#1f6feb] bg-opacity-20 rounded-lg">
              <Users className="h-5 w-5 text-[#1f6feb]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#f0f6fc]">{data.users.total.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#10b981] text-sm font-medium">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {data.users.active} active
                </div>
                <div className="h-1 w-1 bg-[#7d8590] rounded-full"></div>
                <span className="text-[#7d8590] text-sm">{data.users.activeRate.toFixed(1)}% rate</span>
              </div>
              <div className="text-xs text-[#7d8590]">
                +{data.users.newToday} today, +{data.users.newThisWeek} this week
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border-[#21262d] hover:border-[#30363d] transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">Active Sessions</CardTitle>
            <div className="p-2 bg-[#10b981] bg-opacity-20 rounded-lg">
              <Activity className="h-5 w-5 text-[#10b981]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#f0f6fc]">{data.sessions.active}</div>
              <div className="flex items-center gap-2">
                <span className="text-[#7d8590] text-sm">{data.sessions.today} today</span>
                <div className="h-1 w-1 bg-[#7d8590] rounded-full"></div>
                <span className="text-[#7d8590] text-sm">avg {data.sessions.averagePerDay}/day</span>
              </div>
              <div className="text-xs text-[#7d8590]">
                {data.sessions.thisWeek} sessions this week
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage Card */}
        <Card className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border-[#21262d] hover:border-[#30363d] transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">Data Usage Today</CardTitle>
            <div className="p-2 bg-[#7c3aed] bg-opacity-20 rounded-lg">
              <Database className="h-5 w-5 text-[#7c3aed]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-[#f0f6fc]">
                {(data.dataUsage.todayMB / 1024).toFixed(1)}GB
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#7d8590] text-sm">
                  {(data.dataUsage.thisWeekMB / 1024).toFixed(1)}GB this week
                </span>
              </div>
              <div className="text-xs text-[#7d8590]">
                Avg {(data.dataUsage.averagePerUserMB / 1024).toFixed(1)}GB per user
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health Card */}
        <Card className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border-[#21262d] hover:border-[#30363d] transition-all duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#7d8590]">System Health</CardTitle>
            <div className={`p-2 rounded-lg ${data.alerts.total > 0 ? 'bg-[#f85149] bg-opacity-20' : 'bg-[#10b981] bg-opacity-20'}`}>
              <Server className={`h-5 w-5 ${data.alerts.total > 0 ? 'text-[#f85149]' : 'text-[#10b981]'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${data.alerts.total > 0 ? 'text-[#f85149]' : 'text-[#10b981]'}`}>
                {data.alerts.total > 0 ? `${data.alerts.total} Alert${data.alerts.total > 1 ? 's' : ''}` : 'Healthy'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#7d8590] text-sm">
                  {formatUptime(data.system.uptime)} uptime
                </span>
              </div>
              <div className="text-xs text-[#7d8590]">
                Memory: {data.system.memoryUsage.usage.toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Information Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Performance Card */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
              <Server className="h-5 w-5 text-[#10b981]" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Memory Usage */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm font-medium">Memory Usage</span>
                <div className="text-right">
                  <span className="text-[#f0f6fc] font-bold">{data.system.memoryUsage.usage.toFixed(1)}%</span>
                  <div className="text-xs text-[#7d8590]">
                    {data.system.memoryUsage.usedMB}MB / {data.system.memoryUsage.totalMB}MB
                  </div>
                </div>
              </div>
              <div className="w-full bg-[#0d1117] rounded-full h-3 border border-[#21262d]">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    data.system.memoryUsage.usage > 80 ? 'bg-gradient-to-r from-[#f85149] to-[#f59e0b]' :
                    data.system.memoryUsage.usage > 60 ? 'bg-gradient-to-r from-[#f59e0b] to-[#10b981]' :
                    'bg-gradient-to-r from-[#10b981] to-[#1f6feb]'
                  }`}
                  style={{ width: `${Math.min(data.system.memoryUsage.usage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Environment & Version Info */}
            <div className="space-y-3 pt-3 border-t border-[#21262d]">
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Environment</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  data.system.environment === 'production' 
                    ? 'bg-[#1f6feb] bg-opacity-20 text-[#1f6feb] border border-[#1f6feb] border-opacity-30' 
                    : 'bg-[#f59e0b] bg-opacity-20 text-[#f59e0b] border border-[#f59e0b] border-opacity-30'
                }`}>
                  {data.system.environment}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Node.js Version</span>
                <span className="text-[#f0f6fc] font-mono text-sm">{data.system.nodeVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">System Uptime</span>
                <span className="text-[#f0f6fc] font-mono text-sm">{formatUptime(data.system.uptime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Analytics Card */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
              <BarChart3 className="h-5 w-5 text-[#7c3aed]" />
              Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Data consumed this week</span>
                <span className="text-[#f0f6fc] font-bold">
                  {(data.dataUsage.thisWeekMB / 1024).toFixed(1)}GB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Time spent this week</span>
                <span className="text-[#f0f6fc] font-bold">{data.timeUsage.thisWeekHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Average per user</span>
                <span className="text-[#f0f6fc] font-bold">
                  {(data.dataUsage.averagePerUserMB / 1024).toFixed(1)}GB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Daily average usage</span>
                <span className="text-[#f0f6fc] font-bold">
                  {(data.dataUsage.averagePerDayMB / 1024).toFixed(1)}GB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#7d8590] text-sm">Quota exceeded sessions</span>
                <span className={`font-bold ${data.sessions.quotaExceeded > 0 ? 'text-[#f85149]' : 'text-[#10b981]'}`}>
                  {data.sessions.quotaExceeded}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Administrative Actions */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
              <Zap className="h-5 w-5 text-[#f59e0b]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#21262d] text-[#f0f6fc] rounded-lg text-sm transition-all duration-200 border border-[#21262d] hover:border-[#30363d] group">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-[#1f6feb]" />
                <span>Manage Users</span>
              </div>
              <Eye className="h-4 w-4 text-[#7d8590] group-hover:text-[#f0f6fc] transition-colors" />
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#21262d] text-[#f0f6fc] rounded-lg text-sm transition-all duration-200 border border-[#21262d] hover:border-[#30363d] group">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-[#10b981]" />
                <span>System Logs</span>
              </div>
              <Eye className="h-4 w-4 text-[#7d8590] group-hover:text-[#f0f6fc] transition-colors" />
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1117] hover:bg-[#21262d] text-[#f0f6fc] rounded-lg text-sm transition-all duration-200 border border-[#21262d] hover:border-[#30363d] group">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-[#7c3aed]" />
                <span>Analytics Report</span>
              </div>
              <Eye className="h-4 w-4 text-[#7d8590] group-hover:text-[#f0f6fc] transition-colors" />
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-3 bg-[#1f6feb] hover:bg-[#1158c7] text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Full Report
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
              <TrendingUp className="h-5 w-5 text-[#10b981]" />
              Top Users This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topUsers.slice(0, 5).map((userStat, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-[#21262d] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#1f6feb] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {userStat.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#10b981] rounded-full border-2 border-[#161b22] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[#f0f6fc] font-medium">{userStat.user.username}</p>
                      <p className="text-[#7d8590] text-sm">{userStat.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f0f6fc] font-bold">{(userStat.dataUsedMB / 1024).toFixed(1)}GB</p>
                    <p className="text-[#7d8590] text-sm">{userStat.timeUsedHours.toFixed(1)}h</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#161b22] border-[#21262d]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
              <Clock className="h-5 w-5 text-[#1f6feb]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-[#21262d] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'ACTIVE' ? 'bg-[#10b981]' : 
                      activity.status === 'TERMINATED' ? 'bg-[#7d8590]' : 'bg-[#f85149]'
                    }`}></div>
                    <div>
                      <p className="text-[#f0f6fc] font-medium">{activity.user.username}</p>
                      <p className="text-[#7d8590] text-sm">
                        {new Date(activity.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f0f6fc] font-bold">{(activity.dataUsedMB / 1024).toFixed(1)}GB</p>
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
