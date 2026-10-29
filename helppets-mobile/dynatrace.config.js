/**
 * Configuración del OneAgent de Dynatrace para React Native.
 * Se aplica a los proyectos nativos con `npx instrumentDynatrace` (lo corre `npm run prebuild`).
 * Si cambias este archivo: vuelve a instrumentar y arranca Metro con --reset-cache.
 *
 * Application ID y Beacon URL salen de: Dynatrace → Mobile → tu app → Settings → Instrumentation.
 * Se leen de variables de entorno para no commitear valores por ambiente.
 */
// `npx instrumentDynatrace` no lee .env por sí solo: cargamos las DT_* a mano (sin dependencias).
try {
  require('fs')
    .readFileSync(require('path').join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^\s*(DT_[A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
} catch {
  /* sin .env: se usan variables del entorno (CI) */
}

const APP_ID = process.env.DT_APPLICATION_ID || 'REEMPLAZAR_APPLICATION_ID';
const BEACON_URL = process.env.DT_BEACON_URL || 'https://REEMPLAZAR.bf.dynatrace.com/mbeacon';

// Pantallas cuyo ciclo de vida (montaje/render) queremos medir.
const LIFECYCLE_SCREENS = ['HomeScreen', 'PetDetailScreen', 'ChatDetailScreen', 'CreateAlertScreen'];

module.exports = {
  react: {
    autoStart: true, // arranca antes que el JS → mide el app start completo
    debug: process.env.NODE_ENV !== 'production',

    errorHandler: {
      enabled: true, // errores JS no manejados
      reportFatalErrorAsCrash: true,
    },

    lifecycle: {
      includeUpdate: false,
      instrument: (filename) => LIFECYCLE_SCREENS.some((s) => filename.includes(s)),
    },

    input: {
      // Toques en botones / Pressable → user actions automáticas
      instrument: (filename) => !filename.includes('node_modules'),
    },

    userInteraction: true,

    navigation: {
      enabled: true, // cada cambio de @react-navigation queda como acción/vista
    },
  },

  android: {
    config: `
    dynatrace {
      configurations {
        defaultConfig {
          autoStart {
            applicationId '${APP_ID}'
            beaconUrl '${BEACON_URL}'
          }
          userOptIn false
          crashReporting true
          agentBehavior.startupLoadBalancing true
        }
      }
    }
    `,
  },

  ios: {
    config: `
    <key>DTXApplicationID</key>
    <string>${APP_ID}</string>
    <key>DTXBeaconURL</key>
    <string>${BEACON_URL}</string>
    <key>DTXCrashReportingEnabled</key>
    <true/>
    <key>DTXStartupLoadBalancing</key>
    <true/>
    `,
  },
};
