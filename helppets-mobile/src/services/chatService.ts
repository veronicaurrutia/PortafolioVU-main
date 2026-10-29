import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { AppUser, Chat, Message, Pet } from '../types/models';
import { db } from './firebase';

const toMillis = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : Date.now());

/** ID determinístico: un solo chat por (mascota, interesado). Evita duplicados sin consultar antes. */
export const chatIdFor = (petId: string, uidA: string, uidB: string) =>
  [petId, ...[uidA, uidB].sort()].join('_');

export const chatService = {
  subscribeMyChats(uid: string, onData: (chats: Chat[]) => void, onError: (e: Error) => void) {
    // Requiere índice compuesto (participants array-contains + updatedAt desc): ver firestore.indexes.json
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) =>
        onData(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              petId: x.petId,
              petName: x.petName,
              participants: x.participants ?? [],
              participantNames: x.participantNames ?? {},
              lastMessage: x.lastMessage ?? '',
              updatedAt: toMillis(x.updatedAt),
            };
          }),
        ),
      onError,
    );
  },

  subscribeMessages(chatId: string, onData: (m: Message[]) => void, onError: (e: Error) => void) {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200),
    );
    return onSnapshot(
      q,
      (snap) =>
        onData(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              text: x.text,
              senderId: x.senderId,
              senderName: x.senderName,
              createdAt: toMillis(x.createdAt),
            };
          }),
        ),
      onError,
    );
  },

  /** Abre (o crea) el chat entre el usuario y quien publicó la alerta. */
  async openForPet(pet: Pet, me: AppUser): Promise<string> {
    const id = chatIdFor(pet.id, me.uid, pet.ownerId);
    const ref = doc(db, 'chats', id);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        petId: pet.id,
        petName: pet.name,
        participants: [me.uid, pet.ownerId],
        participantNames: { [me.uid]: me.displayName, [pet.ownerId]: pet.ownerName },
        lastMessage: '',
        updatedAt: serverTimestamp(),
      });
    }
    return id;
  },

  /** Escritura atómica: mensaje + resumen del chat en el mismo batch. */
  async send(chatId: string, text: string, me: AppUser) {
    const batch = writeBatch(db);
    const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
    batch.set(msgRef, {
      text,
      senderId: me.uid,
      senderName: me.displayName,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'chats', chatId), { lastMessage: text, updatedAt: serverTimestamp() });
    await batch.commit();
  },
};
