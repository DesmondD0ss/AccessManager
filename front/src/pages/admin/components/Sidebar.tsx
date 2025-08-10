import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Shield, 
  Settings,
  Bell,
  Server,
  BarChart3,
  FileText,
  Network,
  Clock,
  Wrench,
  AlertTriangle,
  Key,
  UserCheck,
  Cpu,
  Database
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation()

  const navigationItems = [
    {
      category: 'TABLEAU DE BORD',
      items: [
        { 
          name: 'Vue d\'ensemble', 
          href: '/admin', 
          icon: Home, 
          exact: true 
        },
        { 
          name: 'Statistiques', 
          href: '/admin/statistics', 
          icon: BarChart3 
        },
        { 
          name: 'Activité', 
          href: '/admin/activity', 
          icon: Clock 
        }
      ]
    },
    {
      category: 'GESTION',
      items: [
        { 
          name: 'Utilisateurs', 
          href: '/admin/users', 
          icon: Users 
        },
        { 
          name: 'Sessions', 
          href: '/admin/sessions', 
          icon: UserCheck 
        },
        { 
          name: 'Invités', 
          href: '/admin/guests', 
          icon: Key 
        }
      ]
    },
    {
      category: 'SÉCURITÉ',
      items: [
        { 
          name: 'Audit de sécurité', 
          href: '/admin/security', 
          icon: Shield 
        },
        { 
          name: 'Quotas', 
          href: '/admin/quotas', 
          icon: AlertTriangle 
        },
        { 
          name: 'Réseau', 
          href: '/admin/network', 
          icon: Network 
        }
      ]
    },
    {
      category: 'SYSTÈME',
      items: [
        { 
          name: 'Configuration', 
          href: '/admin/settings', 
          icon: Settings 
        },
        { 
          name: 'Base de données', 
          href: '/admin/database', 
          icon: Database 
        },
        { 
          name: 'Services', 
          href: '/admin/services', 
          icon: Cpu 
        },
        { 
          name: 'Maintenance', 
          href: '/admin/maintenance', 
          icon: Wrench 
        }
      ]
    },
    {
      category: 'MONITORING',
      items: [
        { 
          name: 'Notifications', 
          href: '/admin/notifications', 
          icon: Bell 
        },
        { 
          name: 'Logs', 
          href: '/admin/logs', 
          icon: FileText 
        },
        { 
          name: 'Serveurs', 
          href: '/admin/servers', 
          icon: Server 
        }
      ]
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Logo/Brand Section */}
      <div className={`px-6 py-6 border-b border-slate-700/50 ${collapsed ? 'px-4' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">AccessManager</h1>
              <p className="text-xs text-slate-400 font-medium">Administration</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        <nav className="space-y-8">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!collapsed && (
                <div className="px-6 mb-4">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.category}
                  </h2>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group flex items-center transition-all duration-200 ease-in-out
                        ${collapsed ? 'mx-2 px-3 py-3' : 'mx-3 px-4 py-3'}
                        rounded-xl relative overflow-hidden
                        ${active 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }
                      `}
                    >
                      {/* Background glow for active item */}
                      {active && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm" />
                      )}
                      
                      {/* Icon */}
                      <div className="relative z-10 flex items-center">
                        <Icon 
                          className={`
                            w-5 h-5 flex-shrink-0 transition-transform duration-200
                            ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                            ${collapsed ? '' : 'mr-3'}
                            group-hover:scale-110
                          `} 
                        />
                        
                        {/* Label */}
                        {!collapsed && (
                          <span className={`
                            font-medium text-sm transition-colors duration-200 relative z-10
                            ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}
                          `}>
                            {item.name}
                          </span>
                        )}
                      </div>

                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap border border-slate-700">
                          {item.name}
                          <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-800 transform -translate-y-1/2 -translate-x-full" />
                        </div>
                      )}

                      {/* Active indicator */}
                      {active && (
                        <div className="absolute right-0 top-1/2 w-1 h-8 bg-white rounded-l-full transform -translate-y-1/2" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section - User Info / Status */}
      <div className={`px-6 py-4 border-t border-slate-700/50 ${collapsed ? 'px-4' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Système actif</p>
              <p className="text-xs text-slate-400">Tous services opérationnels</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
