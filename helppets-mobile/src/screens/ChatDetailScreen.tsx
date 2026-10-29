import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import type { AppStackParamList } from '../navigation/types';
import { analytics } from '../observability/analytics';
import { chatService } from '../services/chatService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { messagesReceived, selectMessages, sendMessage } from '../store/slices/chatsSlice';
import { colors, radius, spacing } from '../theme';
import type { Message } from '../types/models';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatDetail'>;

export function ChatDetailScreen({ route }: Props) {
  const { chatId } = route.params;
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const messages = useAppSelector((s) => selectMessages(s, chatId));
  const sending = useAppSelector((s) => s.chats.sending);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  // Suscripción en tiempo real SOLO mientras la pantalla está montada (el cleanup cierra el socket).
  useEffect(() => {
    const unsub = chatService.subscribeMessages(
      chatId,
      (msgs) => dispatch(messagesReceived({ chatId, messages: msgs })),
      (err) => analytics.error('messages_subscription', err),
    );
    return unsub;
  }, [chatId, dispatch]);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    dispatch(sendMessage({ chatId, text }));
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.empty}>Escribe el primer mensaje 👋</Text>}
          renderItem={({ item }) => {
            const mine = item.senderId === me?.uid;
            return (
              <View style={[styles.bubble, mine ? styles.out : styles.in]}>
                {!mine && <Text style={styles.sender}>{item.senderName}</Text>}
                <Text style={[styles.text, mine && { color: '#fff' }]}>{item.text}</Text>
                <Text style={[styles.time, mine && { color: '#e0d9ff' }]}>
                  {new Date(item.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje"
            placeholderTextColor={colors.muted}
            onSubmitEditing={onSend}
            returnKeyType="send"
            accessibilityLabel="Mensaje"
          />
          <Button title="Enviar" onPress={onSend} disabled={!draft.trim() || sending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.md },
  in: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  out: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  sender: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  text: { fontSize: 15, color: colors.text },
  time: { fontSize: 10, color: colors.muted, marginTop: 4, alignSelf: 'flex-end' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  inputBar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.lg, fontSize: 15, color: colors.text },
});
