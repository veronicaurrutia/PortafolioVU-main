import { Dynatrace, type IDynatraceAction } from '@dynatrace/react-native-plugin';

/**
 * Dynatrace = observabilidad TÉCNICA / APM (RUM móvil):
 * crashes, errores JS, tiempos de user actions, requests HTTP, arranque de la app,
 * y trazas end-to-end si el backend también está instrumentado.
 * Responde "¿qué falló, dónde y cuánto tardó?".
 *
 * La mayor parte es AUTOMÁTICA: el plugin de Babel instrumenta toques, componentes y fetch,
 * y el OneAgent nativo captura crashes y el arranque (config en dynatrace.config.js).
 * Aquí solo agregamos lo que el auto-instrumentado no sabe: usuario, acciones de negocio y errores manejados.
 */
const safe = (fn: () => void) => {
  try {
    fn();
  } catch (e) {
    if (__DEV__) console.warn('[Dynatrace]', e);
  }
};

export const dynatrace = {
  identify(uid: string) {
    safe(() => Dynatrace.identifyUser(uid));
  },

  /**
   * Acción de negocio medida (ej. "Publicar alerta"). enterAutoAction deja que el plugin
   * cuelgue de ella los requests que ocurran mientras está abierta.
   */
  startAction(name: string): IDynatraceAction | null {
    try {
      return Dynatrace.enterAutoAction(name);
    } catch {
      return null;
    }
  },

  /** Error manejado (no crash): lo vemos en Dynatrace con su stack. */
  error(name: string, error: unknown) {
    // Acepta Error real o SerializedError de Redux ({ name, message, stack, code }).
    const e = (error ?? {}) as { name?: string; message?: string; stack?: string; code?: string };
    safe(() =>
      Dynatrace.reportErrorStacktrace(
        name,
        e.message ?? String(error),
        e.code ?? e.name ?? 'Error',
        e.stack ?? 'sin stack',
      ),
    );
  },

  /** Valor de negocio suelto, asociado a una acción breve. */
  value(actionName: string, key: string, value: string) {
    safe(() => {
      const a = Dynatrace.enterAutoAction(actionName);
      a.reportStringValue(key, value);
      a.leaveAction();
    });
  },

  endSession() {
    safe(() => Dynatrace.endSession());
  },
};
