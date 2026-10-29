import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PetCard } from '../components/PetCard';
import { EmptyState } from '../components/ui';
import type { AppStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { areaFilterChanged, makeSelectPetsByStatus, selectAllPets } from '../store/slices/petsSlice';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PetList'>;

export function PetListScreen({ route, navigation }: Props) {
  const { status } = route.params;
  const dispatch = useAppDispatch();
  const select = useMemo(makeSelectPetsByStatus, []);
  const pets = useAppSelector((s) => select(s, status));
  const all = useAppSelector(selectAllPets);
  const area = useAppSelector((s) => s.pets.areaFilter);
  const areas = useMemo(() => [...new Set(all.map((p) => p.area))].sort(), [all]);

  const openPet = useCallback((petId: string) => navigation.navigate('PetDetail', { petId }), [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}>
        {[null, ...areas].map((a) => (
          <Pressable
            key={a ?? 'all'}
            onPress={() => dispatch(areaFilterChanged(a))}
            style={[styles.chip, area === a && styles.chipActive]}
            accessibilityState={{ selected: area === a }}
          >
            <Text style={[styles.chipText, area === a && { color: '#fff' }]}>{a ?? 'Todas'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {/* FlatList virtualiza: solo renderiza lo visible, clave para listas largas en móvil. */}
      <FlatList
        data={pets}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PetCard pet={item} onPress={openPet} variant="row" />}
        contentContainerStyle={{ padding: spacing.xl }}
        ListEmptyComponent={<EmptyState title="No hay alertas con este filtro" />}
        initialNumToRender={10}
        windowSize={7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexGrow: 0, paddingVertical: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '500' },
});
