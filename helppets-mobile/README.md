# 🐾 HelpPets Mobile

Versión móvil de [HelpPets](https://github.com/veronicaurrutia/ProyectoHelp), la app de la comunidad para reencontrar mascotas perdidas.
La versión web (Vite + React + datos de prueba) se migró a **React Native** con datos reales en tiempo real y observabilidad de nivel producción.

| Capa | Tecnología | Para qué |
|---|---|---|
| UI móvil | **React Native 0.88 + Expo SDK 58** (dev client), TypeScript estricto | iOS y Android con un solo código |
| Estado | **Redux Toolkit** (slices, `createAsyncThunk`, entity adapter, listener middleware, selectores memoizados) | Estado global predecible y testeable |
| Backend | **Firebase** Auth + Cloud Firestore (tiempo real, reglas de seguridad) | Login, alertas y chat sin servidor propio |
| UX analytics | **Microsoft Clarity** | Grabaciones de sesión, heatmaps, rage taps, eventos de negocio |
| APM / RUM | **Dynatrace** OneAgent | Crashes, errores JS, user actions, tiempos de red, arranque |

## Funcionalidades

- Registro / login con email (sesión persistente con AsyncStorage) y recuperación de contraseña.
- Feed en tiempo real: perdidas prioritarias (carrusel), recientes, encontradas y avistamientos.
- Listado con filtro por comuna, detalle de mascota, ranking de alertas por zona.
- Publicar alerta (perdida / vista / encontrada) con validación.
- El dueño puede marcar su mascota como encontrada (update optimista).
- Chat 1 a 1 en tiempo real entre quien publicó y quien tiene información.

## Arquitectura

```
App.tsx                      Provider + ErrorBoundary + onAuthStateChanged → Redux
src/
├── config/env.ts            Variables EXPO_PUBLIC_*
├── types/models.ts          Modelo de dominio (Pet, Chat, Message…)
├── services/                ÚNICA capa que habla con Firebase
│   ├── firebase.ts          Singleton app/auth/db + persistencia RN
│   ├── authService.ts       Login, registro, errores traducidos
│   ├── petsService.ts       onSnapshot, create, updateStatus, seed
│   └── chatService.ts       Chats, mensajes, writeBatch atómico
├── store/
│   ├── slices/              auth · pets (entity adapter) · chats
│   ├── listeners.ts         Al cambiar sesión: identify + abrir/cerrar suscripciones
│   └── index.ts             configureStore + middlewares
├── observability/
│   ├── analytics.ts         Fachada única (la app no importa los SDKs directo)
│   ├── clarity.ts           Microsoft Clarity
│   ├── dynatrace.ts         Dynatrace (acciones, errores, identify)
│   └── observabilityMiddleware.ts   Thunks rechazados → Dynatrace, acciones → eventos
├── navigation/              Stack auth vs stack app (condicional por estado), tabs
├── screens/ · components/   UI
dynatrace.config.js          Config del OneAgent (auto-instrumentación)
firestore.rules              Seguridad: dueño de alerta, participantes del chat
```

**Flujo de datos:** Pantalla → `dispatch(thunk)` → service → Firestore → `onSnapshot` → `dispatch(petsReceived)` → selector memoizado → re-render.
La UI no llama a Firebase ni a los SDKs de observabilidad directamente.

## Cómo correrlo

> Clarity y Dynatrace usan código nativo, así que **no funcionan en Expo Go**: se usa un *development build*.

```bash
npm install
cp .env.example .env          # completar Firebase, Clarity y Dynatrace

# 1. Firebase: crear proyecto, habilitar Authentication (Email/Password) y Firestore
npx firebase-tools deploy --only firestore   # sube reglas e índices

# 2. Generar proyectos nativos + instrumentar Dynatrace
npm run prebuild

# 3. Compilar e instalar en emulador/dispositivo
npm run android   # o npm run ios (macOS + Xcode)

# Luego, para desarrollo diario:
npm start
```

En la app: **Cuenta → Cargar alertas de ejemplo** pobla Firestore con los mismos datos de la versión web.
**Lanzar error de prueba** genera un error que se ve en Dynatrace y en el ErrorBoundary.

## Calidad

```bash
npm run typecheck   # TypeScript estricto
npm test            # Jest: reducers, selectores, middleware de observabilidad, validaciones
```

## Próximos pasos

- Mapa real con `react-native-maps` + geohash para buscar alertas por radio.
- Fotos con `expo-image-picker` + Firebase Storage (redimensionadas en el cliente).
- Push notifications (FCM) cuando hay una alerta cerca o un mensaje nuevo.
- Persistencia offline de Firestore y RTK Query si se agrega una API REST.
- CI con EAS Build + `npx instrumentDynatrace` y subida de source maps a Dynatrace.
