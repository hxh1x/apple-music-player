import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { LibraryActions, type LibraryState } from "./librarySlice";
import type { RootState } from "./store";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isModalOpen: boolean;
  isLoading: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  lastSyncedAt: number | null;
  error: string | null;
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("am_auth_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: loadStoredUser(),
  token: localStorage.getItem("am_auth_token"),
  isModalOpen: false,
  isLoading: false,
  syncStatus: "idle",
  lastSyncedAt: null,
  error: null,
};

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export const registerAccount = createAsyncThunk<
  { user: AuthUser; token: string; updatedAt: number },
  { username: string; email: string; password: string },
  { state: RootState }
>("auth/register", async (creds, { getState }) => {
  const localLibrary = getState().library;
  const data = await authFetch<{
    user: AuthUser;
    token: string;
    library: Partial<LibraryState>;
    updatedAt: number;
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...creds, initialLibrary: localLibrary }),
  });
  localStorage.setItem("am_auth_token", data.token);
  localStorage.setItem("am_auth_user", JSON.stringify(data.user));
  return { user: data.user, token: data.token, updatedAt: data.updatedAt };
});

export const loginAccount = createAsyncThunk<
  { user: AuthUser; token: string; updatedAt: number },
  { identifier: string; password: string },
  { state: RootState }
>("auth/login", async (creds, { dispatch, getState }) => {
  const data = await authFetch<{
    user: AuthUser;
    token: string;
    library: Partial<LibraryState>;
    updatedAt: number;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(creds),
  });
  localStorage.setItem("am_auth_token", data.token);
  localStorage.setItem("am_auth_user", JSON.stringify(data.user));
  dispatch(LibraryActions.mergeWithCloud(data.library));
  // Push merged library back so both devices stay in sync
  const merged = getState().library;
  await authFetch<{ updatedAt: number }>(
    "/sync/library",
    { method: "PUT", body: JSON.stringify(merged) },
    data.token
  );
  return { user: data.user, token: data.token, updatedAt: Date.now() };
});

export const restoreSession = createAsyncThunk<
  { user: AuthUser; updatedAt: number } | null,
  void,
  { state: RootState }
>("auth/restore", async (_, { getState, dispatch }) => {
  const token = getState().auth.token;
  if (!token) return null;
  try {
    const data = await authFetch<{
      user: AuthUser;
      library: Partial<LibraryState>;
      updatedAt: number;
    }>("/auth/me", {}, token);
    localStorage.setItem("am_auth_user", JSON.stringify(data.user));
    dispatch(LibraryActions.hydrateFromCloud(data.library));
    return { user: data.user, updatedAt: data.updatedAt };
  } catch {
    localStorage.removeItem("am_auth_token");
    localStorage.removeItem("am_auth_user");
    return null;
  }
});

export const syncLibraryToCloud = createAsyncThunk<
  number,
  void,
  { state: RootState }
>("auth/syncPush", async (_, { getState }) => {
  const { auth, library } = getState();
  if (!auth.token) throw new Error("Not signed in");
  const data = await authFetch<{ updatedAt: number }>(
    "/sync/library",
    {
      method: "PUT",
      body: JSON.stringify(library),
    },
    auth.token
  );
  return data.updatedAt;
});

export const pullLibraryFromCloud = createAsyncThunk<
  number,
  void,
  { state: RootState }
>("auth/syncPull", async (_, { getState, dispatch }) => {
  const token = getState().auth.token;
  if (!token) throw new Error("Not signed in");
  const data = await authFetch<{
    library: Partial<LibraryState>;
    updatedAt: number;
  }>("/sync/library", {}, token);
  dispatch(LibraryActions.hydrateFromCloud(data.library));
  return data.updatedAt;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    openModal(state) {
      state.isModalOpen = true;
      state.error = null;
    },
    closeModal(state) {
      state.isModalOpen = false;
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.syncStatus = "idle";
      state.lastSyncedAt = null;
      state.error = null;
      localStorage.removeItem("am_auth_token");
      localStorage.removeItem("am_auth_user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload.updatedAt;
        state.isModalOpen = false;
      })
      .addCase(registerAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Could not create account";
      })
      .addCase(loginAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload.updatedAt;
        state.isModalOpen = false;
      })
      .addCase(loginAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Invalid login credentials";
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.syncStatus = "synced";
          state.lastSyncedAt = action.payload.updatedAt;
        } else {
          state.user = null;
          state.token = null;
        }
      })
      .addCase(syncLibraryToCloud.pending, (state) => {
        state.syncStatus = "syncing";
      })
      .addCase(syncLibraryToCloud.fulfilled, (state, action) => {
        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload;
      })
      .addCase(syncLibraryToCloud.rejected, (state) => {
        state.syncStatus = "error";
      })
      .addCase(pullLibraryFromCloud.pending, (state) => {
        state.syncStatus = "syncing";
      })
      .addCase(pullLibraryFromCloud.fulfilled, (state, action) => {
        state.syncStatus = "synced";
        state.lastSyncedAt = action.payload;
      })
      .addCase(pullLibraryFromCloud.rejected, (state) => {
        state.syncStatus = "error";
      });
  },
});

export const AuthActions = authSlice.actions;
export default authSlice.reducer;
