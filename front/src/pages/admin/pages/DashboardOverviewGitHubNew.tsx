import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import PageLayout from '../../../components/ui/PageLayout'
import Badge from '../../../components/ui/Badge'
import { 
  Users, 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'

const DashboardOverviewGitHub: React.FC = () => {

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

  const recentActivities = [
    {
      id: 1,
      type: 'login',
      user: 'admin@system.com',
      action: 'Connexion réussie',
      time: '2024-01-20 14:32:15',
      status: 'success'
    },
    {
      id: 2,
      type: 'security',
      user: 'admin@system',
      action: 'Modification des règles de sécurité',
      time: '2024-01-20 14:28:42',
      status: 'warning'
    },
    {
      id: 3,
      type: 'error',
      user: 'jane.smith@company.com',
      action: 'Tentative de connexion échouée',
      time: '2024-01-20 14:28:33',
      status: 'error'
    },
    {
      id: 4,
      type: 'system',
      user: 'system',
      action: 'Sauvegarde automatique effectuée',
      time: '2024-01-20 14:00:00',
      status: 'success'
    }
  ]

  const systemStatus = [
    { name: 'API Backend', status: 'operational', uptime: '99.9%' },
    { name: 'Base de données', status: 'operational', uptime: '99.8%' },
    { name: 'Service d\'authentification', status: 'warning', uptime: '98.5%' },
    { name: 'Système de fichiers', status: 'operational', uptime: '100%' },
  ]

  const getStatColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-success'
      case 'warning':
        return 'bg-warning'
      case 'error':
        return 'bg-danger'
      case 'info':
      default:
        return 'bg-accent'
    }
  }

  const getActivityIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 icon-success" />
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 icon-warning" />
    if (status === 'error') return <XCircle className="w-4 h-4 icon-error" />
    return <CheckCircle className="w-4 h-4 icon-info" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge variant="success" showIcon>Opérationnel</Badge>
      case 'warning':
        return <Badge variant="warning" showIcon>Attention</Badge>
      case 'error':
        return <Badge variant="error" showIcon>Erreur</Badge>
      default:
        return <Badge variant="default">Inconnu</Badge>
    }
  }

  const actions = (
    <>
      <button className="btn btn-default">
        <RefreshCw className="w-4 h-4 mr-2" />
        Actualiser
      </button>
      <button className="btn btn-primary">
        <TrendingUp className="w-4 h-4 mr-2" />
        Rapport
      </button>
    </>
  )

  return (
    <PageLayout
      title="Vue d'ensemble"
      description="Tableau de bord principal avec statistiques et métriques système"
      actions={actions}
    >
      {/* Statistics Cards */}
      <div className="stats-grid">
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
                  <div className={`h-12 w-12 ${getStatColorClasses(stat.color)} rounded-md flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-default">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-canvas-subtle transition-colors">
                  <div className="flex items-start space-x-3">
                    {getActivityIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-fg-default truncate">
                          {activity.action}
                        </p>
                        <Badge 
                          variant={activity.status === 'success' ? 'success' : activity.status === 'warning' ? 'warning' : 'error'}
                          size="sm"
                        >
                          {activity.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-fg-muted">
                        Utilisateur: {activity.user}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-default">
              <button className="btn btn-ghost w-full">
                Voir toute l'activité
              </button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'operational' ? 'bg-success' : 
                      service.status === 'warning' ? 'bg-warning' : 'bg-danger'
                    }`}></div>
                    <span className="text-sm font-medium text-fg-default">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-fg-muted">{service.uptime}</span>
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-default">
              <div className="flex space-x-2">
                <button className="btn btn-default flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Démarrer
                </button>
                <button className="btn btn-default flex-1">
                  <Pause className="w-4 h-4 mr-2" />
                  Arrêter
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-default justify-start">
              <Users className="w-4 h-4 mr-2" />
              Gérer les utilisateurs
            </button>
            <button className="btn btn-default justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Audit de sécurité
            </button>
            <button className="btn btn-default justify-start">
              <Server className="w-4 h-4 mr-2" />
              Configuration système
            </button>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default DashboardOverviewGitHub
