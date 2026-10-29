import { isRejected, type Middleware } from '@reduxjs/toolkit';
import { analytics, type AnalyticsEvent } from './analytics';

/**
 * Middleware de Redux que conecta el store con la observabilidad.
 *
 * - Cualquier thunk rechazado (createAsyncThunk → `/rejected`) se reporta a Dynatrace
 *   automáticamente: no hay que acordarse de poner try/catch + report en cada pantalla.
 * - Algunas acciones exitosas se traducen a eventos de negocio (Clarity + Dynatrace).
 *
 * Así la telemetría es un efecto secundario del flujo de datos, no código regado en la UI.
 */
const EVENT_BY_ACTION: Record<string, AnalyticsEvent> = {
  'auth/login/fulfilled': 'login_success',
  'auth/register/fulfilled': 'register_success',
  'auth/logout/fulfilled': 'logout',
  'pets/createAlert/fulfilled': 'alert_created',
  'chats/send/fulfilled': 'message_sent',
  'chats/openForPet/fulfilled': 'chat_opened',
};

export const observabilityMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (isRejected(action)) {
    // Los errores de validación del usuario (rejectWithValue) no son bugs: no ensucian Dynatrace.
    if (!action.meta.rejectedWithValue) {
      analytics.error(action.type.replace('/rejected', ''), action.error);
    }
    return result;
  }

  const type = (action as { type: string }).type;
  const event = EVENT_BY_ACTION[type];
  if (event) analytics.track(event);

  return result;
};
