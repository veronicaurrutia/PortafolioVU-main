import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, StatusBadge } from '../components/ui';
import type { AppStackParamList } from '../navigation/types';
import { analytics } from '../observability/analytics';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openChatForPet } from '../store/slices/chatsSlice';
import { changePetStatus, selectPetById } from '../store/slices/petsSlice';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PetDetail'>;

const TYPE_LABEL = { dog: 'Perro', cat: 'Gato', other: 'Otro' } as const;

function timeAgo(ms: number) {
  const h = Math.floor((Date.now() - ms) / 3_600_000);
  if (h < 1) return 'Hace minutos';
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} días`;
}

export function PetDetailScreen({ route, navigation }: Props) {
  const dispatch = useAppDispatch();
  const pet = useAppSelector((s) => selectPetById(s, route.params.petId));
  const me = useAppSelector((s) => s.auth.user);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (pet) analytics.track('pet_viewed', { status: pet.status, area: pet.area });
    // Solo al entrar a la pantalla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.id]);

  if (!pet) return <EmptyState title="Esta alerta ya no existe" />;
  const isOwner = pet.ownerId === me?.uid;

  const onChat = async () => {
    setOpening(true);
    try {
      const chatId = await dispatch(openChatForPet(pet)).unwrap();
      navigation.navigate('ChatDetail', { chatId, title: pet.name });
    } catch {
      Alert.alert('Error', 'No pudimos abrir el chat.');
    } finally {
      setOpening(false);
    }
  };

  const onResolve = () =>
    Alert.alert('Marcar como encontrada', `¿${pet.name} ya volvió a casa?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, ¡encontrada!', onPress: () => dispatch(changePetStatus({ id: pet.id, status: 'found' })) },
    ]);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.photo}>
        <Text style={{ fontSize: 80 }}>{pet.petType === 'cat' ? '🐱' : pet.petType === 'dog' ? '🐶' : '🐾'}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.time}>{timeAgo(pet.createdAt)}</Text>
        </View>
        <View style={styles.chips}>
          <StatusBadge status={pet.status} />
          <Text style={styles.chip}>{TYPE_LABEL[pet.petType]}</Text>
          {pet.breed ? <Text style={styles.chip}>{pet.breed}</Text> : null}
          {pet.age ? <Text style={styles.chip}>{pet.age}</Text> : null}
        </View>

        <Text style={styles.label}>{pet.status === 'lost' ? 'Me perdí en:' : 'Visto en:'}</Text>
        <Text style={styles.value}>
          {pet.lastSeen} · {pet.area}
        </Text>

        <Text style={styles.label}>Descripción</Text>
        <Text style={styles.description}>{pet.description}</Text>

        <Text style={styles.publisher}>
          Publicado por <Text style={{ fontWeight: '700' }}>{pet.ownerName}</Text>
        </Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {isOwner ? (
            pet.status !== 'found' && <Button title="Marcar como encontrada" onPress={onResolve} />
          ) : (
            <Button title="Ir al chat" loading={opening} onPress={onChat} />
          )}
          {pet.phone && !isOwner ? (
            <Button title="Llamar" variant="outline" onPress={() => Linking.openURL(`tel:${pet.phone}`)} />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photo: { height: 220, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontSize: 26, fontWeight: '800', color: colors.text },
  time: { color: colors.muted, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md, alignItems: 'center' },
  chip: { backgroundColor: colors.primarySoft, color: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, fontSize: 12, overflow: 'hidden' },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: spacing.lg },
  value: { color: colors.muted, marginTop: 4 },
  description: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: 6, color: colors.text, borderWidth: 1, borderColor: colors.border, lineHeight: 20 },
  publisher: { marginTop: spacing.lg, color: colors.muted },
});
