import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { analytics } from './src/observability/analytics';
import { authService } from './src/services/authService';
import { store } from './src/store';
import { sessionChanged } from './src/store/slices/authSlice';

// Clarity se inicializa lo antes posible para grabar la sesión completa.
analytics.init();

export default function App() {
  useEffect(() => {
    // onAuthStateChanged es la única fuente de verdad de la sesión (también restaura al abrir la app).
    return authService.onSessionChange((user) => store.dispatch(sessionChanged(user)));
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <RootNavigator />
        </ErrorBoundary>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </Provider>
  );
}
