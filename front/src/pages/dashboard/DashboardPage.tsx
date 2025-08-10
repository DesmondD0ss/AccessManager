import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Shield,
  LogOut,
  User,
  Settings,
  Activity,
  Globe,
  Clock,
  Zap,
  TrendingUp,
  Database,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-mono">
      {/* Header */}
      <header className="border-b border-[#21262d] bg-[#161b22]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and App Name */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1f6feb] bg-opacity-20">
                <Shield className="h-6 w-6 text-[#1f6feb]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#f0f6fc]">Zentry</h1>
                <p className="text-sm text-[#7d8590]">User Dashboard</p>
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-[#21262d]">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-[#7d8590]" />
                  <span className="text-[#f0f6fc] font-medium">{user?.username}</span>
                  <span className="text-xs px-2 py-1 bg-[#1f6feb] bg-opacity-20 text-[#1f6feb] rounded-full border border-[#1f6feb] border-opacity-30">
                    {user?.role}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[#7d8590] hover:text-[#f85149] hover:bg-[#f85149] hover:bg-opacity-10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <section className="space-y-2">
            <h2 className="text-3xl font-bold text-[#f0f6fc]">
              Welcome back, {user?.firstName || user?.username}!
            </h2>
            <p className="text-[#7d8590] text-lg">
              Manage your internet access and monitor your usage with Zentry.
            </p>
          </section>

          {/* Dashboard Sections */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Stats */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-[#f0f6fc]">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cards */}
                <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#10b981]" />
                      Session Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#10b981]">Active</div>
                    <p className="text-xs text-[#7d8590] mt-1">2h 34m remaining</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#1f6feb]" />
                      Data Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#f0f6fc]">1.2 GB</div>
                    <p className="text-xs text-[#7d8590] mt-1">68% of quota used</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#7c3aed]" />
                      Time Online
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#f0f6fc]">5.4h</div>
                    <p className="text-xs text-[#7d8590] mt-1">Today's usage</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#161b22] border-[#21262d] hover:border-[#30363d] transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#7d8590] flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#f59e0b]" />
                      Speed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#f0f6fc]">45 Mbps</div>
                    <p className="text-xs text-[#7d8590] mt-1">Current download</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Usage Overview */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-[#f0f6fc]">Usage Overview</h3>
              <Card className="bg-[#161b22] border-[#21262d]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
                    <TrendingUp className="h-5 w-5 text-[#10b981]" />
                    Weekly Usage
                  </CardTitle>
                  <CardDescription className="text-[#7d8590]">
                    Internet usage for the current week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress bars */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#7d8590]">Data Usage</span>
                        <span className="text-sm text-[#f0f6fc] font-medium">1.2 GB / 3.0 GB</span>
                      </div>
                      <div className="w-full bg-[#21262d] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#1f6feb] to-[#7c3aed] h-2 rounded-full transition-all duration-300"
                          style={{ width: '68%' }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#7d8590]">Time Usage</span>
                        <span className="text-sm text-[#f0f6fc] font-medium">32h / 50h</span>
                      </div>
                      <div className="w-full bg-[#21262d] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#10b981] to-[#f59e0b] h-2 rounded-full transition-all duration-300"
                          style={{ width: '64%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-[#f0f6fc]">Quick Actions</h3>
            <Card className="bg-[#161b22] border-[#21262d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
                  <Zap className="h-5 w-5 text-[#f59e0b]" />
                  Manage Session
                </CardTitle>
                <CardDescription className="text-[#7d8590]">
                  Control your internet session and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-[#1f6feb] hover:bg-[#1158c7] text-white">
                  <Globe className="h-4 w-4 mr-2" />
                  Extend Session
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d]"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start border-[#21262d] text-[#f0f6fc] hover:bg-[#21262d]"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Usage History
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Enhanced User Quotas */}
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-[#f0f6fc]">Enhanced User Quotas</h3>
            <Card className="bg-[#161b22] border-[#21262d]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#f0f6fc]">
                  <Database className="h-5 w-5 text-[#1f6feb]" />
                  Quota Management
                </CardTitle>
                <CardDescription className="text-[#7d8590]">
                  Monitor and configure user quotas with detailed insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-[#7d8590]">Default Data Quota</p>
                    <p className="text-lg text-[#f0f6fc] font-medium">1000 MB</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-[#7d8590]">Default Time Quota</p>
                    <p className="text-lg text-[#f0f6fc] font-medium">8h</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-lg text-[#f0f6fc] font-semibold">User Quotas</h4>
                  <div className="space-y-4">
                    {/* Example User Quota */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#7d8590]">Alice Dupont</span>
                      <span className="text-sm text-[#f0f6fc]">750 MB / 1000 MB</span>
                    </div>
                    <div className="w-full bg-[#21262d] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#10b981] to-[#f59e0b] h-2 rounded-full transition-all duration-300"
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                  </div>
                  {/* Additional User Quotas */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7d8590]">Bob Martin</span>
                    <span className="text-sm text-[#f0f6fc]">450 MB / 1.46 GB</span>
                  </div>
                  <div className="w-full bg-[#21262d] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#10b981] to-[#f59e0b] h-2 rounded-full transition-all duration-300"
                      style={{ width: '30%' }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262d] bg-[#161b22] mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-[#7d8590]">
            <div className="flex items-center gap-2 mb-2 md:mb-0">
              <Shield className="h-4 w-4" />
              <span>© 2025 Zentry - Secure Internet Access Management</span>
            </div>
            <div className="flex items-center gap-4">
              <span>v1.0.0</span>
              <span>•</span>
              <span>GitHub Dark Theme Palette</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
