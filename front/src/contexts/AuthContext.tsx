import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface LoginCredentials {
  username: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  firstName?: string
  lastName?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configuration Axios par défaut
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Intercepteur pour gérer les erreurs d'authentification globalement
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && user) {
          setUser(null)
          toast.error('Session expirée. Veuillez vous reconnecter.')
        }
        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [user])

  // Ajouter un intercepteur pour inclure le token JWT dans les requêtes
  useEffect(() => {
    const tokenInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });

    return () => axios.interceptors.request.eject(tokenInterceptor);
  }, []);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('AuthContext - Token found:', !!token);
      
      if (!token) {
        console.log('AuthContext - No token, setting user to null');
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('AuthContext - Calling /auth/me...');
        const response = await axios.get('/auth/me');
        console.log('AuthContext - /auth/me response:', response.data);
        setUser(response.data.data.user); // Utiliser la bonne structure
      } catch (error) {
        console.error('AuthContext - /auth/me failed:', error);
        localStorage.removeItem('token'); // Supprimer le token invalide
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)

      // Validation des champs requis
      if (!credentials) {
        console.error('Erreur: credentials est indéfini');
        throw new Error('Les données de connexion sont manquantes');
      }

      if (!credentials.username || !credentials.password) {
        throw new Error('Les champs nom d\'utilisateur et mot de passe sont requis');
      }

      console.log('Données reçues dans login:', credentials);

      const response = await axios.post('/auth/login', {
        identifier: credentials.username, // Renommer pour correspondre au backend
        password: credentials.password,
      })
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const user = response.data.data?.user;
        const token = response.data.data?.tokens?.accessToken;
        
        console.log('User received:', user);
        console.log('Token received:', token);
        
        if (token) {
          localStorage.setItem('token', token);
          console.log('Token saved to localStorage');
        }
        
        setUser(user)
        if (user && user.username) {
          toast.success(`Bienvenue, ${user.username}!`)
        } else {
          toast.success('Connexion réussie!')
        }
        return user // Retourner l'utilisateur
      } else {
        throw new Error(response.data.message || 'Erreur de connexion')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur de connexion'
      console.error('Login error:', error);
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/auth/register', data)
      
      if (response.data.success) {
        setUser(response.data.user)
        toast.success('Compte créé avec succès!')
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'inscription')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await axios.post('/auth/logout')
    } catch (error) {
      // Continuer même si la déconnexion côté serveur échoue
      console.warn('Erreur lors de la déconnexion côté serveur:', error)
    } finally {
      localStorage.removeItem('token') // Nettoyer le token
      setUser(null)
      toast.success('Déconnexion réussie')
    }
  }

  const refreshUser = async () => {
    try {
      const response = await axios.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      setUser(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}