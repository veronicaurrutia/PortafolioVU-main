// Modelo de dominio. Mismo modelo que la versión web (mockData.ts), adaptado a Firestore.

export type PetStatus = 'lost' | 'seen' | 'found';
export type PetType = 'dog' | 'cat' | 'other';

/** Alerta de mascota (colección `pets`). Fechas en epoch ms para que Redux sea serializable. */
export interface Pet {
  id: string;
  name: string;
  petType: PetType;
  age: string;
  breed: string;
  area: string; // comuna
  lastSeen: string; // dirección / referencia
  description: string;
  status: PetStatus;
  ownerId: string;
  ownerName: string;
  phone?: string;
  createdAt: number;
}

export type NewPetAlert = Omit<Pet, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>;

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
}

/** Conversación asociada a una mascota (colección `chats`). */
export interface Chat {
  id: string;
  petId: string;
  petName: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  updatedAt: number;
}

/** Mensaje (subcolección `chats/{id}/messages`). */
export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: number;
}

export const STATUS_LABEL: Record<PetStatus, string> = {
  lost: 'Perdida',
  seen: 'Vista',
  found: 'Encontrada',
};
