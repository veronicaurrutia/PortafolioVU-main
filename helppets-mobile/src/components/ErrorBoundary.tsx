import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { analytics } from '../observability/analytics';
import { colors, spacing } from '../theme';
import { Button } from './ui';

/**
 * Atrapa errores de render (los que dejarían la pantalla en blanco), los reporta a Dynatrace
 * con el component stack y muestra una pantalla de recuperación en vez de cerrar la app.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    analytics.error('render_crash', Object.assign(error, { stack: `${error.stack}\n${info.componentStack ?? ''}` }));
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.box}>
        <Text style={{ fontSize: 40 }}>🐾</Text>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.text}>Ya avisamos al equipo. Puedes intentar de nuevo.</Text>
        <Button title="Reintentar" onPress={() => this.setState({ hasError: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  text: { color: colors.muted, textAlign: 'center' },
});
