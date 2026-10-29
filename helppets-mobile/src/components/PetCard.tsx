import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Pet } from '../types/models';
import { StatusBadge } from './ui';

const ICON: Record<Pet['petType'], string> = { dog: '🐶', cat: '🐱', other: '🐾' };

type Props = { pet: Pet; onPress: (id: string) => void; variant?: 'grid' | 'carousel' | 'row' };

/** memo: en listas largas evita re-render de tarjetas cuyo `pet` no cambió (el adapter mantiene la referencia). */
export const PetCard = memo(function PetCard({ pet, onPress, variant = 'grid' }: Props) {
  return (
    <Pressable
      onPress={() => onPress(pet.id)}
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${pet.area}`}
      style={({ pressed }) => [styles.card, styles[variant], pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.photo, variant === 'row' && styles.photoRow]}>
        <Text style={{ fontSize: variant === 'row' ? 26 : 38 }}>{ICON[pet.petType]}</Text>
        {variant === 'carousel' && <Text style={styles.chip}>SE BUSCA</Text>}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {pet.name}
        </Text>
        <Text style={styles.sub} numberOfLines={variant === 'row' ? 2 : 1}>
          {pet.area} · {pet.lastSeen}
        </Text>
        {variant !== 'carousel' && <StatusBadge status={pet.status} />}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  grid: { flex: 1 },
  carousel: { width: 200, marginRight: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  photo: {
    height: 110,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRow: { width: 76, height: 76, margin: spacing.sm, borderRadius: radius.sm },
  chip: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.navy,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  info: { padding: spacing.md, gap: 4, flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
});
