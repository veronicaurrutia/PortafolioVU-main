import { Dynatrace } from '@dynatrace/react-native-plugin';
import * as Clarity from '@microsoft/react-native-clarity';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { makeStore } from '../src/store';
import { login } from '../src/store/slices/authSlice';

jest.mock('../src/services/authService', () => ({
  authService: { login: jest.fn() },
  authErrorMessage: () => 'Correo o contraseña incorrectos.',
}));
jest.mock('../src/config/env', () => ({ env: { clarityProjectId: 'test', appEnv: 'test' } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { authService } = require('../src/services/authService');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { analytics } = require('../src/observability/analytics');

beforeAll(() => analytics.init());
beforeEach(() => jest.clearAllMocks());

describe('observabilityMiddleware', () => {
  it('reporta a Dynatrace un thunk que falla de forma inesperada', async () => {
    const store = makeStore();
    const boom = createAsyncThunk('pets/createAlert', async () => {
      throw new Error('Firestore caído');
    });
    await store.dispatch(boom());
    expect(Dynatrace.reportErrorStacktrace).toHaveBeenCalledWith(
      'pets/createAlert',
      'Firestore caído',
      expect.any(String),
      expect.any(String),
    );
  });

  it('NO reporta errores esperados del usuario (rejectWithValue)', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    const store = makeStore();
    await store.dispatch(login({ email: 'a@b.cl', password: '123456' }));
    expect(store.getState().auth.error).toBe('Correo o contraseña incorrectos.');
    expect(Dynatrace.reportErrorStacktrace).not.toHaveBeenCalled();
  });

  it('traduce un login exitoso a evento de negocio en Clarity', async () => {
    authService.login.mockResolvedValueOnce({ uid: 'u1', email: 'a@b.cl', displayName: 'Vero' });
    const store = makeStore();
    await store.dispatch(login({ email: 'a@b.cl', password: '123456' }));
    expect(Clarity.sendCustomEvent).toHaveBeenCalledWith('login_success');
  });
});

describe('analytics.identify', () => {
  it('identifica con uid (no email) en ambos proveedores', () => {
    analytics.identify('u1');
    expect(Clarity.setCustomUserId).toHaveBeenCalledWith('u1');
    expect(Dynatrace.identifyUser).toHaveBeenCalledWith('u1');
  });
});
