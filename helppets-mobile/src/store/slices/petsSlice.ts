import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { petsService } from '../../services/petsService';
import { analytics } from '../../observability/analytics';
import type { NewPetAlert, Pet, PetStatus } from '../../types/models';
import type { RootState } from '../index';

/**
 * Entity adapter: guarda las mascotas normalizadas ({ ids, entities }) → lecturas O(1) por id
 * y updates sin recorrer arrays. Ordenadas por fecha (más recientes primero).
 */
const petsAdapter = createEntityAdapter<Pet>({
  sortComparer: (a, b) => b.createdAt - a.createdAt,
});

type SyncStatus = 'idle' | 'listening' | 'error';

const initialState = petsAdapter.getInitialState({
  sync: 'idle' as SyncStatus,
  error: null as string | null,
  creating: false,
  areaFilter: null as string | null,
});

export const createAlert = createAsyncThunk<string, NewPetAlert, { state: RootState }>(
  'pets/createAlert',
  async (alert, { getState }) => {
    const user = getState().auth.user;
    if (!user) throw new Error('Usuario no autenticado');
    // La user action "Publicar alerta" en Dynatrace incluye el request a Firestore.
    return analytics.measure('Publicar alerta', () => petsService.create(alert, user));
  },
);

export const changePetStatus = createAsyncThunk(
  'pets/changeStatus',
  async ({ id, status }: { id: string; status: PetStatus }) => {
    await petsService.updateStatus(id, status);
    return { id, status };
  },
);

const petsSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    listeningStarted(state) {
      state.sync = 'listening';
      state.error = null;
    },
    /** Snapshot completo de Firestore: setAll reemplaza el estado (Firestore es la fuente de verdad). */
    petsReceived(state, action: PayloadAction<Pet[]>) {
      petsAdapter.setAll(state, action.payload);
    },
    syncFailed(state, action: PayloadAction<string>) {
      state.sync = 'error';
      state.error = action.payload;
    },
    areaFilterChanged(state, action: PayloadAction<string | null>) {
      state.areaFilter = action.payload;
    },
    petsCleared: () => initialState,
  },
  extraReducers: (b) => {
    b.addCase(createAlert.pending, (s) => {
      s.creating = true;
    })
      .addCase(createAlert.fulfilled, (s) => {
        s.creating = false;
      })
      .addCase(createAlert.rejected, (s) => {
        s.creating = false;
      })
      // Update optimista: el snapshot de Firestore lo confirmará igual.
      .addCase(changePetStatus.pending, (s, a) => {
        petsAdapter.updateOne(s, { id: a.meta.arg.id, changes: { status: a.meta.arg.status } });
      });
  },
});

export const { listeningStarted, petsReceived, syncFailed, areaFilterChanged, petsCleared } =
  petsSlice.actions;
export default petsSlice.reducer;

// ---------- Selectores (memoizados con createSelector / reselect) ----------
export const {
  selectAll: selectAllPets,
  selectById: selectPetById,
} = petsAdapter.getSelectors<RootState>((s) => s.pets);

const selectAreaFilter = (s: RootState) => s.pets.areaFilter;

export const selectFilteredPets = createSelector(
  [selectAllPets, selectAreaFilter],
  (pets, area) => (area ? pets.filter((p) => p.area === area) : pets),
);

/** Factoría para no recalcular la lista en cada render si no cambiaron las mascotas. */
export const makeSelectPetsByStatus = () =>
  createSelector(
    [selectFilteredPets, (_: RootState, status: PetStatus) => status],
    (pets, status) => pets.filter((p) => p.status === status),
  );

/** Conteo por comuna, para la pantalla de zonas. */
export const selectAlertsByArea = createSelector([selectAllPets], (pets) => {
  const map = new Map<string, Record<PetStatus, number>>();
  for (const p of pets) {
    const entry = map.get(p.area) ?? { lost: 0, seen: 0, found: 0 };
    entry[p.status] += 1;
    map.set(p.area, entry);
  }
  return [...map.entries()]
    .map(([area, counts]) => ({ area, ...counts, total: counts.lost + counts.seen + counts.found }))
    .sort((a, b) => b.total - a.total);
});
