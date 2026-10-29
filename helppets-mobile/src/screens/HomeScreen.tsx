import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PetCard } from '../components/PetCard';
import { EmptyState, SectionHeader } from '../components/ui';
import { useAppSelector } from '../store/hooks';
import { makeSelectPetsByStatus } from '../store/slices/petsSlice';
import { colors, radius, spacing } from '../theme';
import type { Pet, PetStatus } from '../types/models';

const TITLES: Record<PetStatus, string> = {
  lost: 'Mascotas perdidas',
  found: 'Mascotas encontradas',
  seen: 'Comunidad: avistamientos',
};

function usePetsByStatus(status: PetStatus) {
  // Una instancia del selector por hook → la memoización no se pisa entre secciones.
  const select = useMemo(makeSelectPetsByStatus, []);
  return useAppSelector((s) => select(s, status));
}

export function HomeScreen() {
  const navigation = useNavigation();
  const sync = useAppSelector((s) => s.pets.sync);
  const user = useAppSelector((s) => s.auth.user);
  const lost = usePetsByStatus('lost');
  const found = usePetsByStatus('found');
  const seen = usePetsByStatus('seen');

  // Prioritarias = perdidas hace más tiempo (la lista viene de más reciente a más antigua).
  const priority = useMemo(() => [...lost].reverse().slice(0, 6), [lost]);

  const openPet = useCallback((petId: string) => navigation.navigate('PetDetail', { petId }), [navigation]);
  const openList = (status: PetStatus) => navigation.navigate('PetList', { status, title: TITLES[status] });

  if (sync === 'listening' && !lost.length && !found.length && !seen.length) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
      <View style={styles.hello}>
        <Text style={styles.helloLabel}>Hola, {user?.displayName}</Text>
        <Text style={styles.helloText}>Cada aviso ayuda a que una mascota vuelva a casa.</Text>
      </View>

      {sync === 'error' && <Text style={styles.error}>No pudimos sincronizar. Revisa tu conexión.</Text>}

      {!lost.length && !found.length && !seen.length && (
        <EmptyState title="Aún no hay alertas publicadas">
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Publica la primera desde el botón ＋ (o carga datos de ejemplo en Cuenta).
          </Text>
        </EmptyState>
      )}

      {priority.length > 0 && (
        <>
          <SectionHeader title="Perdidas prioritarias" action="Ver más" onAction={() => openList('lost')} />
          <FlatList
            horizontal
            data={priority}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => <PetCard pet={item} onPress={openPet} variant="carousel" />}
            showsHorizontalScrollIndicator={false}
          />
        </>
      )}

      <Section title="Perdidas recientes" pets={lost} onSeeAll={() => openList('lost')} onPress={openPet} />
      <Section title="Mascotas encontradas" pets={found} onSeeAll={() => openList('found')} onPress={openPet} />
      <Section title="Comunidad" pets={seen} onSeeAll={() => openList('seen')} onPress={openPet} />
    </ScrollView>
  );
}

function Section({ title, pets, onSeeAll, onPress }: { title: string; pets: Pet[]; onSeeAll: () => void; onPress: (id: string) => void }) {
  if (!pets.length) return null;
  const items = pets.slice(0, 4);
  const rows = [items.slice(0, 2), items.slice(2, 4)].filter((r) => r.length);
  return (
    <>
      <SectionHeader title={title} action="Ver más" onAction={onSeeAll} />
      {rows.map((row, i) => (
        <View key={i} style={styles.gridRow}>
          {row.map((p) => (
            <PetCard key={p.id} pet={p} onPress={onPress} />
          ))}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  hello: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.lg },
  helloLabel: { color: '#fff', fontWeight: '700', fontSize: 17 },
  helloText: { color: '#c7c9d9', marginTop: 4 },
  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  error: { color: colors.danger, marginTop: spacing.md },
});
