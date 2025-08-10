import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PageLayout from '../../../components/ui/PageLayout'
import { 
  Home, 
  Users, 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Shield,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react'

const DashboardOverviewGitHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    {
      title: 'Utilisateurs Actifs',
      value: '2,247',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'info'
    },
    {
      title: 'Sessions',
      value: '189',
      change: '+8.3%',
      trend: 'up',
      icon: Activity,
      color: 'success'
    },
    {
      title: 'Bande passante',
      value: '14.7 GB',
      change: '-2.1%',
      trend: 'down',
      icon: Server,
      color: 'warning'
    },
    {
      title: 'Performance',
      value: '68.4%',
      change: '+5.2%',
      trend: 'up',
      icon: Shield,
      color: 'info'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'user_login',
      user: 'admin@system.com',
      action: 'Connexion administrateur',
      time: '2 min',
      status: 'success'
    },
    {
      id: 2,
      type: 'system_update',
      user: 'système',
      action: 'Mise à jour sécurité appliquée',
      time: '15 min',
      status: 'success'
    },
    {
      id: 3,
      type: 'user_failed_login',
      user: 'guest@temp.com',
      action: 'Tentative de connexion échouée',
      time: '32 min',
      status: 'warning'
    },
    {
      id: 4,
      type: 'maintenance',
      user: 'système',
      action: 'Maintenance programmée démarrée',
      time: '1h',
      status: 'info'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-attention" />
      case 'error':
        return <XCircle className="w-4 h-4 text-danger" />
      default:
        return <Clock className="w-4 h-4 text-fg-muted" />
    }
  }

  const getStatBgColor = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-success'
      case 'warning':
        return 'bg-attention'
      case 'danger':
        return 'bg-danger'
      case 'info':
        return 'bg-accent'
      default:
        return 'bg-canvas-subtle'
    }
  }

  const actions = (
    <div className="flex gap-2">
      <Button variant="secondary">
        <RefreshCw className="w-4 h-4 mr-2" />
        Actualiser
      </Button>
      <Button variant="primary">
        <TrendingUp className="w-4 h-4 mr-2" />
        Rapport
      </Button>
    </div>
  )

  return (
    <PageLayout
      title="Vue d'ensemble"
      description="Tableau de bord principal avec statistiques et métriques système"
      actions={actions}
    >
      {/* Navigation par onglets */}
      <div className="border-b border-default">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
            { id: 'activity', label: 'Activité', icon: Activity },
            { id: 'security', label: 'Sécurité', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'border-accent text-accent' 
                    : 'border-transparent text-fg-muted hover:text-fg-default hover:border-default'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-fg-muted">{stat.title}</p>
                    <p className="text-2xl font-bold text-fg-default">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {stat.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-success mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-danger mr-1" />
                      )}
                      <span className={`text-xs ${stat.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`h-12 w-12 ${getStatBgColor(stat.color)} rounded-md flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <p className="text-sm text-fg-muted">Dernières actions système et utilisateurs</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 py-3 border-b border-default last:border-b-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg-default truncate">
                      {activity.action}
                    </p>
                    <p className="text-sm text-fg-muted">
                      {activity.user} • il y a {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-default">
              <Button variant="ghost" size="sm" className="w-full">
                Voir toute l'activité
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* État du système */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
            <p className="text-sm text-fg-muted">Surveillance des services et composants</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'API Backend', status: 'operational', uptime: '99.9%' },
                { name: 'Base de données', status: 'operational', uptime: '99.8%' },
                { name: 'Service d\'authentification', status: 'operational', uptime: '100%' },
                { name: 'Serveur Web', status: 'maintenance', uptime: '98.5%' },
                { name: 'Service de sauvegarde', status: 'operational', uptime: '99.2%' }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'operational' ? 'bg-success' : 
                      service.status === 'maintenance' ? 'bg-attention' : 
                      'bg-danger'
                    }`} />
                    <span className="text-sm font-medium text-fg-default">{service.name}</span>
                  </div>
                  <div className="text-sm text-fg-muted">
                    {service.uptime}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-default">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  Détails système
                </Button>
                <Button variant="danger" size="sm" className="flex-1">
                  Mode maintenance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Ajouter utilisateur', icon: Users, action: () => {} },
              { label: 'Voir logs', icon: Activity, action: () => {} },
              { label: 'Paramètres', icon: Server, action: () => {} },
              { label: 'Sécurité', icon: Shield, action: () => {} }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-canvas-subtle hover:bg-canvas-inset transition-colors"
                >
                  <Icon className="w-6 h-6 text-fg-muted" />
                  <span className="text-sm font-medium text-fg-default">{item.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default DashboardOverviewGitHub
