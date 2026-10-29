# Guía de entrevista: HelpPets Mobile

Stack del cargo: **React Native · Redux · Firebase · Microsoft Clarity · Dynatrace**

---

## 1. Pitch de 60 segundos

> "HelpPets nació como un caso UX/UI que diseñé en Figma y después construí como app web en React con datos de prueba. Para llevarlo a producción lo migré a **React Native con Expo**: el estado global lo manejo con **Redux Toolkit**, el backend es **Firebase** (Auth y Firestore en tiempo real, con reglas de seguridad) y le agregué observabilidad con dos herramientas que se complementan: **Clarity** para entender el comportamiento del usuario (grabaciones, heatmaps, rage taps) y **Dynatrace** para la parte técnica (crashes, errores, tiempos de cada acción). Toda la telemetría pasa por una sola fachada y un middleware de Redux, así la UI queda limpia."

Si te preguntan por qué lo hiciste: para practicar exactamente este stack sobre un producto que ya conocías de punta a punta, del diseño al código.

---

## 2. Recorrido para la demo (5 min)

1. **Login**: la sesión persiste al cerrar la app (`initializeAuth` + AsyncStorage). La navegación cambia sola según `auth.status`, no hay redirects manuales.
2. **Home**: los datos llegan en tiempo real con `onSnapshot`. Abre la app en dos dispositivos y publica una alerta: aparece al instante en el otro.
3. **Publicar alerta**: validación pura (`validateAlert`, con tests). El thunk se mide como user action **"Publicar alerta"** en Dynatrace.
4. **Detalle → Ir al chat**: ID de chat determinístico (sin duplicados) y `writeBatch` atómico (mensaje + último mensaje).
5. **Marcar como encontrada**: update optimista en el reducer; Firestore confirma después.
6. **Cuenta → Lanzar error de prueba**: el ErrorBoundary lo atrapa y lo reporta a Dynatrace con el component stack.
7. Muestra los dashboards: grabación en Clarity filtrada por el evento `alert_created`, y la user action con su request en Dynatrace.

---

## 3. React Native: lo que te pueden preguntar

**¿Cómo funciona RN por dentro?**
El JS corre en el motor **Hermes** y renderiza componentes **nativos** reales (no un WebView). Con la **Nueva Arquitectura** (por defecto desde RN 0.76): **JSI** permite llamar código nativo directo desde JS sin el bridge asíncrono serializado en JSON, **Fabric** es el nuevo renderer y **TurboModules** son módulos nativos con carga perezosa.

**¿Expo o React Native CLI?**
Usé Expo con *development build* y `expo prebuild`: me da la DX de Expo (config plugins, EAS Build, OTA updates) y aun así puedo usar SDKs nativos como Clarity y Dynatrace. Expo Go no sirve aquí porque no incluye esos módulos nativos.

**Performance**
- `FlatList` virtualiza (`initialNumToRender`, `windowSize`); nunca `map` dentro de un ScrollView para listas largas.
- `React.memo` en `PetCard` + `useCallback` en los handlers → las tarjetas no se re-renderizan sin necesidad.
- Selectores memoizados (`createSelector`) → `useSelector` devuelve la misma referencia si nada cambió.
- Animaciones en el hilo de UI con Reanimated (si me preguntan cómo lo haría).
- Medir antes de optimizar: React DevTools Profiler, Flipper/Perf Monitor y **Dynatrace** en producción.

**Diferencias con React web**
No hay DOM ni CSS: se usa `StyleSheet` con Flexbox (por defecto `flexDirection: 'column'`), `Pressable` en vez de botones, `SafeAreaView` y `KeyboardAvoidingView`, navegación con stacks nativos y permisos por plataforma.

**Seguridad en móvil**
Las variables `EXPO_PUBLIC_*` van dentro del bundle, así que **no son secretas**. La API key de Firebase es pública por diseño: la seguridad está en las **reglas de Firestore**. Datos sensibles van en Keychain/Keystore (`expo-secure-store`), no en AsyncStorage.

---

## 4. Redux Toolkit

