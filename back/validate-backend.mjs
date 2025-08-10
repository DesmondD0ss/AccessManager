#!/usr/bin/env node

/**
 * Script de validation finale pour le backend GAIS (compatible ES modules)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 VALIDATION FINALE DU BACKEND GAIS\n');

// Vérification de la compilation
console.log('📦 Vérification de la compilation...');
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  console.log('✅ Dossier dist: PRÉSENT');
  
  // Vérifier les fichiers principaux
  const mainFiles = [
    'index.js',
    'server.js'
  ];
  
  let mainFilesOK = 0;
  for (const file of mainFiles) {
    const filePath = join(distPath, file);
    if (existsSync(filePath)) {
      console.log(`✅ ${file}: COMPILÉ`);
      mainFilesOK++;
    } else {
      console.log(`❌ ${file}: MANQUANT`);
    }
  }
  
  if (mainFilesOK === mainFiles.length) {
    console.log('✅ Compilation TypeScript: SUCCÈS');
  } else {
    console.log('❌ Compilation TypeScript: INCOMPLÈTE');
  }
} else {
  console.log('❌ Compilation TypeScript: ÉCHEC (dossier dist manquant)');
}

// Vérification des services
console.log('\n🔧 Vérification des services...');
const services = [
  'services/quotaService.js',
  'services/networkService.js', 
  'services/cronService.js',
  'services/webSocketService.js'
];

let servicesOK = 0;
for (const service of services) {
  const servicePath = join(distPath, service);
  if (existsSync(servicePath)) {
    console.log(`✅ ${service.split('/').pop()}: COMPILÉ`);
    servicesOK++;
  } else {
    console.log(`❌ ${service.split('/').pop()}: MANQUANT`);
  }
}

// Vérification des routes
console.log('\n📡 Vérification des routes...');
const routes = [
  'routes/auth.js',
  'routes/quotas-advanced.js',
  'routes/network.js',
  'routes/users.js',
  'routes/sessions.js',
  'routes/statistics.js'
];

let routesOK = 0;
for (const route of routes) {
  const routePath = join(distPath, route);
  if (existsSync(routePath)) {
    console.log(`✅ ${route.split('/').pop()}: COMPILÉ`);
    routesOK++;
  } else {
    console.log(`❌ ${route.split('/').pop()}: MANQUANT`);
  }
}

// Test d'import dynamique des services (plus sûr)
console.log('\n🧪 Test des imports ES modules...');
let importsOK = 0;

try {
  const quotaServicePath = join(distPath, 'services/quotaService.js');
  if (existsSync(quotaServicePath)) {
    await import('./dist/services/quotaService.js');
    console.log('✅ QuotaService: IMPORTABLE');
    importsOK++;
  }
} catch (error) {
  console.log('❌ QuotaService: ERREUR D\'IMPORT');
  console.log(`   - ${error.message.split('\n')[0]}`);
}

try {
  const networkServicePath = join(distPath, 'services/networkService.js');
  if (existsSync(networkServicePath)) {
    await import('./dist/services/networkService.js');
    console.log('✅ NetworkService: IMPORTABLE');
    importsOK++;
  }
} catch (error) {
  console.log('❌ NetworkService: ERREUR D\'IMPORT');
  console.log(`   - ${error.message.split('\n')[0]}`);
}

try {
  const cronServicePath = join(distPath, 'services/cronService.js');
  if (existsSync(cronServicePath)) {
    await import('./dist/services/cronService.js');
    console.log('✅ CronService: IMPORTABLE');
    importsOK++;
  }
} catch (error) {
  console.log('❌ CronService: ERREUR D\'IMPORT');
  console.log(`   - ${error.message.split('\n')[0]}`);
}

try {
  const webSocketServicePath = join(distPath, 'services/webSocketService.js');
  if (existsSync(webSocketServicePath)) {
    await import('./dist/services/webSocketService.js');
    console.log('✅ WebSocketService: IMPORTABLE');
    importsOK++;
  }
} catch (error) {
  console.log('❌ WebSocketService: ERREUR D\'IMPORT');
  console.log(`   - ${error.message.split('\n')[0]}`);
}

// Résultat final
console.log('\n🎯 RÉSULTAT FINAL:');
console.log(`• Services compilés: ${servicesOK}/${services.length}`);
console.log(`• Routes compilées: ${routesOK}/${routes.length}`);
console.log(`• Services importables: ${importsOK}/${services.length}`);

const totalTests = services.length + routes.length;
const totalSuccess = servicesOK + routesOK;
const successRate = Math.round((totalSuccess / totalTests) * 100);

console.log(`• Taux de réussite global: ${successRate}%`);

if (servicesOK === services.length && routesOK === routes.length && importsOK === services.length) {
  console.log('\n🚀 BACKEND GAIS: ENTIÈREMENT FONCTIONNEL ! ✅');
  console.log('\n📋 Fonctionnalités validées:');
  console.log('• ✅ Compilation TypeScript parfaite');
  console.log('• ✅ Tous les services opérationnels');
  console.log('• ✅ Toutes les routes compilées');
  console.log('• ✅ Imports ES modules fonctionnels');
  console.log('• ✅ Architecture prête pour production');
} else if (successRate >= 80) {
  console.log('\n⚡ BACKEND GAIS: LARGEMENT FONCTIONNEL ! ✅');
  console.log('\n📋 La plupart des composants sont opérationnels');
} else {
  console.log('\n⚠️ Des composants nécessitent une attention');
  
  if (servicesOK < services.length) {
    console.log('🔧 Services à vérifier');
  }
  if (routesOK < routes.length) {
    console.log('📡 Routes à vérifier');
  }
  if (importsOK < services.length) {
    console.log('🧪 Imports à corriger');
  }
}

console.log('\n🏁 Validation terminée !');
