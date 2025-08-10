import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Database,
  Mail,
  Shield,
  Globe,
  Save,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'security' | 'database' | 'server' | 'email' | 'notifications' | 'network';
  description: string;
  isRequired: boolean;
  isSecret?: boolean;
}

const SystemSettingsGitHub: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [changedConfigs, setChangedConfigs] = useState<Map<string, string>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data
  useEffect(() => {
    const mockConfigs: SystemConfig[] = [
      // General
      { id: '1', key: 'app.name', value: 'Access Manager', type: 'string', category: 'general', description: 'Nom de l\'application', isRequired: true },
      { id: '2', key: 'app.version', value: '2.1.0', type: 'string', category: 'general', description: 'Version de l\'application', isRequired: true },
      { id: '3', key: 'app.debug', value: 'false', type: 'boolean', category: 'general', description: 'Mode debug activé', isRequired: false },
      
      // Security
      { id: '4', key: 'jwt.secret', value: '***', type: 'string', category: 'security', description: 'Clé secrète JWT', isRequired: true, isSecret: true },
      { id: '5', key: 'session.timeout', value: '3600', type: 'number', category: 'security', description: 'Délai d\'expiration de session (secondes)', isRequired: true },
      { id: '6', key: 'auth.2fa.enabled', value: 'true', type: 'boolean', category: 'security', description: 'Authentification à deux facteurs', isRequired: false },
      
      // Database
      { id: '7', key: 'db.host', value: 'localhost', type: 'string', category: 'database', description: 'Hôte de la base de données', isRequired: true },
      { id: '8', key: 'db.port', value: '5432', type: 'number', category: 'database', description: 'Port de la base de données', isRequired: true },
      { id: '9', key: 'db.backup.enabled', value: 'true', type: 'boolean', category: 'database', description: 'Sauvegarde automatique', isRequired: false },
      
      // Server
      { id: '10', key: 'server.port', value: '8080', type: 'number', category: 'server', description: 'Port du serveur', isRequired: true },
      { id: '11', key: 'server.ssl.enabled', value: 'true', type: 'boolean', category: 'server', description: 'SSL activé', isRequired: false },
      
      // Email
      { id: '12', key: 'smtp.host', value: 'smtp.company.com', type: 'string', category: 'email', description: 'Serveur SMTP', isRequired: false },
      { id: '13', key: 'smtp.port', value: '587', type: 'number', category: 'email', description: 'Port SMTP', isRequired: false },
      
      // Network
      { id: '14', key: 'network.proxy.enabled', value: 'false', type: 'boolean', category: 'network', description: 'Proxy activé', isRequired: false },
      { id: '15', key: 'network.timeout', value: '30000', type: 'number', category: 'network', description: 'Délai de connexion réseau (ms)', isRequired: true },
    ];

    setConfigs(mockConfigs);
    setLoading(false);
  }, []);

  const categories = [
    {
      name: 'general',
      icon: Settings,
      label: 'Général',
      description: 'Paramètres généraux de l\'application',
      configs: configs.filter(c => c.category === 'general')
    },
    {
      name: 'security',
      icon: Shield,
      label: 'Sécurité',
      description: 'Paramètres de sécurité et authentification',
      configs: configs.filter(c => c.category === 'security')
    },
    {
      name: 'database',
      icon: Database,
      label: 'Base de données',
      description: 'Configuration de la base de données',
      configs: configs.filter(c => c.category === 'database')
    },
    {
      name: 'server',
      icon: Server,
      label: 'Serveur',
      description: 'Paramètres du serveur et performance',
      configs: configs.filter(c => c.category === 'server')
    },
    {
      name: 'email',
      icon: Mail,
      label: 'Email',
      description: 'Configuration des emails et notifications',
      configs: configs.filter(c => c.category === 'email')
    },
    {
      name: 'network',
      icon: Globe,
      label: 'Réseau',
      description: 'Paramètres réseau et accès',
      configs: configs.filter(c => c.category === 'network')
    }
  ];

  const handleConfigChange = (configId: string, newValue: string) => {
    const newChangedConfigs = new Map(changedConfigs);
    const originalConfig = configs.find(c => c.id === configId);
    
    if (originalConfig && originalConfig.value !== newValue) {
      newChangedConfigs.set(configId, newValue);
    } else {
      newChangedConfigs.delete(configId);
    }
    
    setChangedConfigs(newChangedConfigs);
    setHasChanges(newChangedConfigs.size > 0);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update configs with new values
      setConfigs(prev => prev.map(config => {
        const newValue = changedConfigs.get(config.id);
        return newValue ? { ...config, value: newValue } : config;
      }));
      
      setChangedConfigs(new Map());
      setHasChanges(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setChangedConfigs(new Map());
    setHasChanges(false);
  };

  const renderConfigInput = (config: SystemConfig) => {
    const currentValue = changedConfigs.get(config.id) || config.value;
    const hasChanged = changedConfigs.has(config.id);

    const inputClasses = `input w-full ${hasChanged ? 'border-warning bg-canvas-subtle' : ''}`;

    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={currentValue === 'true'}
              onChange={(e) => handleConfigChange(config.id, e.target.checked.toString())}
              className="rounded border-default text-accent shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-fg-muted">
              {currentValue === 'true' ? 'Activé' : 'Désactivé'}
            </span>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            className={inputClasses}
          />
        );

      case 'json':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            rows={4}
            className={`${inputClasses} font-mono text-sm`}
          />
        );

      default:
        return (
          <input
            type={config.isSecret ? 'password' : 'text'}
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            className={inputClasses}
          />
        );
    }
  };

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);
  const categoryConfigs = selectedCategoryData?.configs.filter(config =>
    config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-canvas-default min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg-default">Paramètres Système</h1>
            <p className="text-fg-muted mt-1">
              Configuration et paramètres avancés du système
            </p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-3">
              <button 
                onClick={resetChanges}
                className="btn btn-default"
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Annuler
              </button>
              <button 
                onClick={saveChanges}
                className="btn btn-primary"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>

        {/* Changes Alert */}
        {hasChanges && (
          <Card>
            <CardContent>
              <div className="flex items-center p-4 bg-canvas-subtle border border-warning rounded-md">
                <AlertTriangle className="w-5 h-5 icon-warning mr-3" />
                <div>
                  <p className="font-medium text-fg-default">Modifications non sauvegardées</p>
                  <p className="text-sm text-fg-muted">
                    Vous avez {changedConfigs.size} paramètre(s) modifié(s). N'oubliez pas de sauvegarder.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Catégories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.name;
                    return (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-none transition-colors ${
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-fg-default hover:bg-canvas-subtle'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        <span>{category.label}</span>
                        <span className="ml-auto text-xs opacity-75">
                          {category.configs.length}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <Card>
              <CardContent>
                <div className="relative">
                  <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
                  <input
                    type="text"
                    placeholder="Rechercher un paramètre..."
                    className="input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category Header */}
            {selectedCategoryData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <selectedCategoryData.icon className="w-6 h-6 icon-info mr-3" />
                    <div>
                      <CardTitle>{selectedCategoryData.label}</CardTitle>
                      <p className="text-fg-muted text-sm mt-1">
                        {selectedCategoryData.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Configuration Items */}
            <div className="space-y-4">
              {categoryConfigs.map((config) => {
                const hasChanged = changedConfigs.has(config.id);
                return (
                  <Card key={config.id} className={hasChanged ? 'border-warning' : ''}>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-fg-default">{config.key}</h3>
                            {config.isRequired && (
                              <span className="text-danger text-sm">*</span>
                            )}
                            {hasChanged && (
                              <span className="bg-warning text-white text-xs px-2 py-1 rounded-full">
                                Modifié
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-fg-muted mt-1">{config.description}</p>
                          {config.isSecret && (
                            <div className="flex items-center mt-2 text-xs text-fg-muted">
                              <Info className="w-3 h-3 mr-1 icon-info" />
                              Valeur sensible (masquée)
                            </div>
                          )}
                        </div>
                        <div className="w-full sm:w-80">
                          {renderConfigInput(config)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {categoryConfigs.length === 0 && (
              <Card>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-fg-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-fg-default mb-2">
                      Aucun paramètre trouvé
                    </h3>
                    <p className="text-fg-muted">
                      {searchTerm 
                        ? `Aucun paramètre ne correspond à "${searchTerm}"`
                        : 'Cette catégorie ne contient aucun paramètre'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsGitHub;