**¿Por qué Redux y no solo Context?**
Context re-renderiza a todos sus consumidores cuando cambia el valor. Redux con selectores solo re-renderiza a quien cambió su porción del estado. Además trae DevTools, middlewares para side effects y es fácil de testear (reducers puros).

**Lo que usé y por qué**

| Pieza | Dónde | Para qué |
|---|---|---|
| `createSlice` | auth, pets, chats | Reducers + actions sin boilerplate; Immer permite "mutar" de forma segura |
| `createAsyncThunk` | login, createAlert, sendMessage | Estados pending / fulfilled / rejected automáticos |
| `rejectWithValue` | authSlice | Separa errores esperados (clave incorrecta) de bugs reales |
| `createEntityAdapter` | petsSlice | Estado normalizado `{ids, entities}`, lectura O(1), orden por fecha |
| `createSelector` | filtros por estado y comuna | Memoización; factoría por componente para no pisar el caché |
| Listener middleware | listeners.ts | Al cambiar la sesión: identify + abrir/cerrar suscripciones de Firestore |
| Middleware propio | observabilityMiddleware | Thunks rechazados → Dynatrace; acciones clave → eventos |
| Hooks tipados | `useAppSelector`/`useAppDispatch` | Tipado sin repetir genéricos |

**¿Dónde viven los side effects?**
En thunks (efectos disparados por el usuario) y en el listener middleware (efectos que reaccionan a acciones, como el cambio de sesión). Nunca en los reducers, que deben ser puros.

**¿Por qué fechas como número?**
Redux exige estado serializable. Los `Timestamp` de Firestore se convierten a epoch ms en el service.

**¿RTK Query?**
Es ideal para APIs REST/GraphQL (caché, invalidación, deduplicación). Con Firestore en tiempo real, el patrón `onSnapshot → dispatch` es más directo; si mañana se agrega una API, usaría RTK Query para esa parte.

---

## 5. Firebase

**Firestore: modelo de datos**
- `pets/{id}`: alertas con `ownerId`, `status`, `createdAt`.
- `chats/{petId_uidA_uidB}`: `participants[]`, `lastMessage`, `updatedAt`.
- `chats/{id}/messages/{id}`: subcolección para que el chat crezca sin límite (un documento tiene tope de 1 MB).
- Desnormalizo `ownerName` y `petName` para no hacer "joins": en NoSQL se modela según cómo se lee.

**Tiempo real**
`onSnapshot` entrega primero los cambios locales (*latency compensation*) y luego los del servidor. Siempre hay que **desuscribirse** (cleanup del `useEffect` / logout) para evitar fugas y lecturas cobradas de más.

**Seguridad (firestore.rules)**
Solo el dueño edita su alerta y no puede transferirla; solo los participantes leen y escriben en un chat; los mensajes se validan (`senderId == auth.uid`, largo máximo).

**Índices**
`where('participants', 'array-contains') + orderBy('updatedAt')` necesita un índice compuesto (está en `firestore.indexes.json`).

**Costos**
Se cobra por lectura de documento: uso `limit()`, suscripciones solo mientras la pantalla está montada y nada de leer colecciones completas.

**SDK JS vs @react-native-firebase**
Usé el SDK JS modular: funciona igual en Jest y en web, y es tree-shakeable. `@react-native-firebase` usa los SDKs nativos (mejor performance offline, Crashlytics, FCM). En producción grande evaluaría migrar, sobre todo por las push notifications.

**Transacciones vs batch**
`writeBatch` sirve para escrituras atómicas sin leer antes (mensaje + resumen del chat). `runTransaction` se usa cuando la escritura depende de una lectura (por ejemplo, un contador).

---

## 6. Microsoft Clarity

**Qué es:** analítica de comportamiento, gratuita. Graba sesiones, genera heatmaps y detecta **rage taps** (toques repetidos por frustración), **dead taps** (toques que no hacen nada) y salidas abruptas.

**Cómo lo integré**
- `Clarity.initialize(projectId)` al arrancar, lo antes posible.
- `setCustomUserId(uid)`: el uid, **nunca el email** (no se envía PII a terceros).
- `setCurrentScreenName` en el `onStateChange` del NavigationContainer: un solo lugar para todas las pantallas.
- `sendCustomEvent('alert_created')`: permite filtrar grabaciones como "sesiones que publicaron una alerta" o "sesiones con error".
- `setCustomTag('app_env', …)` para separar ambientes.

