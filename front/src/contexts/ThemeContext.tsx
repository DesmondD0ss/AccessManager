import { createContext, useContext, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Toujours en mode sombre
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  }, []) // S'exécute une seule fois au démarrage

  const toggleTheme = () => {
    // Ne fait rien - toujours en mode sombre
  }

  const value: ThemeContextType = {
    theme: 'dark',
    actualTheme: 'dark',
    setTheme: () => {}, // Ne fait rien
    toggleTheme,
    isDark: true // Toujours true
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
