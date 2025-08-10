import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Shield,
  Network,
  Database,
  FileText,
  Settings,
  Bell,
  Wrench,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Server
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();

  const navigationItems = [
    {
      section: 'Dashboard',
      items: [
        { 
          path: '/admin/dashboard', 
          label: 'Overview', 
          icon: LayoutDashboard,
          description: 'System overview and key metrics'
        },
        { 
          path: '/admin/analytics', 
          label: 'Analytics', 
          icon: BarChart3,
          description: 'Detailed analytics and reports'
        }
      ]
    },
    {
      section: 'User Management',
      items: [
        { 
          path: '/admin/users', 
          label: 'Users', 
          icon: Users,
          description: 'Manage user accounts'
        },
        { 
          path: '/admin/sessions', 
          label: 'Sessions', 
          icon: Activity,
          description: 'Active user sessions'
        },
        { 
          path: '/admin/permissions', 
          label: 'Permissions', 
          icon: UserCog,
          description: 'User roles and permissions'
        }
      ]
    },
    {
      section: 'Network & Security',
      items: [
        { 
          path: '/admin/network', 
          label: 'Network Rules', 
          icon: Network,
          description: 'Network configuration and rules'
        },
        { 
          path: '/admin/quotas', 
          label: 'Quotas', 
          icon: Database,
          description: 'Bandwidth and data quotas'
        },
        { 
          path: '/admin/security', 
          label: 'Security', 
          icon: Shield,
          description: 'Security settings and policies'
        }
      ]
    },
    {
      section: 'System',
      items: [
        { 
          path: '/admin/logs', 
          label: 'Logs & Audits', 
          icon: FileText,
          description: 'System and audit logs'
        },
        { 
          path: '/admin/health', 
          label: 'System Health', 
          icon: Server,
          description: 'System performance monitoring'
        },
        { 
          path: '/admin/alerts', 
          label: 'Alerts', 
          icon: Bell,
          description: 'System alerts and notifications'
        }
      ]
    },
    {
      section: 'Administration',
      items: [
        { 
          path: '/admin/maintenance', 
          label: 'Maintenance', 
          icon: Wrench,
          description: 'System maintenance tools'
        },
        { 
          path: '/admin/settings', 
          label: 'Settings', 
          icon: Settings,
          description: 'System configuration'
        }
      ]
    }
  ];

  return (
    <div className={`h-full bg-[#161b22] border-r border-[#21262d] flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#21262d]">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1f6feb] bg-opacity-20 rounded-lg">
              <Shield className="h-6 w-6 text-[#1f6feb]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f0f6fc]">Zentry</h1>
              <p className="text-xs text-[#7d8590]">Admin Panel</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[#21262d] text-[#7d8590] hover:text-[#f0f6fc] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-6">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!collapsed && (
                <div className="px-4 mb-3">
                  <h3 className="text-xs font-semibold text-[#7d8590] uppercase tracking-wider">
                    {section.section}
                  </h3>
                </div>
              )}
              
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={itemIndex}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 group ${
                          isActive
                            ? 'bg-[#1f6feb] bg-opacity-20 text-[#1f6feb] border border-[#1f6feb] border-opacity-30'
                            : 'text-[#7d8590] hover:text-[#f0f6fc] hover:bg-[#21262d]'
                        }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">
                            {item.label}
                          </span>
                          <span className="text-xs opacity-75 block truncate">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#21262d] p-4">
        {!collapsed ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-[#0d1117] rounded-lg border border-[#21262d]">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f0f6fc] truncate">{user?.username}</p>
                <p className="text-xs text-[#7d8590] truncate">{user?.role}</p>
              </div>
            </div>

            {/* System Status */}
            <div className="flex items-center justify-between text-xs text-[#7d8590]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <span>v1.0.0</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
