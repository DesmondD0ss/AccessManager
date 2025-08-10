import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import axios from 'axios'

const loginSchema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('') // State for error message
  const { login, isLoading } = useAuth()
  // Mode sombre par défaut, pas de toggle
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Données du formulaire:', data);
      const user = await login(data); // The login function now returns the user object

      // Clear any previous error messages
      setErrorMessage('');

      // Validate user role and navigate accordingly
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'USER') {
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMessage("Rôle utilisateur inconnu. Veuillez contacter l'administrateur.");
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrorMessage("Nom d'utilisateur ou mot de passe incorrect");
      } else {
        setErrorMessage("Une erreur s'est produite. Veuillez réessayer.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Header centré avec titre */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Zentry</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gestionnaire d'Accès Internet Sécurisé</p>
        </div>

        

        {/* Formulaire */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte pour accéder au tableau de bord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nom d'utilisateur"
                placeholder="Entrez votre nom d'utilisateur"
                error={errors.username?.message}
                {...register('username')}
                disabled={isLoading}
              />

              <div style={{ position: 'relative' }}>
                <Input
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre mot de passe"
                  error={errors.password?.message}
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="btn-ghost"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '40px',
                    padding: '4px',
                    border: 'none',
                    background: 'none'
                  }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Message d'erreur */}
                {errorMessage && (
                <div className="mt-1 text-xs text-red-600 text-center">
                    {errorMessage}
                </div>
                )}

              <div className="flex justify-between items-center text-xs">
                <a
                  href="/forgot-password"
                  className="link"
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                className="link"
              >
                Créer un compte
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>© 2025 Zentry</p>
        </div>
      </div>
    </div>
  )
}
