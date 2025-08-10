import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
  email: z.string().email('Email invalide'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth()
  // Mode sombre par défaut, pas de toggle
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data
      await registerUser(registerData)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('Erreur d\'inscription:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-default px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header centré avec titre */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold">Zentry</h1>
          <p className="text-sm text-muted">Gestionnaire d'Accès Internet Sécurisé</p>
        </div>

        {/* Formulaire d'inscription */}
        <Card className="w-full shadow-lg rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" />
              Créer un compte
            </CardTitle>
            <CardDescription>
              Rejoignez Zentry pour gérer vos accès Internet sécurisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nom d'utilisateur *"
                placeholder="Entrez votre nom d'utilisateur"
                error={errors.username?.message}
                helperText=""
                {...register('username')}
                disabled={isLoading}
              />
              {!errors.username?.message && (
                <div className="text-xs text-muted mt-3 mb-3">3-20 caractères, lettres, chiffres, - et _ uniquement</div>
              )}

              <Input
                label="Email *"
                type="email"
                placeholder="votre.email@exemple.com"
                error={errors.email?.message}
                {...register('email')}
                disabled={isLoading}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  placeholder="Prénom"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                  disabled={isLoading}
                />
                
                <Input
                  label="Nom"
                  placeholder="Nom"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Input
                  label="Mot de passe *"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  error={errors.password?.message}
                  helperText=""
                  {...register('password')}
                  disabled={isLoading}
                />
                {!errors.password?.message && (
                  <div className="text-xs text-muted mt-3 mb-3">8+ caractères, 1 minuscule, 1 majuscule, 1 chiffre</div>
                )}
              </div>

              <div className="relative">
                <Input
                  label="Confirmer le mot de passe *"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
              </div>

              <div className="text-xs text-muted space-y-1">
                <p>* Champs obligatoires</p>
                <p>En créant un compte, vous acceptez nos conditions d'utilisation.</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Création...
                  </>
                ) : (
                  'Créer le compte'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-muted">
              Déjà un compte ?{' '}
              <Link
                to="/login"
                className= "link"//"text-accent-fg hover:text-accent-emphasis underline focus:outline-none focus:ring-2 focus:ring-accent-fg focus:ring-offset-2 rounded"
              >
                Se connecter
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted">
          <p>© 2025 Zentry</p>
        </div>
      </div>
    </div>
  )
}
