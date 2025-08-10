/**
 * Dashboard pour les utilisateurs invités
 * Affiche les informations de session, quotas et actions disponibles
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, HardDrive, User, LogOut, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGuestSession } from '../../hooks/useGuestSession';

interface QuotaBarProps {
  label: string;
  current: number;
  max: number;
  unit: string;
  color?: 'green' | 'yellow' | 'red';
}

const QuotaBar: React.FC<QuotaBarProps> = ({ label, current, max, unit, color = 'green' }) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return 'bg-github-danger-emphasis';
      case 'yellow':
        return 'bg-github-warning-emphasis';
      default:
        return 'bg-github-success-emphasis';
    }
  };

  const getBackgroundColor = () => {
    switch (color) {
      case 'red':
        return 'bg-github-danger-subtle';
      case 'yellow':
        return 'bg-github-warning-subtle';
      default:
        return 'bg-github-success-subtle';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-github-fg-default">{label}</span>
        <span className="text-sm text-github-fg-muted">
          {current.toFixed(1)} / {max} {unit}
        </span>
      </div>
      <div className={`w-full h-3 ${getBackgroundColor()} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getColorClasses()} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-github-fg-subtle">
        {percentage.toFixed(1)}% utilisé
      </div>
    </div>
  );
};

const GuestDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionData, sessionStatus, isLoading, error, logout } = useGuestSession();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!sessionData && !isLoading) {
      navigate('/guest/login');
      return;
    }

    if (sessionData?.expiresAt) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const expires = new Date(sessionData.expiresAt!);
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining('Expiré');
          logout();
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionData, isLoading, navigate, logout]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/guest/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-github-canvas-default flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-github-accent-emphasis mx-auto"></div>
          <p className="mt-4 text-github-fg-muted">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-github-canvas-default flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-github-danger-emphasis mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-github-fg-default mb-2">Session non trouvée</h2>
          <p className="text-github-fg-muted mb-4">{error || 'Veuillez vous reconnecter'}</p>
          <button
            onClick={() => navigate('/guest/login')}
            className="bg-github-accent-emphasis text-github-fg-on-emphasis px-4 py-2 rounded-lg hover:bg-github-accent-fg transition-colors"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  const getQuotaColor = (current: number, max: number): 'green' | 'yellow' | 'red' => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  return (
    <div className="min-h-screen bg-github-canvas-default">
      <div className="bg-github-canvas-default shadow-github-shadow-small">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-github-accent-emphasis mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-github-fg-default">Accès Invité</h1>
                <p className="text-sm text-github-fg-subtle">Session active</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-github-danger-emphasis text-github-fg-on-emphasis rounded-lg hover:bg-github-danger-fg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations de session */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-github-canvas-default rounded-lg shadow-github-shadow-small p-6">
              <h2 className="text-lg font-semibold text-github-fg-default mb-4">Informations de session</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-github-canvas-default rounded-lg">
                  <CheckCircle className="h-5 w-5 text-github-success-emphasis mr-3" />
                  <div>
                    <p className="text-sm font-medium text-github-fg-default">Statut</p>
                    <p className="text-sm text-github-fg-muted">Actif</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-github-canvas-default rounded-lg">
                  <Clock className="h-5 w-5 text-github-accent-emphasis mr-3" />
                  <div>
                    <p className="text-sm font-medium text-github-fg-default">Temps restant</p>
                    <p className="text-sm text-github-fg-muted">{timeRemaining}</p>
                  </div>
                </div>
              </div>
              {sessionData.accessCode.description && (
                <div className="mt-4 p-3 bg-github-accent-subtle rounded-lg">
                  <p className="text-sm font-medium text-github-accent-fg">Description</p>
                  <p className="text-sm text-github-accent-fg">{sessionData.accessCode.description}</p>
                </div>
              )}
            </div>

            {/* Quotas */}
            <div className="bg-github-canvas-default rounded-lg shadow-github-shadow-small p-6">
              <h2 className="text-lg font-semibold text-github-fg-default mb-6">Quotas d'utilisation</h2>
              <div className="space-y-6">
                <QuotaBar
                  label="Données transférées"
                  current={sessionStatus?.dataUsed || 0}
                  max={sessionData.quotas.dataQuotaMB}
                  unit="MB"
                  color={getQuotaColor(sessionStatus?.dataUsed || 0, sessionData.quotas.dataQuotaMB)}
                />
                <QuotaBar
                  label="Temps d'utilisation"
                  current={sessionStatus?.timeUsed || 0}
                  max={sessionData.quotas.timeQuotaMinutes}
                  unit="min"
                  color={getQuotaColor(sessionStatus?.timeUsed || 0, sessionData.quotas.timeQuotaMinutes)}
                />
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="space-y-6">
            <div className="bg-github-canvas-default rounded-lg shadow-github-shadow-small p-6">
              <h2 className="text-lg font-semibold text-github-fg-default mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/guest/files')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-github-accent-emphasis text-github-fg-on-emphasis rounded-lg hover:bg-github-accent-fg transition-colors"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Accéder aux fichiers
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 border border-github-border-default text-github-fg-default rounded-lg hover:bg-github-canvas-default transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Terminer la session
                </button>
              </div>
            </div>

            {/* Alertes */}
            {sessionStatus && (sessionStatus.warnings.dataWarning || sessionStatus.warnings.timeWarning) && (
              <div className="bg-github-warning-subtle border border-github-warning-muted rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-github-warning-emphasis mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-github-warning-fg">Attention</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Vous approchez de vos limites de quota. Votre session pourrait expirer bientôt.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-github-canvas-default rounded-lg p-4">
              <h3 className="text-sm font-medium text-github-fg-default mb-2">Informations techniques</h3>
              <div className="space-y-1 text-xs text-github-fg-muted">
                <p>Session: {sessionData.sessionId}</p>
                <p>Démarrée: {new Date(sessionData.startedAt).toLocaleString()}</p>
                {sessionData.expiresAt && (
                  <p>Expire: {new Date(sessionData.expiresAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboardPage;
