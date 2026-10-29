import { clarity } from './clarity';
import { dynatrace } from './dynatrace';

/**
 * Fachada única de observabilidad. Las pantallas y Redux SOLO conocen este módulo,
 * nunca los SDKs. Ventajas:
 *  - cambiar o agregar un proveedor (ej. Firebase Analytics) toca un solo archivo,
 *  - en tests se mockea una sola cosa,
 *  - nombres de eventos centralizados y tipados (no strings sueltos por la app).
 */
export type AnalyticsEvent =
  | 'login_success'
  | 'register_success'
  | 'logout'
  | 'alert_created'
  | 'alert_status_changed'
  | 'chat_opened'
  | 'message_sent'
  | 'pet_viewed';

export const analytics = {
  init() {
    clarity.init();
    // Dynatrace arranca solo (autoStart en dynatrace.config.js) antes que el JS.
  },

  identify(uid: string | null) {
    if (!uid) return;
    clarity.identify(uid);
    dynatrace.identify(uid);
  },

  screen(name: string) {
    clarity.screen(name);
    // Dynatrace ya registra la navegación con el auto-instrumentado de componentes.
  },

  track(event: AnalyticsEvent, props?: Record<string, string>) {
    clarity.event(event);
    if (props) Object.entries(props).forEach(([k, v]) => dynatrace.value(event, k, v));
  },

  error(name: string, error: unknown) {
    dynatrace.error(name, error);
    clarity.event(`error_${name}`);
  },

  /** Mide una operación asíncrona como user action de Dynatrace. */
  async measure<T>(actionName: string, fn: () => Promise<T>): Promise<T> {
    const action = dynatrace.startAction(actionName);
    try {
      return await fn();
    } catch (e) {
      action?.reportError(actionName, -1);
      throw e;
    } finally {
      action?.leaveAction();
    }
  },

  endSession() {
    dynatrace.endSession();
  },
};
