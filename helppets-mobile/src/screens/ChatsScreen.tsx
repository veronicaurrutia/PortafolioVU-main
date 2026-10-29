import { useNavigation } from '@react-navigation/native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/ui';
import { useAppSelector } from '../store/hooks';
import { selectChats } from '../store/slices/chatsSlice';
import { colors, radius, spacing } from '../theme';

const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

export function ChatsScreen() {
  const chats = useAppSelector(selectChats);
  const me = useAppSelector((s) => s.auth.user);
  const navigation = useNavigation();

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl }}
      data={chats}
      keyExtractor={(c) => c.id}
      ListEmptyComponent={
        <EmptyState icon="💬" title="Aún no tienes conversaciones">
          <Text style={{ color: colors.muted, textAlign: 'center' }}>Abre una alerta y toca “Ir al chat”.</Text>
        </EmptyState>
      }
      renderItem={({ item }) => {
        const other = item.participants.find((p) => p !== me?.uid) ?? '';
        const otherName = item.participantNames[other] ?? 'Usuario';
        return (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, title: item.petName })}
            accessibilityRole="button"
          >
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>🐾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pet}>{item.petName}</Text>
              <Text style={styles.user}>Con {otherName}</Text>
              <Text style={styles.last} numberOfLines={1}>
                {item.lastMessage || 'Conversación iniciada'}
              </Text>
            </View>
            <Text style={styles.time}>{hhmm(item.updatedAt)}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  pet: { fontWeight: '700', fontSize: 15, color: colors.text },
  user: { fontSize: 12, color: colors.primary },
  last: { fontSize: 13, color: colors.muted, marginTop: 2 },
  time: { fontSize: 11, color: colors.muted, alignSelf: 'flex-start' },
});
