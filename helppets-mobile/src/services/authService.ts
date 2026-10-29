import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { AppUser } from '../types/models';
import { auth, db } from './firebase';

export const toAppUser = (u: User): AppUser => ({
  uid: u.uid,
  email: u.email ?? '',
  displayName: u.displayName ?? u.email?.split('@')[0] ?? 'Usuario',
});

export const authService = {
  async login(email: string, password: string): Promise<AppUser> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return toAppUser(cred.user);
  },

  async register(fullName: string, email: string, password: string): Promise<AppUser> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: fullName });
    // Perfil público mínimo (sin datos sensibles) para mostrar nombres en chats.
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: fullName,
      createdAt: serverTimestamp(),
    });
    return { ...toAppUser(cred.user), displayName: fullName };
  },

  resetPassword: (email: string) => sendPasswordResetEmail(auth, email.trim()),

  logout: () => signOut(auth),

  /** Devuelve la función para desuscribirse. */
  onSessionChange(cb: (user: AppUser | null) => void) {
    return onAuthStateChanged(auth, (u) => cb(u ? toAppUser(u) : null));
  },
};

/** Traduce los códigos de error de Firebase a mensajes para el usuario. */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu internet.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento.';
    default:
      return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
