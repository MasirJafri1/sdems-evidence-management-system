import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOrganizationUsersApi, createUserApi, type UserApiRecord } from '../api/organization.api';

interface OrganizationState {
  users: UserApiRecord[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrganizationState = {
  users: [],
  isLoading: false,
  error: null,
};

export const fetchOrganizationUsersThunk = createAsyncThunk(
  'organization/fetchUsers',
  async (orgId: string, { rejectWithValue }) => {
    try {
      const users = await getOrganizationUsersApi(orgId);
      return users;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch organization users');
    }
  }
);

export const createUserThunk = createAsyncThunk(
  'organization/createUser',
  async ({ orgId, input }: { orgId: string; input: Parameters<typeof createUserApi>[1] }, { rejectWithValue }) => {
    try {
      const user = await createUserApi(orgId, input);
      return user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create user');
    }
  }
);

export const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    clearOrganizationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizationUsersThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationUsersThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchOrganizationUsersThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        state.users.push(action.payload);
      });
  },
});

export const { clearOrganizationError } = organizationSlice.actions;
export default organizationSlice.reducer;
