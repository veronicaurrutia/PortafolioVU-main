import { makeStore } from '../src/store';
import {
  areaFilterChanged,
  changePetStatus,
  makeSelectPetsByStatus,
  petsReceived,
  selectAlertsByArea,
  selectFilteredPets,
} from '../src/store/slices/petsSlice';
import type { Pet } from '../src/types/models';

jest.mock('../src/services/petsService', () => ({
  petsService: { updateStatus: jest.fn(() => Promise.resolve()) },
}));

const pet = (over: Partial<Pet>): Pet => ({
  id: 'x',
  name: 'Luna',
  petType: 'dog',
  age: '',
  breed: '',
  area: 'Ñuñoa',
  lastSeen: '',
  description: '',
  status: 'lost',
  ownerId: 'u1',
  ownerName: 'Vero',
  createdAt: 0,
  ...over,
});

const sample = [
  pet({ id: 'a', area: 'Ñuñoa', status: 'lost', createdAt: 1 }),
  pet({ id: 'b', area: 'Maipú', status: 'seen', createdAt: 3 }),
  pet({ id: 'c', area: 'Ñuñoa', status: 'found', createdAt: 2 }),
];

describe('petsSlice', () => {
  it('normaliza y ordena por fecha (más reciente primero)', () => {
    const store = makeStore();
    store.dispatch(petsReceived(sample));
    expect(store.getState().pets.ids).toEqual(['b', 'c', 'a']);
  });

  it('filtra por comuna y por estado', () => {
    const store = makeStore();
    store.dispatch(petsReceived(sample));
    store.dispatch(areaFilterChanged('Ñuñoa'));
    const byStatus = makeSelectPetsByStatus();
    expect(selectFilteredPets(store.getState()).map((p) => p.id)).toEqual(['c', 'a']);
    expect(byStatus(store.getState(), 'lost').map((p) => p.id)).toEqual(['a']);
  });

  it('el selector memoizado devuelve la misma referencia si el estado no cambió', () => {
    const store = makeStore();
    store.dispatch(petsReceived(sample));
    const byStatus = makeSelectPetsByStatus();
    const first = byStatus(store.getState(), 'lost');
    expect(byStatus(store.getState(), 'lost')).toBe(first);
  });

  it('agrupa alertas por comuna', () => {
    const store = makeStore();
    store.dispatch(petsReceived(sample));
    expect(selectAlertsByArea(store.getState())[0]).toEqual({ area: 'Ñuñoa', lost: 1, seen: 0, found: 1, total: 2 });
  });

  it('aplica update optimista al cambiar estado', () => {
    const store = makeStore();
    store.dispatch(petsReceived(sample));
    store.dispatch(changePetStatus({ id: 'a', status: 'found' }));
    // Antes de que resuelva la promesa, la UI ya ve el cambio.
    expect(store.getState().pets.entities.a?.status).toBe('found');
  });
});
