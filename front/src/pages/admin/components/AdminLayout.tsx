import { useState } from 'react'
import SidebarGitHub from './SidebarGitHub'
import Header from './Header'
import FooterNew from './FooterNew'

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-canvas-default text-fg-default font-mono antialiased">
      {/* Header */}
      <Header 
        sidebarCollapsed={sidebarCollapsed} 
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Layout with Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className={`${sidebarCollapsed ? 'hidden lg:block' : 'block'} lg:block`}>
          <SidebarGitHub 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
        </div>

        {/* Mobile overlay */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-canvas-default">
          <div className="p-4 lg:p-6 xl:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <FooterNew />
    </div>
  )
}

export default AdminLayout
