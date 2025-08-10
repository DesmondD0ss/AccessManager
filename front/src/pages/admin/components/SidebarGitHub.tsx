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
          name: 'Invités', 
          href: '/admin/guests', 
          icon: UserCheck 
        },
        { 
          name: 'Sessions', 
          href: '/admin/sessions', 
          icon: Key 
        },
        { 
          name: 'Quotas', 
          href: '/admin/quotas', 
          icon: AlertTriangle 
        }
      ]
    },
    {
      category: 'SYSTÈME',
      items: [
        { 
          name: 'Sécurité', 
          href: '/admin/security', 
          icon: Shield 
        },
        { 
          name: 'Réseau', 
          href: '/admin/network', 
          icon: Network 
        },
        { 
          name: 'Base de données', 
          href: '/admin/database', 
          icon: Database 
        },
        { 
          name: 'Système', 
          href: '/admin/system', 
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
      category: 'CONFIGURATION',
      items: [
        { 
          name: 'Paramètres', 
          href: '/admin/settings', 
          icon: Settings 
        },
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
          name: 'Services', 
          href: '/admin/services', 
          icon: Server 
        }
      ]
    }
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <aside 
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 bg-canvas-overlay border-r border-default flex flex-col h-screen sticky top-0`}
    >
      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-6">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3 px-2">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon
                  const active = isActive(item.href, item.exact)
                  
                  return (
                    <Link
                      key={itemIndex}
                      to={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        active
                          ? 'bg-accent-subtle text-accent border-l-4 border-accent'
                          : 'text-fg-default hover:bg-canvas-subtle hover:text-fg-default'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon 
                        className={`flex-shrink-0 w-5 h-5 ${
                          active ? 'text-accent' : 'text-fg-muted group-hover:text-fg-default'
                        }`} 
                      />
                      {!collapsed && (
                        <span className="ml-3 truncate">{item.name}</span>
                      )}
                      {active && !collapsed && (
                        <div className="ml-auto w-2 h-2 bg-accent rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-default">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="text-xs text-fg-muted">
              <div className="font-medium">Access Manager</div>
              <div>v2.0.0</div>
            </div>
          )}
          <div className={`w-2 h-2 rounded-full bg-success ${collapsed ? 'mx-auto' : ''}`} 
               title="Système opérationnel" />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
