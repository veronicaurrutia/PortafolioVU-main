import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { chatService } from '../../services/chatService';
import type { Chat, Message, Pet } from '../../types/models';
import type { RootState } from '../index';

interface ChatsState {
  list: Chat[];
  messagesByChat: Record<string, Message[]>;
  sending: boolean;
}

const initialState: ChatsState = { list: [], messagesByChat: {}, sending: false };

export const openChatForPet = createAsyncThunk<string, Pet, { state: RootState }>(
  'chats/openForPet',
  async (pet, { getState }) => {
    const me = getState().auth.user;
    if (!me) throw new Error('Usuario no autenticado');
    return chatService.openForPet(pet, me);
  },
);

export const sendMessage = createAsyncThunk<void, { chatId: string; text: string }, { state: RootState }>(
  'chats/send',
  async ({ chatId, text }, { getState }) => {
    const me = getState().auth.user;
    if (!me) throw new Error('Usuario no autenticado');
    await chatService.send(chatId, text.trim(), me);
  },
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    chatsReceived(state, action: PayloadAction<Chat[]>) {
      state.list = action.payload;
    },
    messagesReceived(state, action: PayloadAction<{ chatId: string; messages: Message[] }>) {
      state.messagesByChat[action.payload.chatId] = action.payload.messages;
    },
    chatsCleared: () => initialState,
  },
  extraReducers: (b) => {
    b.addCase(sendMessage.pending, (s) => {
      s.sending = true;
    })
      .addCase(sendMessage.fulfilled, (s) => {
        s.sending = false;
      })
      .addCase(sendMessage.rejected, (s) => {
        s.sending = false;
      });
  },
});

export const { chatsReceived, messagesReceived, chatsCleared } = chatsSlice.actions;
export default chatsSlice.reducer;

const EMPTY: Message[] = [];
export const selectChats = (s: RootState) => s.chats.list;
export const selectMessages = (s: RootState, chatId: string) => s.chats.messagesByChat[chatId] ?? EMPTY;
export const selectChatById = createSelector(
  [selectChats, (_: RootState, id: string) => id],
  (list, id) => list.find((c) => c.id === id),
);