**Privacidad:** el enmascarado se configura en el dashboard (modo Balanced/Strict). Los inputs de contraseña y teléfono van enmascarados.

**Pregunta típica:** *"¿Para qué Clarity si ya tienen Dynatrace?"* → Dynatrace te dice que el botón "Publicar" tardó 3 segundos o falló; Clarity te muestra que el usuario tocó 5 veces un campo que no respondía. Uno responde **qué falló técnicamente** y el otro **cómo lo vivió el usuario**.

---

## 7. Dynatrace

**Qué es:** plataforma de observabilidad/APM. En móvil hace **RUM** (Real User Monitoring) con el **OneAgent**: crashes, errores JS, *user actions* con duración, requests HTTP, arranque de la app y **trazas end-to-end** hasta el backend (PurePath) si el backend también está instrumentado. Su IA (**Davis**) detecta anomalías y causa raíz.

**Cómo lo integré**
- `dynatrace.config.js` + `npx instrumentDynatrace`: configura Gradle y el Info.plist con el Application ID y la Beacon URL.
- **Plugin de Babel + jsx-runtime**: instrumentación automática en build time de toques, componentes y navegación.
- `autoStart: true`: el agente arranca antes que el JS, así mide el arranque completo.
- Manual, donde el auto-instrumentado no llega:
  - `identifyUser(uid)` al iniciar sesión (listener middleware).
  - `enterAutoAction('Publicar alerta')` envolviendo el thunk (`analytics.measure`).
  - `reportErrorStacktrace` desde el middleware (thunks rechazados) y el ErrorBoundary.
- Errores esperados (`rejectWithValue`) **no** se reportan, para no generar ruido en las alertas.

**Preguntas típicas**
- *¿Auto vs manual?* Lo automático cubre el 80% (toques, red, crashes). Lo manual agrega contexto de negocio: quién es el usuario y qué acciones importan.
- *¿Source maps?* Hay que subirlos en cada build para ver el stack trace con nombres reales y no el bundle minificado.
- *¿Qué mirarías primero?* Tasa de crash-free users, user actions más lentas, errores por versión de la app y del SO, y Apdex.
- *¿Privacidad?* `userOptIn` para pedir consentimiento (GDPR), enmascarado de nombres de acciones y nada de PII en `identifyUser`.

---

## 8. Decisiones de arquitectura (para preguntas de "¿por qué?")

1. **Fachada `analytics`**: la UI no conoce los SDKs. Cambiar de proveedor toca un archivo y en tests se mockea una sola cosa.
2. **Telemetría como efecto del flujo de datos** (middleware) y no `try/catch + report` en cada pantalla.
3. **Services como única puerta a Firebase**: la UI y Redux no importan `firebase/*`. Se puede testear y cambiar de backend.
4. **Navegación condicional por estado de auth**: imposible ver pantallas privadas sin sesión; logout limpia el estado y cierra las suscripciones.
5. **La observabilidad nunca bota la app**: todo envuelto en `safe()` y no hace nada si falta configuración.

---

## 9. Preguntas para hacerles a ellos

- ¿Usan Expo o React Native CLI? ¿Ya migraron a la Nueva Arquitectura?
- ¿Redux Toolkit "clásico" o también RTK Query?
- ¿Qué dashboards de Dynatrace revisa el equipo a diario? ¿Quién responde las alertas de Davis?
- ¿Cómo usan los insights de Clarity: los revisa producto o también desarrollo?
- ¿Cómo es el proceso de release: EAS, Fastlane, CodePush/OTA?

---

## 10. Honestidad estratégica

Si te preguntan por experiencia en producción con alguna herramienta, di la verdad: *"Lo integré en este proyecto siguiendo la documentación oficial y entiendo el porqué de cada pieza. En producción lo he hecho con React y Angular en un WMS (Loginsa) y en una plataforma para laboratorios dentales."* Luego muestra el código: el middleware de observabilidad y los tests son tus mejores argumentos.
