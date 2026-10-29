import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authErrorMessage, authService } from '../../services/authService';
import type { AppUser } from '../../types/models';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

export interface AuthState {
  user: AppUser | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { user: null, status: 'checking', loading: false, error: null };

const firebaseCode = (e: unknown) => (e as { code?: string })?.code;

/**
 * Los errores esperables (credenciales malas, correo usado) van por rejectWithValue
 * con un mensaje para la UI. Los inesperados se relanzan y el middleware los reporta a Dynatrace.
 */
export const login = createAsyncThunk<AppUser, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password);
    } catch (e) {
      const code = firebaseCode(e);
      if (code?.startsWith('auth/')) return rejectWithValue(authErrorMessage(code));
      throw e;
    }
  },
);

export const register = createAsyncThunk<
  AppUser,
  { fullName: string; email: string; password: string },
  { rejectValue: string }
>('auth/register', async ({ fullName, email, password }, { rejectWithValue }) => {
  try {
    return await authService.register(fullName, email, password);
  } catch (e) {
    const code = firebaseCode(e);
    if (code?.startsWith('auth/')) return rejectWithValue(authErrorMessage(code));
    throw e;
  }
});

export const logout = createAsyncThunk('auth/logout', () => authService.logout());

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Lo despacha el listener de onAuthStateChanged (fuente de verdad de la sesión). */
    sessionChanged(state, action: PayloadAction<AppUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'anonymous';
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.status = 'authenticated';
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? 'No pudimos iniciar sesión.';
      })
      .addCase(register.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.status = 'authenticated';
      })
      .addCase(register.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? 'No pudimos crear la cuenta.';
      })
      .addCase(logout.fulfilled, () => ({ ...initialState, status: 'anonymous' }));
  },
});

export const { sessionChanged, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
