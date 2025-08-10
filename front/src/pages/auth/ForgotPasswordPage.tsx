import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import axios from 'axios'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  // Mode sombre par défaut, pas de toggle

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/auth/forgot-password', data)

      if (response.data.success) {
        setEmailSent(true)
        toast.success('Email de récupération envoyé!')
      } else {
        throw new Error(response.data.message || "Erreur lors de l'envoi")
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Erreur lors de l'envoi"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const resendEmail = async () => {
    const email = getValues('email')
    if (email) {
      await onSubmit({ email })
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

        {/* Formulaire ou confirmation */}
        <Card className="w-full shadow-lg rounded-2xl">
          {!emailSent ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="h-5 w-5" />
                  Mot de passe oublié
                </CardTitle>
                <CardDescription>
                  Entrez votre email pour recevoir un lien de récupération
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-6 text-center text-xs">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Adresse email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        error={errors.email?.message}
                        helperText="Nous vous enverrons un lien pour réinitialiser votre mot de passe"
                        {...register('email')}
                        disabled={isLoading}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                        <>
                            <LoadingSpinner size="sm" />
                            Envoi en cours...
                        </>
                        ) : (
                        <>
                            {/*<Mail className="h-4 w-4" /> */}
                            Envoyer le lien
                        </>
                        )}
                    </Button>
                    </form>
                </div>
                <div className="mt-6 text-left text-xs">
                  <Link
                    to="/login"
                    className= "link" //"inline-flex items-center gap-2 text-sm text-accent-fg hover:text-accent-emphasis underline focus:outline-none focus:ring-2 focus:ring-accent-fg focus:ring-offset-2 rounded"
                    tabIndex={0}
                  >
                    <ArrowLeft className="h-4 w-4 text-xs" />
                    Retour à la connexion
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-success-fg">
                  <CheckCircle className="h-5 w-5" />
                  Email envoyé !
                </CardTitle>
                <CardDescription>
                  Vérifiez votre boîte email pour le lien de récupération
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-4 bg-success-subtle border border-success-muted rounded-md">
                  <p className="text-sm text-fg-default">
                    Un email de récupération a été envoyé à{' '}
                    <span className="font-semibold">{getValues('email')}</span>
                  </p>
                  <p className="text-xs text-fg-muted mt-2">
                    Le lien expirera dans 5 minutes. Vérifiez aussi votre dossier spam.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    onClick={resendEmail}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Renvoi en cours...
                      </>
                    ) : (
                      "Renvoyer l'email"
                    )}
                  </Button>

                  <Link
                    to="/login"
                    className= "mb-6 text-left text-xs link" //"inline-flex items-center justify-center gap-2 w-full p-2 text-sm text-accent-fg hover:text-accent-emphasis underline focus:outline-none focus:ring-2 focus:ring-accent-fg focus:ring-offset-2 rounded"
                  >
                    <ArrowLeft className="mt-4 text-xs h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted">
          <p>© 2025 Zentry</p>
        </div>
      </div>
    </div>
  )
}
