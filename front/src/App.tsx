import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import DashboardOverviewGitHub from './pages/admin/pages/DashboardOverviewGitHubNew'
import UserManagementGitHub from './pages/admin/pages/UserManagementGitHub'
import SystemSettingsGitHub from './pages/admin/pages/SystemSettingsGitHub'
import SecurityAuditGitHub from './pages/admin/pages/SecurityAuditGitHub'
import NotificationCenter from './pages/admin/pages/NotificationCenterNew'
import StatisticsPage from './pages/admin/pages/StatisticsPageNew'
import ActivityPage from './pages/admin/pages/ActivityPageNew'
import NetworkPage from './pages/admin/pages/NetworkPage'
import MaintenancePage from './pages/admin/pages/MaintenancePage'
import DatabaseManagement from './pages/admin/pages/DatabaseManagement'
import GuestsPage from './pages/admin/pages/GuestsPage'
import QuotasPage from './pages/admin/pages/QuotasPageNew'
import SessionsPage from './pages/admin/pages/SessionsPage'
import SystemPage from './pages/admin/pages/SystemPage'
import LogsPage from './pages/admin/pages/LogsPage'
import ServicesPage from './pages/admin/pages/ServicesPage'
import RootRedirect from './components/auth/RootRedirect'
import DebugAuth from './components/debug/DebugAuth'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardOverviewGitHub />} />
                <Route path="users" element={<UserManagementGitHub />} />
                <Route path="security" element={<SecurityAuditGitHub />} />
                <Route path="settings" element={<SystemSettingsGitHub />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="database" element={<DatabaseManagement />} />
                <Route path="network" element={<NetworkPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="quotas" element={<QuotasPage />} />
                <Route path="sessions" element={<SessionsPage />} />
                <Route path="guests" element={<GuestsPage />} />
                <Route path="system" element={<SystemPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="services" element={<ServicesPage />} />
                {/* Redirect /admin to /admin/dashboard */}
                <Route index element={<DashboardOverviewGitHub />} />
              </Route>
              
              {/* Default Redirect */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Debug Route - Temporary */}
              <Route path="/debug" element={<DebugAuth />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'JetBrains Mono, monospace',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
