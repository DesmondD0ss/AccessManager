import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BarChart2, 
  Shield, 
  Server, 
  FileText, 
  Settings, 
  Database,
  Activity,
  UserCheck,
  AlertTriangle,
  Menu,
  ChevronLeft,
  GitBranch
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigationSections = [
    {
      title: 'Dashboard',
      items: [
        { to: '/admin/dashboard', icon: Home, label: 'Overview', color: 'text-[#7c3aed]' },
        { to: '/admin/analytics', icon: BarChart2, label: 'Analytics', color: 'text-[#06b6d4]' },
      ]
    },
    {
      title: 'User Management',
      items: [
        { to: '/admin/users', icon: Users, label: 'Users', color: 'text-[#10b981]' },
        { to: '/admin/sessions', icon: UserCheck, label: 'Sessions', color: 'text-[#f59e0b]' },
        { to: '/admin/permissions', icon: Shield, label: 'Permissions', color: 'text-[#ef4444]' },
      ]
    },
    {
      title: 'System',
      items: [
        { to: '/admin/network', icon: GitBranch, label: 'Network Rules', color: 'text-[#8b5cf6]' },
        { to: '/admin/quotas', icon: Database, label: 'Quotas', color: 'text-[#06b6d4]' },
        { to: '/admin/logs', icon: FileText, label: 'Logs & Audits', color: 'text-[#84cc16]' },
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { to: '/admin/health', icon: Activity, label: 'System Health', color: 'text-[#10b981]' },
        { to: '/admin/alerts', icon: AlertTriangle, label: 'Alerts', color: 'text-[#f97316]' },
        { to: '/admin/maintenance', icon: Server, label: 'Maintenance', color: 'text-[#6b7280]' },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { to: '/admin/settings', icon: Settings, label: 'Settings', color: 'text-[#6b7280]' },
      ]
    }
  ];

  return (
    <aside className={`bg-[#161b22] border-r border-[#21262d] h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#21262d]">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f0f6fc]">Zentry</h1>
              <p className="text-xs text-[#7d8590]">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-[#21262d] text-[#7d8590] hover:text-[#e6edf3] transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {!collapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-[#7d8590] uppercase tracking-wide">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to} className="px-2">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#1f6feb] text-white shadow-sm'
                          : 'text-[#e6edf3] hover:bg-[#21262d] hover:text-white'
                      }`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'} ${item.color}`} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <div className="p-4 border-t border-[#21262d]">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-[#7d8590]">System Online</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;