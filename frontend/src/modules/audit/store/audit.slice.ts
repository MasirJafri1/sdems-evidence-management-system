import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAuditHistoryApi, verifyAuditChainApi, type AuditRecordApi } from '../api/audit.api';

interface AuditState {
  auditRecords: AuditRecordApi[];
  isChainValid: boolean | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  auditRecords: [],
  isChainValid: null,
  isLoading: false,
  error: null,
};

export const fetchCaseAuditThunk = createAsyncThunk(
  'audit/fetchCaseAudit',
  async (caseId: string, { rejectWithValue }) => {
    try {
      return await getAuditHistoryApi(caseId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch case audit history');
    }
  }
);

export const verifyAuditChainThunk = createAsyncThunk(
  'audit/verifyChain',
  async (caseId: string, { rejectWithValue }) => {
    try {
      const res = await verifyAuditChainApi(caseId);
      return res.valid;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to verify audit chain');
    }
  }
);

export const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearAuditError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCaseAuditThunk
      .addCase(fetchCaseAuditThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCaseAuditThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.auditRecords = action.payload;
      })
      .addCase(fetchCaseAuditThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // verifyAuditChainThunk
      .addCase(verifyAuditChainThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyAuditChainThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isChainValid = action.payload;
      })
      .addCase(verifyAuditChainThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuditError } = auditSlice.actions;
export default auditSlice.reducer;
