import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
  role?: string;
  organizationId?: string | null;
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
}


export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const storedToken = localStorage.getItem('ndear_token');
const storedUser = localStorage.getItem('ndear_user');

let initialUser: User | null = storedUser ? JSON.parse(storedUser) : null;
if (initialUser && initialUser.email && initialUser.email.trim().toLowerCase() === 'superadmin@gov.in') {
  initialUser.isSuperAdmin = true;
}

const initialState: AuthState = {
  user: initialUser,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const u = { ...action.payload.user };
      if (u.email && u.email.trim().toLowerCase() === 'superadmin@gov.in') {
        u.isSuperAdmin = true;
      }
      state.user = u;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('ndear_token', action.payload.token);
      localStorage.setItem('ndear_user', JSON.stringify(u));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('ndear_token');
      localStorage.removeItem('ndear_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
