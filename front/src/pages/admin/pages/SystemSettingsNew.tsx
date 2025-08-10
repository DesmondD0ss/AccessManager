import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Network,
  Shield,
  Users,
  Mail,
  Clock,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Upload,
  Monitor,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface SystemConfig {
  id: string;
  category: 'system' | 'network' | 'security' | 'email' | 'database' | 'users';
  key: string;
  label: string;
  description: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select' | 'password';
  options?: string[];
  unit?: string;
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    pattern?: string;
  };
  restartRequired?: boolean;
  sensitive?: boolean;
}

interface SystemStatus {
  uptime: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  lastBackup: string;
  diskUsage: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

const SystemSettingsNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('system');
  const [searchTerm, setSearchTerm] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, any>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'system', label: 'Système', icon: Server, color: 'text-blue-600 bg-blue-100' },
    { id: 'network', label: 'Réseau', icon: Network, color: 'text-green-600 bg-green-100' },
    { id: 'security', label: 'Sécurité', icon: Shield, color: 'text-red-600 bg-red-100' },
    { id: 'users', label: 'Utilisateurs', icon: Users, color: 'text-purple-600 bg-purple-100' },
    { id: 'email', label: 'Email', icon: Mail, color: 'text-orange-600 bg-orange-100' },
    { id: 'database', label: 'Base de données', icon: Database, color: 'text-indigo-600 bg-indigo-100' }
  ];

  const fetchSystemData = useCallback(async () => {
    try {
      setLoading(true);

      // Mock data - replace with real API calls
      const mockConfigs: SystemConfig[] = [
        {
          id: '1',
          category: 'system',
          key: 'system.name',
          label: 'Nom du système',
          description: 'Nom affiché du système',
          value: 'Zentry AccessManager',
          type: 'text',
          validation: { required: true }
        },
        {
          id: '2',
          category: 'system',
          key: 'system.timezone',
          label: 'Fuseau horaire',
          description: 'Fuseau horaire par défaut du système',
          value: 'Europe/Paris',
          type: 'select',
          options: ['Europe/Paris', 'Europe/London', 'America/New_York', 'Asia/Tokyo']
        },
        {
          id: '3',
          category: 'system',
          key: 'system.session_timeout',
          label: 'Timeout de session',
          description: 'Durée avant expiration automatique des sessions',
          value: 30,
          type: 'number',
          unit: 'minutes',
          validation: { min: 5, max: 480 }
        },
        {
          id: '4',
          category: 'network',
          key: 'network.max_connections',
          label: 'Connexions simultanées max',
          description: 'Nombre maximum de connexions simultanées autorisées',
          value: 1000,
          type: 'number',
          validation: { min: 10, max: 10000 }
        },
        {
          id: '5',
          category: 'network',
          key: 'network.bandwidth_limit',
          label: 'Limite de bande passante',
          description: 'Limite de bande passante par utilisateur',
          value: 100,
          type: 'number',
          unit: 'Mbps',
          validation: { min: 1, max: 1000 }
        },
        {
          id: '6',
          category: 'security',
          key: 'security.password_policy',
          label: 'Politique de mot de passe stricte',
          description: 'Activer la politique de mot de passe renforcée',
          value: true,
          type: 'boolean'
        },
        {
          id: '7',
          category: 'security',
          key: 'security.two_factor_required',
          label: 'Double authentification obligatoire',
          description: 'Exiger la double authentification pour tous les utilisateurs',
          value: false,
          type: 'boolean'
        },
        {
          id: '8',
          category: 'security',
          key: 'security.encryption_key',
          label: 'Clé de chiffrement',
          description: 'Clé principale de chiffrement des données',
          value: '••••••••••••••••••••••••••••••••',
          type: 'password',
          sensitive: true,
          validation: { required: true }
        },
        {
          id: '9',
          category: 'email',
          key: 'email.smtp_server',
          label: 'Serveur SMTP',
          description: 'Adresse du serveur SMTP pour l\'envoi d\'emails',
          value: 'smtp.example.com',
          type: 'text',
          validation: { required: true }
        },
        {
          id: '10',
          category: 'email',
          key: 'email.smtp_port',
          label: 'Port SMTP',
          description: 'Port du serveur SMTP',
          value: 587,
          type: 'number',
          validation: { min: 1, max: 65535 }
        },
        {
          id: '11',
          category: 'database',
          key: 'database.backup_frequency',
          label: 'Fréquence de sauvegarde',
          description: 'Fréquence des sauvegardes automatiques',
          value: 'daily',
          type: 'select',
          options: ['hourly', 'daily', 'weekly', 'monthly']
        },
        {
          id: '12',
          category: 'database',
          key: 'database.retention_days',
          label: 'Rétention des sauvegardes',
          description: 'Nombre de jours de conservation des sauvegardes',
          value: 30,
          type: 'number',
          unit: 'jours',
          validation: { min: 1, max: 365 }
        }
      ];

      const mockStatus: SystemStatus = {
        uptime: '15j 8h 32m',
        version: 'v2.1.0',
        environment: 'production',
        lastBackup: '2025-01-04T02:00:00Z',
        diskUsage: 45.8,
        memoryUsage: 78.5,
        cpuUsage: 42.3,
        activeConnections: 156,
        systemHealth: 'healthy'
      };

      setConfigs(mockConfigs);
      setStatus(mockStatus);

    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  const handleConfigChange = (configId: string, value: any) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [configId]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update configs with new values
      setConfigs(prev => prev.map(config => ({
        ...config,
        value: unsavedChanges[config.id] !== undefined ? unsavedChanges[config.id] : config.value
      })));
      
      setUnsavedChanges({});
      
      // Show success message (you could use a toast notification here)
      console.log('Configuration sauvegardée avec succès');
      
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setUnsavedChanges({});
  };

  const toggleSensitiveVisibility = (configId: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatLastBackup = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR');
  };

  const categoryConfigs = configs.filter(config => 
    config.category === activeCategory &&
    (config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
     config.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Chargement des paramètres</h3>
            <p className="text-slate-600">Récupération de la configuration système...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Paramètres Système</h1>
          <p className="text-slate-600">Configuration et gestion du système</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchSystemData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {hasUnsavedChanges && (
            <>
              <Button variant="secondary" onClick={handleReset}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">État du système</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status?.systemHealth || 'unknown')}`}>
                  {getStatusIcon(status?.systemHealth || 'unknown')}
                  {status?.systemHealth === 'healthy' ? 'Sain' : 
                   status?.systemHealth === 'warning' ? 'Attention' : 'Critique'}
                </div>
              </div>
              <Monitor className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Temps de fonctionnement</p>
                <p className="text-2xl font-bold text-slate-900">{status?.uptime}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Connexions actives</p>
                <p className="text-2xl font-bold text-slate-900">{status?.activeConnections}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Version</p>
                <p className="text-2xl font-bold text-slate-900">{status?.version}</p>
              </div>
              <Server className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Ressources Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Processeur</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{status?.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status?.cpuUsage || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">Mémoire</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{status?.memoryUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status?.memoryUsage || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">Stockage</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{status?.diskUsage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status?.diskUsage || 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Catégories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? category.color : 'text-slate-400 bg-slate-100'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{category.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un paramètre..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuration Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900 capitalize">
                {categories.find(c => c.id === activeCategory)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categoryConfigs.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Aucun paramètre trouvé</p>
                </div>
              ) : (
                categoryConfigs.map((config) => {
                  const currentValue = unsavedChanges[config.id] !== undefined 
                    ? unsavedChanges[config.id] 
                    : config.value;
                  const hasChanged = unsavedChanges[config.id] !== undefined;

                  return (
                    <div key={config.id} className={`p-4 border rounded-lg ${hasChanged ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-slate-900">{config.label}</h3>
                            {config.restartRequired && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                Redémarrage requis
                              </span>
                            )}
                            {hasChanged && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Modifié
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{config.description}</p>
                          
                          <div className="max-w-md">
                            {config.type === 'text' && (
                              <input
                                type="text"
                                value={currentValue as string}
                                onChange={(e) => handleConfigChange(config.id, e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required={config.validation?.required}
                              />
                            )}
                            
                            {config.type === 'number' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={currentValue as number}
                                  onChange={(e) => handleConfigChange(config.id, parseInt(e.target.value))}
                                  min={config.validation?.min}
                                  max={config.validation?.max}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required={config.validation?.required}
                                />
                                {config.unit && (
                                  <span className="text-sm text-slate-500">{config.unit}</span>
                                )}
                              </div>
                            )}
                            
                            {config.type === 'boolean' && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentValue as boolean}
                                  onChange={(e) => handleConfigChange(config.id, e.target.checked)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">
                                  {currentValue ? 'Activé' : 'Désactivé'}
                                </span>
                              </label>
                            )}
                            
                            {config.type === 'select' && (
                              <select
                                value={currentValue as string}
                                onChange={(e) => handleConfigChange(config.id, e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {config.options?.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            )}
                            
                            {config.type === 'password' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type={showSensitive[config.id] ? 'text' : 'password'}
                                  value={showSensitive[config.id] ? (currentValue as string) : '••••••••••••••••'}
                                  onChange={(e) => !config.sensitive && handleConfigChange(config.id, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required={config.validation?.required}
                                  readOnly={config.sensitive && !showSensitive[config.id]}
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => toggleSensitiveVisibility(config.id)}
                                >
                                  {showSensitive[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <button
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Informations"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Backup Information */}
          {activeCategory === 'database' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-900">Informations de Sauvegarde</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Dernière sauvegarde</p>
                      <p className="text-sm text-slate-600">{formatLastBackup(status?.lastBackup || '')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Nouvelle sauvegarde
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsNew;
