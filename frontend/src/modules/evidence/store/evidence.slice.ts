import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  getEvidenceListApi,
  getEvidenceByCaseApi,
  createEvidenceApi,
  getEvidenceByIdApi,
  type EvidenceApiRecord,
} from '../api/evidence.api';

interface EvidenceState {
  items: EvidenceApiRecord[];
  activeItem: EvidenceApiRecord | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EvidenceState = {
  items: [],
  activeItem: null,
  isLoading: false,
  error: null,
};

export const fetchEvidenceListThunk = createAsyncThunk(
  'evidence/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await getEvidenceListApi();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch evidence');
    }
  }
);

export const fetchEvidenceByCaseThunk = createAsyncThunk(
  'evidence/fetchByCase',
  async (caseId: string, { rejectWithValue }) => {
    try {
      return await getEvidenceByCaseApi(caseId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch evidence for case');
    }
  }
);

export const createEvidenceThunk = createAsyncThunk(
  'evidence/create',
  async (data: Parameters<typeof createEvidenceApi>[0], { rejectWithValue }) => {
    try {
      return await createEvidenceApi(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create evidence');
    }
  }
);

export const fetchEvidenceByIdThunk = createAsyncThunk(
  'evidence/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await getEvidenceByIdApi(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch evidence details');
    }
  }
);

export const evidenceSlice = createSlice({
  name: 'evidence',
  initialState,
  reducers: {
    clearEvidenceError: (state) => {
      state.error = null;
    },
    setActiveEvidence: (state, action: PayloadAction<string>) => {
      const found = state.items.find((i) => i.id === action.payload);
      if (found) state.activeItem = found;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchEvidenceListThunk
      .addCase(fetchEvidenceListThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvidenceListThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchEvidenceListThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchEvidenceByCaseThunk
      .addCase(fetchEvidenceByCaseThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEvidenceByCaseThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchEvidenceByCaseThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // createEvidenceThunk
      .addCase(createEvidenceThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.activeItem = action.payload;
      })
      // fetchEvidenceByIdThunk
      .addCase(fetchEvidenceByIdThunk.fulfilled, (state, action) => {
        state.activeItem = action.payload;
        // Also update items array if present
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      });
  },
});

export const { clearEvidenceError, setActiveEvidence } = evidenceSlice.actions;
export default evidenceSlice.reducer;
