import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { AppUser, NewPetAlert, Pet, PetStatus } from '../types/models';
import { db } from './firebase';

const petsCol = () => collection(db, 'pets');

/** Convierte el documento de Firestore a un objeto plano serializable para Redux. */
export function petFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Pet {
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name ?? '',
    petType: d.petType ?? 'other',
    age: d.age ?? '',
    breed: d.breed ?? '',
    area: d.area ?? '',
    lastSeen: d.lastSeen ?? '',
    description: d.description ?? '',
    status: d.status ?? 'lost',
    ownerId: d.ownerId ?? '',
    ownerName: d.ownerName ?? '',
    phone: d.phone || undefined,
    // serverTimestamp() es null en el snapshot local antes de confirmar el servidor.
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now(),
  };
}

export const petsService = {
  /**
   * Escucha en tiempo real las últimas alertas. onSnapshot también entrega los
   * cambios locales pendientes (latency compensation), así la UI se actualiza al instante.
   */
  subscribe(onData: (pets: Pet[]) => void, onError: (e: Error) => void, max = 100) {
    const q = query(petsCol(), orderBy('createdAt', 'desc'), limit(max));
    return onSnapshot(q, (snap) => onData(snap.docs.map(petFromDoc)), onError);
  },

  async create(alert: NewPetAlert, user: AppUser): Promise<string> {
    const ref = await addDoc(petsCol(), {
      ...alert,
      phone: alert.phone ?? null,
      ownerId: user.uid,
      ownerName: user.displayName,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateStatus: (petId: string, status: PetStatus) =>
    updateDoc(doc(db, 'pets', petId), { status }),

  /** Carga los datos de ejemplo de la versión web (solo en desarrollo). */
  async seed(samples: NewPetAlert[], user: AppUser) {
    const batch = writeBatch(db);
    samples.forEach((p, i) => {
      batch.set(doc(petsCol()), {
        ...p,
        phone: p.phone ?? null,
        ownerId: user.uid,
        ownerName: user.displayName,
        createdAt: Timestamp.fromMillis(Date.now() - i * 3_600_000),
      });
    });
    await batch.commit();
  },
};
