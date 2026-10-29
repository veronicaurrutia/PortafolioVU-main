import * as Clarity from '@microsoft/react-native-clarity';
import { env } from '../config/env';

/**
 * Microsoft Clarity = analítica de COMPORTAMIENTO (UX):
 * grabaciones de sesión, heatmaps, rage taps, dead taps, embudos.
 * Responde "¿qué hizo el usuario y dónde se frustró?".
 *
 * Privacidad: el enmascarado se configura en el dashboard de Clarity
 * (Settings → Masking). Por defecto ("Balanced") los TextInput van enmascarados,
 * así que contraseñas y teléfonos nunca aparecen en las grabaciones.
 *
 * Nota: Clarity necesita código nativo → no corre en Expo Go, sí en un development build.
 */
let enabled = false;

export const clarity = {
  init() {
    if (!env.clarityProjectId || enabled) return;
    try {
      Clarity.initialize(env.clarityProjectId, {
        logLevel: __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.None,
      });
      Clarity.setCustomTag('app_env', env.appEnv);
      enabled = true;
    } catch (e) {
      // La observabilidad nunca debe botar la app.
      if (__DEV__) console.warn('[Clarity] no se pudo inicializar', e);
    }
  },

  /** Usamos el uid (no el email) para no enviar PII a terceros. */
  identify(uid: string) {
    if (enabled) Clarity.setCustomUserId(uid);
  },

  screen(name: string) {
    if (enabled) Clarity.setCurrentScreenName(name);
  },

  /** Eventos de negocio: permiten filtrar grabaciones (ej. "sesiones que publicaron alerta"). */
  event(name: string) {
    if (enabled) Clarity.sendCustomEvent(name);
  },

  tag(key: string, value: string) {
    if (enabled) Clarity.setCustomTag(key, value);
  },
};
