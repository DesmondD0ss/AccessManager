import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme, actualTheme } = useTheme()

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'auto':
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Mode clair'
      case 'dark':
        return 'Mode sombre'
      case 'auto':
        return `Auto (${actualTheme === 'dark' ? 'sombre' : 'clair'})`
      default:
        return 'Mode clair'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-btn border border-btn hover:bg-btn-hover hover:border-btn-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 btn-text"
      title={getLabel()}
      aria-label={`Basculer vers le thème suivant. Actuellement: ${getLabel()}`}
    >
      {getIcon()}
      <span className="hidden sm:inline-block">{getLabel()}</span>
    </button>
  )
}
