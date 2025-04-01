import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Role = 'Teacher' | 'Student' | 'Admin';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; role: Role }>) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.role = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
