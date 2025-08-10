import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Info, Server, Database, Settings, Shield } from 'lucide-react';
import { apiService } from '../../services/apiService';

interface SystemInfo {
  server: {
    nodeVersion: string;
    platform: string;
    architecture: string;
    uptime: {
      seconds: number;
      formatted: string;
    };
    environment: string;
    port: number;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    unit: string;
  };
  database: {
    type: string;
    connected: boolean;
    version: string;
    tablesCount: number;
  };
  configuration: {
    maxSessions: number;
    sessionTimeout: number;
    dataQuotaDefault: number;
    timeQuotaDefault: number;
    emailNotifications: boolean;
    backupEnabled: boolean;
    logLevel: string;
  };
}

const SystemConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [config, setConfig] = useState<SystemInfo['configuration'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/admin/system/info');
      const data = response.data as SystemInfo;
      setSystemInfo(data);
      setConfig(data.configuration);
    } catch (err) {
      setError('Erreur lors du chargement des informations système');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await apiService.put('/admin/system/config', config);
      setSuccess('Configuration sauvegardée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const tabs = [
    { id: 'info', label: 'Informations Système', icon: Info },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-github-canvas-default dark:bg-github-dark-canvas-default flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-github-accent-emphasis mx-auto"></div>
          <p className="mt-4 text-github-fg-muted dark:text-github-dark-fg-muted">Chargement des informations système...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-github-canvas-default dark:bg-github-dark-canvas-default py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-github-fg-default dark:text-github-dark-fg-default">
            Configuration Système
          </h1>
          <p className="mt-2 text-github-fg-muted dark:text-github-dark-fg-muted">
            Informations système et paramètres de configuration
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-github-danger-subtle dark:bg-github-dark-danger-emphasis/50 border border-github-danger-muted dark:border-github-danger-fg rounded-md p-4">
            <p className="text-github-danger-fg dark:text-github-danger-fg">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-github-success-subtle dark:bg-github-dark-success-emphasis/50 border border-github-success-muted dark:border-github-dark-success-fg rounded-md p-4">
            <p className="text-github-success-fg dark:text-github-success-fg">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-github-canvas-default dark:bg-github-dark-canvas-default rounded-lg shadow-github-shadow-small">
          <div className="border-b border-github-border-default dark:border-github-dark-border-default">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-github-accent-subtle0 text-github-accent-emphasis dark:text-github-dark-accent-emphasis'
                        : 'border-transparent text-github-fg-subtle hover:text-github-fg-default dark:text-github-dark-fg-muted dark:hover:text-github-fg-subtle'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' && systemInfo && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    onClick={fetchSystemInfo}
                    className="inline-flex items-center px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md shadow-github-shadow-small-github-shadow-github-shadow-small-small text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default bg-github-canvas-default dark:bg-github-dark-canvas-overlay hover:bg-github-canvas-default dark:hover:bg-github-dark-neutral-emphasis"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Server Information */}
                  <div className="bg-github-canvas-default dark:bg-github-dark-canvas-overlay rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Server className="w-6 h-6 text-github-accent-emphasis mr-3" />
                      <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">
                        Serveur
                      </h3>
                    </div>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Version Node.js</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.server.nodeVersion}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Plateforme</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.server.platform}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Architecture</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.server.architecture}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Durée de fonctionnement</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.server.uptime.formatted}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Environnement</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.server.environment}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Port</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.server.port}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Memory Information */}
                  <div className="bg-github-canvas-default dark:bg-github-dark-canvas-overlay rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Database className="w-6 h-6 text-github-success-emphasis mr-3" />
                      <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">
                        Mémoire
                      </h3>
                    </div>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">RSS</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{formatBytes(systemInfo.memory.rss)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Heap Total</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{formatBytes(systemInfo.memory.heapTotal)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Heap Utilisé</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{formatBytes(systemInfo.memory.heapUsed)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Externe</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{formatBytes(systemInfo.memory.external)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Database Information */}
                  <div className="bg-github-canvas-default dark:bg-github-dark-canvas-overlay rounded-lg p-6 md:col-span-2">
                    <div className="flex items-center mb-4">
                      <Database className="w-6 h-6 text-purple-600 mr-3" />
                      <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">
                        Base de Données
                      </h3>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Type</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.database.type}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Statut</dt>
                        <dd className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            systemInfo.database.connected
                              ? 'bg-github-success-subtle text-github-success-fg dark:bg-github-dark-success-emphasis dark:text-github-success-fg'
                              : 'bg-github-danger-subtle text-github-danger-fg dark:bg-github-dark-danger-emphasis dark:text-github-danger-fg'
                          }`}>
                            {systemInfo.database.connected ? 'Connecté' : 'Déconnecté'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Version</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.database.version}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-github-fg-subtle dark:text-github-dark-fg-muted">Tables</dt>
                        <dd className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{systemInfo.database.tablesCount}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'config' && config && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                      Sessions Maximum
                    </label>
                    <input
                      type="number"
                      value={config.maxSessions}
                      onChange={(e) => setConfig({ ...config, maxSessions: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-github-accent-emphasis bg-github-canvas-default dark:bg-github-dark-canvas-overlay text-github-fg-default dark:text-github-dark-fg-default"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                      Timeout de Session (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.sessionTimeout}
                      onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-github-accent-emphasis bg-github-canvas-default dark:bg-github-dark-canvas-overlay text-github-fg-default dark:text-github-dark-fg-default"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                      Quota de Données par Défaut (MB)
                    </label>
                    <input
                      type="number"
                      value={config.dataQuotaDefault}
                      onChange={(e) => setConfig({ ...config, dataQuotaDefault: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-github-accent-emphasis bg-github-canvas-default dark:bg-github-dark-canvas-overlay text-github-fg-default dark:text-github-dark-fg-default"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                      Quota de Temps par Défaut (minutes)
                    </label>
                    <input
                      type="number"
                      value={config.timeQuotaDefault}
                      onChange={(e) => setConfig({ ...config, timeQuotaDefault: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-github-accent-emphasis bg-github-canvas-default dark:bg-github-dark-canvas-overlay text-github-fg-default dark:text-github-dark-fg-default"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                      Niveau de Log
                    </label>
                    <select
                      value={config.logLevel}
                      onChange={(e) => setConfig({ ...config, logLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-github-accent-emphasis bg-github-canvas-default dark:bg-github-dark-canvas-overlay text-github-fg-default dark:text-github-dark-fg-default"
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={config.emailNotifications}
                      onChange={(e) => setConfig({ ...config, emailNotifications: e.target.checked })}
                      className="h-4 w-4 text-github-accent-emphasis focus:ring-github-accent-emphasis border-github-border-default dark:border-github-dark-border-default rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 block text-sm text-github-fg-default dark:text-github-dark-fg-default">
                      Notifications par Email
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="backupEnabled"
                      checked={config.backupEnabled}
                      onChange={(e) => setConfig({ ...config, backupEnabled: e.target.checked })}
                      className="h-4 w-4 text-github-accent-emphasis focus:ring-github-accent-emphasis border-github-border-default dark:border-github-dark-border-default rounded"
                    />
                    <label htmlFor="backupEnabled" className="ml-2 block text-sm text-github-fg-default dark:text-github-dark-fg-default">
                      Sauvegardes Automatiques
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-github-shadow-small-github-shadow-github-shadow-small-small text-sm font-medium text-github-fg-on-emphasis bg-github-accent-emphasis hover:bg-github-accent-fg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-github-accent-fg dark:hover:bg-github-accent-fg"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-github-border-default mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-github-warning-subtle dark:bg-github-dark-warning-emphasis/50 border border-github-warning-muted dark:border-github-warning-fg rounded-md p-4">
                  <div className="flex">
                    <Shield className="w-5 h-5 text-github-warning-emphasis mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-github-warning-fg dark:text-github-dark-warning-fg">
                        Configuration de Sécurité
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-github-dark-warning-emphasis mt-1">
                        Cette section sera disponible dans une version ultérieure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/admin/dashboard"
            className="text-github-accent-emphasis dark:text-github-dark-accent-emphasis hover:underline"
          >
            Retour au Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
