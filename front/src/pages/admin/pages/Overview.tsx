import React, { useState, useEffect } from 'react';
import { 
  RefreshCw,
  Users,
  Activity,
  Database,
  AlertTriangle,
  TrendingUp,
  Server,
  Cpu,
  User,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    admins: number;
    locked: number;
    activeRate: number;
  };
  sessions: {
    active: number;
    today: number;
    thisWeek: number;
    total: number;
    quotaExceeded: number;
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
    thisMonthHours: number;
    averagePerDayHours: number;
  };
  alerts: {
    lockedUsers: number;
    quotaExceeded: number;
    recentErrors: number;
    total: number;
  };
  system: {
    uptime: number;
    memoryUsage: {
      usedMB: number;
      totalMB: number;
      usagePercent: number;
    };
    cpuUsage: number;
  };
  topUsers: Array<{
    user: {
      id: string;
      username: string;
      email: string;
    };
    dataUsedMB: number;
    timeUsedHours: number;
  }>;
  recentActivity: Array<{
    id: string;
    user: {
      username: string;
      email: string;
    };
    startTime: string;
    endTime?: string;
    dataUsedMB: number;
    timeUsedMinutes: number;
    status: string;
    ipAddress: string;
  }>;
}

const Overview: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    // Refresh dashboard every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API call
      const mockData: DashboardStats = {
        users: {
          total: 1248,
          active: 892,
          newToday: 23,
          newThisWeek: 156,
          admins: 8,
          locked: 12,
          activeRate: 71.5
        },
        sessions: {
          active: 234,
          today: 445,
          thisWeek: 2834,
          total: 12456,
          quotaExceeded: 8
        },
        dataUsage: {
          todayMB: 45680,
          thisWeekMB: 234590,
          thisMonthMB: 1245678,
          averagePerDayMB: 33520,
          averagePerUserMB: 1250
        },
        timeUsage: {
          todayHours: 2847,
          thisWeekHours: 18943,
          thisMonthHours: 89456,
          averagePerDayHours: 2850
        },
        alerts: {
          lockedUsers: 3,
          quotaExceeded: 8,
          recentErrors: 2,
          total: 13
        },
        system: {
          uptime: 2847456,
          memoryUsage: {
            usedMB: 6842,
            totalMB: 16384,
            usagePercent: 41.8
          },
          cpuUsage: 23.5
        },
        topUsers: [
          { user: { id: '1', username: 'user001', email: 'user001@company.com' }, dataUsedMB: 2450, timeUsedHours: 45.2 },
          { user: { id: '2', username: 'user002', email: 'user002@company.com' }, dataUsedMB: 2123, timeUsedHours: 38.7 },
          { user: { id: '3', username: 'user003', email: 'user003@company.com' }, dataUsedMB: 1890, timeUsedHours: 35.1 }
        ],
        recentActivity: [
          { id: '1', user: { username: 'user001', email: 'user001@company.com' }, startTime: new Date().toISOString(), dataUsedMB: 125, timeUsedMinutes: 45, status: 'ACTIVE', ipAddress: '192.168.1.101' },
          { id: '2', user: { username: 'user002', email: 'user002@company.com' }, startTime: new Date(Date.now() - 3600000).toISOString(), dataUsedMB: 89, timeUsedMinutes: 32, status: 'COMPLETED', ipAddress: '192.168.1.102' }
        ]
      };

      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      setDashboard(mockData);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[#7d8590]">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="font-mono">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <div className="bg-[#da3633] bg-opacity-10 border border-[#da3633] border-opacity-30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#da3633]" />
            <span className="text-[#da3633] font-medium">Unable to load dashboard</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen">
      {/* Header Section */}
      <section className="flex items-center justify-between pb-8 border-b border-slate-200">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 text-lg font-medium">System overview and real-time monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={loadDashboard}
            disabled={loading}
            className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-400 shadow-lg px-6 py-3 rounded-xl transition-all duration-200"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span className="text-red-700 font-semibold text-lg">{error}</span>
          </div>
        </div>
      )}

      {/* Critical Status Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          Critical Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Alerts Priority Card */}
          <Card className={`${dashboard.alerts.total > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 shadow-red-200/50' : 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 shadow-green-200/50'} shadow-xl rounded-xl transition-all duration-300 hover:scale-105`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className={`p-2 rounded-lg ${dashboard.alerts.total > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold mb-3 ${dashboard.alerts.total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dashboard.alerts.total}
              </div>
              <div className="text-sm text-slate-600 font-medium">
                {dashboard.alerts.total > 0 ? 'Issues require attention' : 'All systems operational'}
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-xl shadow-blue-200/50 rounded-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 mb-3">{dashboard.sessions.active}</div>
              <div className="text-sm text-slate-600 font-medium">Currently online</div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 shadow-xl shadow-purple-200/50 rounded-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Server className="h-4 w-4 text-white" />
                </div>
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 mb-3">
                {dashboard.system.memoryUsage.usagePercent}%
              </div>
              <div className="text-sm text-slate-600 font-medium">Memory usage</div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 shadow-xl rounded-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200">
                  View Alerts
                </Button>
                <Button variant="ghost" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200">
                  System Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          Usage Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Users Overview */}
          <Card className="bg-white border-2 border-slate-200 shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Users className="h-6 w-6" />
                Users Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Users</span>
                <span className="text-3xl font-bold text-blue-600">{dashboard.users.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Active Users</span>
                <span className="text-2xl font-bold text-emerald-600">{dashboard.users.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">New Today</span>
                <span className="text-xl font-bold text-amber-600">+{dashboard.users.newToday}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${dashboard.users.activeRate}%` }}
                />
              </div>
              <div className="text-sm text-slate-600 text-center font-semibold">
                {dashboard.users.activeRate}% Activity Rate
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card className="bg-white border-2 border-slate-200 shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-xl">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Database className="h-6 w-6" />
                Data Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Today</span>
                <span className="text-2xl font-bold text-amber-600">
                  {formatBytes(dashboard.dataUsage.todayMB * 1024 * 1024)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">This Week</span>
                <span className="text-xl font-bold text-slate-700">
                  {formatBytes(dashboard.dataUsage.thisWeekMB * 1024 * 1024)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Avg per User</span>
                <span className="text-lg font-semibold text-slate-600">
                  {formatBytes(dashboard.dataUsage.averagePerUserMB * 1024 * 1024)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* System Performance */}
          <Card className="bg-white border-2 border-slate-200 shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-xl">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Cpu className="h-6 w-6" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">CPU Usage</span>
                  <span className="text-2xl font-bold text-amber-600">{dashboard.system.cpuUsage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                      dashboard.system.cpuUsage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-green-500'
                    }`}
                    style={{ width: `${dashboard.system.cpuUsage}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Memory</span>
                  <span className="text-2xl font-bold text-purple-600">{dashboard.system.memoryUsage.usagePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                      dashboard.system.memoryUsage.usagePercent > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                    }`}
                    style={{ width: `${dashboard.system.memoryUsage.usagePercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm pt-4 border-t border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-600 font-medium">Uptime: {formatUptime(dashboard.system.uptime)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Activity Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-lg">
            <User className="h-6 w-6 text-white" />
          </div>
          User Activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Users */}
          <Card className="bg-white border-2 border-slate-200 shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-xl">
              <CardTitle className="text-xl font-bold">Top Active Users</CardTitle>
              <CardDescription className="text-cyan-100 font-medium">Highest usage this week</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboard.topUsers.slice(0, 4).map((userStat, index) => (
                  <div key={userStat.user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                        'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {userStat.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{userStat.user.username}</div>
                        <div className="text-sm text-slate-600 font-medium">{userStat.timeUsedHours.toFixed(1)}h usage</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-amber-600">
                      {formatBytes(userStat.dataUsedMB * 1024 * 1024)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border-2 border-slate-200 shadow-xl rounded-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="text-xl font-bold">Recent Sessions</CardTitle>
              <CardDescription className="text-emerald-100 font-medium">Latest user connections</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboard.recentActivity.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full shadow-lg ${
                        activity.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                      <div>
                        <div className="font-bold text-slate-800">{activity.user.username}</div>
                        <div className="text-sm text-slate-600 font-medium">
                          {new Date(activity.startTime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm px-3 py-1 rounded-full font-semibold ${
                        activity.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}>
                        {activity.status === 'ACTIVE' ? 'Active' : 'Ended'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Overview;
