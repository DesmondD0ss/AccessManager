import { Heart, Github, Shield } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-canvas-overlay border-t border-default px-4 lg:px-6 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        {/* Left Section */}
        <div className="flex items-center space-x-4 text-fg-muted">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Access Manager</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">v2.1.0</span>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>Tous les systèmes opérationnels</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4 text-fg-muted">
          <div className="flex items-center space-x-1">
            <span>Fait avec</span>
            <Heart className="w-4 h-4 text-danger" />
            <span>par l'équipe DevOps</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center space-x-1">
            <Github className="w-4 h-4" />
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-fg-default transition-colors"
            >
              GitHub
            </a>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">© {currentYear}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
