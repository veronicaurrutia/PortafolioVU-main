import { useNavigation } from '@react-navigation/native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { areaFilterChanged, selectAlertsByArea } from '../store/slices/petsSlice';
import { colors, radius, spacing } from '../theme';

/**
 * "Mapa de alertas" de la versión web, resuelto como ranking por comuna.
 * Siguiente paso natural: react-native-maps con geopoints en Firestore + geohash para consultas por radio.
 */
export function ZonesScreen() {
  const zones = useAppSelector(selectAlertsByArea);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const openZone = (area: string) => {
    dispatch(areaFilterChanged(area));
    navigation.navigate('PetList', { status: 'lost', title: `Perdidas en ${area}` });
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl }}
      data={zones}
      keyExtractor={(z) => z.area}
      ListEmptyComponent={<EmptyState icon="📍" title="Sin alertas por ahora" />}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => openZone(item.area)} accessibilityRole="button">
          <View style={{ flex: 1 }}>
            <Text style={styles.area}>📍 {item.area}</Text>
            <Text style={styles.meta}>
              {item.lost} perdidas · {item.seen} vistas · {item.found} encontradas
            </Text>
          </View>
          <View style={styles.count}>
            <Text style={styles.countText}>{item.total}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  area: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  count: { backgroundColor: colors.primary, borderRadius: radius.pill, minWidth: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontWeight: '700' },
});
