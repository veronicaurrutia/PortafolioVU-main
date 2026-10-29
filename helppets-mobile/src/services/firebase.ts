import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { env } from '../config/env';

/**
 * Inicialización única de Firebase (patrón singleton: evita "app already exists" con Fast Refresh).
 *
 * Usamos el SDK JS modular (no @react-native-firebase) porque:
 *  - funciona igual en iOS, Android y web, y en Jest sin mocks nativos,
 *  - es tree-shakeable (solo empaquetamos auth + firestore).
 * Trade-off: no trae Crashlytics/Analytics nativos — para eso ya usamos Dynatrace y Clarity.
 */
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(env.firebase);

/**
 * En React Native la sesión se debe persistir explícitamente con AsyncStorage;
 * si no, el usuario tendría que loguearse cada vez que abre la app.
 * `getReactNativePersistence` solo existe en el bundle RN de firebase/auth (Metro lo resuelve),
 * por eso lo leemos de forma tipada y caemos a memoria en otros entornos (Jest / web).
 */
type RNPersistenceFactory = (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
const getReactNativePersistence = (FirebaseAuth as unknown as {
  getReactNativePersistence?: RNPersistenceFactory;
}).getReactNativePersistence;

function createAuth(): FirebaseAuth.Auth {
  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence
        ? getReactNativePersistence(AsyncStorage)
        : FirebaseAuth.inMemoryPersistence,
    });
  } catch {
    // initializeAuth lanza si ya fue llamado (Fast Refresh): reutilizamos la instancia.
    return FirebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();
export const db: Firestore = getFirestore(app);
