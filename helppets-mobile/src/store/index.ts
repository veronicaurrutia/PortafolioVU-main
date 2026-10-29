import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { observabilityMiddleware } from '../observability/observabilityMiddleware';
import { listenerMiddleware } from './listeners';
import authReducer from './slices/authSlice';
import chatsReducer from './slices/chatsSlice';
import petsReducer from './slices/petsSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  pets: petsReducer,
  chats: chatsReducer,
});

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // El listener va primero (prepend) como recomienda RTK; la observabilidad al final ve el resultado.
    middleware: (getDefault) =>
      getDefault().prepend(listenerMiddleware.middleware).concat(observabilityMiddleware),
  });
}

export const store = makeStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
