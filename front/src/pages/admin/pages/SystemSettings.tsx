import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Shield,
  Database,
  Server,
  Mail,
  Bell,
  Globe,
  Lock,
  AlertCircle,
  Clock
} from 'lucide-react';
import { apiService } from '../../../services/apiService';

interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isPublic: boolean;
  updatedAt: string;
}

interface ConfigCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  configs: SystemConfig[];
}

const SystemSettings: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [changedConfigs, setChangedConfigs] = useState<Map<string, string>>(new Map());

  const categories: ConfigCategory[] = [
    {
      name: 'general',
      icon: Settings,
      description: 'Configuration générale du système',
      configs: configs.filter(c => c.category === 'general')
    },
    {
      name: 'security',
      icon: Shield,
      description: 'Paramètres de sécurité et authentification',
      configs: configs.filter(c => c.category === 'security')
    },
    {
      name: 'database',
      icon: Database,
      description: 'Configuration de la base de données',
      configs: configs.filter(c => c.category === 'database')
    },
    {
      name: 'server',
      icon: Server,
      description: 'Paramètres du serveur et performance',
      configs: configs.filter(c => c.category === 'server')
    },
    {
      name: 'email',
      icon: Mail,
      description: 'Configuration des emails et notifications',
      configs: configs.filter(c => c.category === 'email')
    },
    {
      name: 'notifications',
      icon: Bell,
      description: 'Système de notifications',
      configs: configs.filter(c => c.category === 'notifications')
    },
    {
      name: 'network',
      icon: Globe,
      description: 'Paramètres réseau et accès',
      configs: configs.filter(c => c.category === 'network')
    }
  ];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/admin/system/config');
      setConfigs((response.data as SystemConfig[]) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const updates = Array.from(changedConfigs.entries()).map(([id, value]) => ({
        id,
        value
      }));

      await apiService.put('/admin/system/config/bulk', { updates });
      
      // Reload configs to get updated values
      await loadConfigs();
      
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

  const selectedCategoryData = categories.find(c => c.name === selectedCategory);
  const categoryConfigs = selectedCategoryData?.configs.filter(config =>
    config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const renderConfigInput = (config: SystemConfig) => {
    const currentValue = changedConfigs.get(config.id) || config.value;
    const hasChanged = changedConfigs.has(config.id);

    switch (config.type) {
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentValue === 'true'}
              onChange={(e) => handleConfigChange(config.id, e.target.checked.toString())}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
              hasChanged ? 'border-yellow-400 bg-yellow-50' : ''
            }`}
          />
        );

      case 'json':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            rows={4}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 font-mono text-sm ${
              hasChanged ? 'border-yellow-400 bg-yellow-50' : ''
            }`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleConfigChange(config.id, e.target.value)}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
              hasChanged ? 'border-yellow-400 bg-yellow-50' : ''
            }`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="w-7 h-7 mr-3 text-blue-600" />
              Configuration Système
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les paramètres globaux de l'application
            </p>
          </div>
          
          {hasChanges && (
            <div className="flex space-x-3">
              <button
                onClick={resetChanges}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Annuler
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Rechercher une configuration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Catégories</h3>
          <div className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.name;
              
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium capitalize">{category.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {category.configs.length} paramètres
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                {selectedCategoryData && (
                  <>
                    <selectedCategoryData.icon className="w-6 h-6 mr-3 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {selectedCategoryData.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {selectedCategoryData.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6">
              {categoryConfigs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? 'Aucune configuration trouvée' : 'Aucune configuration dans cette catégorie'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {categoryConfigs.map((config) => {
                    const hasChanged = changedConfigs.has(config.id);
                    
                    return (
                      <div
                        key={config.id}
                        className={`p-4 border rounded-lg ${
                          hasChanged ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900">{config.key}</h4>
                              {hasChanged && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Modifié
                                </span>
                              )}
                              {!config.isPublic && (
                                <Lock className="w-4 h-4 ml-2 text-red-500" />
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1">{config.description}</p>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(config.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          {renderConfigInput(config)}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Type: {config.type} | Visibilité: {config.isPublic ? 'Public' : 'Privé'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center text-yellow-700 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Modifications non sauvegardées</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {changedConfigs.size} configuration{changedConfigs.size > 1 ? 's' : ''} modifiée{changedConfigs.size > 1 ? 's' : ''}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={resetChanges}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
