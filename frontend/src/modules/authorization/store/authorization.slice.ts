import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { grantPermissionApi, revokePermissionApi, checkPermissionApi } from '../api/authorization.api';

interface AuthorizationState {
  permissions: Record<string, boolean>; // e.g., { 'DOCUMENT_VIEW': true }
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthorizationState = {
  permissions: {},
  isLoading: false,
  error: null,
};

export const checkPermissionThunk = createAsyncThunk(
  'authorization/checkPermission',
  async ({ caseId, permission }: { caseId: string; permission: string }, { rejectWithValue }) => {
    try {
      const res = await checkPermissionApi(caseId, permission);
      return { permission, allowed: res.allowed };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to check permission');
    }
  }
);

export const grantPermissionThunk = createAsyncThunk(
  'authorization/grantPermission',
  async ({ caseId, userId, permissionId, effect }: { caseId: string; userId: string; permissionId: string; effect: 'GRANT' | 'DENY' }, { rejectWithValue }) => {
    try {
      return await grantPermissionApi(caseId, userId, permissionId, effect);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to grant permission');
    }
  }
);

export const revokePermissionThunk = createAsyncThunk(
  'authorization/revokePermission',
  async ({ caseId, userId, permissionId }: { caseId: string; userId: string; permissionId: string }, { rejectWithValue }) => {
    try {
      return await revokePermissionApi(caseId, userId, permissionId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to revoke permission');
    }
  }
);

export const authorizationSlice = createSlice({
  name: 'authorization',
  initialState,
  reducers: {
    clearAuthorizationState: (state) => {
      state.permissions = {};
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // checkPermissionThunk
      .addCase(checkPermissionThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkPermissionThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissions[action.payload.permission] = action.payload.allowed;
      })
      .addCase(checkPermissionThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthorizationState } = authorizationSlice.actions;
export default authorizationSlice.reducer;
