import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { env } from '../config/env';
import { samplePets } from '../data/samplePets';
import { petsService } from '../services/petsService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { selectAllPets } from '../store/slices/petsSlice';
import { colors, radius, spacing } from '../theme';

export function AccountScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const myAlerts = useAppSelector(selectAllPets).filter((p) => p.ownerId === user?.uid);
  const [seeding, setSeeding] = useState(false);

  const onSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await petsService.seed(samplePets, user);
      Alert.alert('Listo', 'Se cargaron las alertas de ejemplo.');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSeeding(false);
    }
  };

  /** Botón de prueba para la demo: genera un error controlado y se ve en Dynatrace. */
  const onTestError = () => {
    throw new Error('Error de prueba HelpPets (Dynatrace)');
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 30 }}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Mis alertas" value={myAlerts.length} />
        <Stat label="Activas" value={myAlerts.filter((p) => p.status !== 'found').length} />
        <Stat label="Resueltas" value={myAlerts.filter((p) => p.status === 'found').length} />
      </View>

      {__DEV__ && (
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>Herramientas de desarrollo · {env.appEnv}</Text>
          <Button title="Cargar alertas de ejemplo" variant="outline" loading={seeding} onPress={onSeed} />
          <Button title="Lanzar error de prueba" variant="outline" onPress={onTestError} />
        </View>
      )}

      <Button title="Cerrar sesión" onPress={() => dispatch(logout())} />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  email: { color: '#c7c9d9', marginTop: 2 },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted },
  devBox: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
  devTitle: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
