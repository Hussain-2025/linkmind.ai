import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types.js";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      state.initialized = true;
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.initialized = true;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.initialized = true;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
  },
});

export const { authStart, authSuccess, authFailure, logoutSuccess, setInitialized } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
