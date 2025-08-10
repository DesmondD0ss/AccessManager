import { Menu, Bell, Search, User, LogOut } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="h-16 bg-canvas-default border-b border-default flex items-center justify-between px-4 lg:px-6 shadow-github-sm">
      {/* Left Section - Menu Toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md bg-btn border border-btn hover:bg-btn-hover hover:border-btn-hover transition-colors btn-text lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-accent rounded-md">
            <span className="text-sm font-bold text-white">AM</span>
          </div>
          <h1 className="text-lg font-semibold text-fg-default hidden sm:block">
            Access Manager
          </h1>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fg-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 bg-input border border-input rounded-md text-fg-default placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent w-64 transition-colors"
          />
        </div>
      </div>

      {/* Right Section - Notifications & User Menu */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <button 
          className="relative p-2 rounded-md bg-btn border border-btn hover:bg-btn-hover hover:border-btn-hover transition-colors btn-text"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-xs text-white font-medium rounded-full flex items-center justify-center">
            3
          </span>
        </button>


        {/* User Info */}
        <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-btn border border-btn">
          <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-sm font-medium text-fg-default">
              {user?.username || 'Administrateur'}
            </div>
            <div className="text-xs text-fg-muted">
              {user?.email || 'admin@system'}
            </div>
          </div>
        </div>


        {/* Logout Button - Always Visible */}
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-2 rounded-md bg-danger hover:bg-danger-emphasis transition-colors text-white font-medium"
          aria-label="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}

export default Header
