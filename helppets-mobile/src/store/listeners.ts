import { createListenerMiddleware, type TypedStartListening } from '@reduxjs/toolkit';
import { analytics } from '../observability/analytics';
import { chatService } from '../services/chatService';
import { petsService } from '../services/petsService';
import type { AppDispatch, RootState } from './index';
import { sessionChanged } from './slices/authSlice';
import { chatsCleared, chatsReceived } from './slices/chatsSlice';
import { listeningStarted, petsCleared, petsReceived, syncFailed } from './slices/petsSlice';

/**
 * Listener middleware = side effects reactivos a acciones (alternativa liviana a redux-saga).
 *
 * Cuando cambia la sesión:
 *  - identificamos al usuario en Clarity y Dynatrace,
 *  - abrimos las suscripciones en tiempo real de Firestore (feed + mis chats),
 *  - al cerrar sesión las cerramos y limpiamos el estado (sin fugas de datos entre usuarios).
 */
export const listenerMiddleware = createListenerMiddleware();
const startAppListening = listenerMiddleware.startListening as TypedStartListening<
  RootState,
  AppDispatch
>;

let unsubscribers: Array<() => void> = [];
const stopFirestore = () => {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
};

startAppListening({
  actionCreator: sessionChanged,
  effect: (action, api) => {
    stopFirestore();
    const user = action.payload;

    if (!user) {
      api.dispatch(petsCleared());
      api.dispatch(chatsCleared());
      return;
    }

    analytics.identify(user.uid);

    api.dispatch(listeningStarted());
    unsubscribers.push(
      petsService.subscribe(
        (pets) => api.dispatch(petsReceived(pets)),
        (err) => {
          api.dispatch(syncFailed('No pudimos cargar las alertas.'));
          analytics.error('pets_subscription', err);
        },
      ),
      chatService.subscribeMyChats(
        user.uid,
        (chats) => api.dispatch(chatsReceived(chats)),
        (err) => analytics.error('chats_subscription', err),
      ),
    );
  },
});
