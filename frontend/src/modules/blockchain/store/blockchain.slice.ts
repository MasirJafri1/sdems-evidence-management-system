import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getBlockchainHealthApi,
  getVersionAnchorApi,
  verifyVersionApi,
  type BlockchainAnchorInfo,
  type VerificationProofResult,
} from '../api/blockchain.api';

interface BlockchainState {
  healthStatus: string | null;
  anchorInfo: BlockchainAnchorInfo | null;
  verificationResult: VerificationProofResult | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BlockchainState = {
  healthStatus: null,
  anchorInfo: null,
  verificationResult: null,
  isLoading: false,
  error: null,
};

export const fetchBlockchainHealthThunk = createAsyncThunk(
  'blockchain/health',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getBlockchainHealthApi();
      return res.status;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch blockchain health');
    }
  }
);

export const fetchVersionAnchorThunk = createAsyncThunk(
  'blockchain/anchor',
  async (versionId: string, { rejectWithValue }) => {
    try {
      return await getVersionAnchorApi(versionId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch anchor info');
    }
  }
);

export const verifyVersionThunk = createAsyncThunk(
  'blockchain/verify',
  async (versionId: string, { rejectWithValue }) => {
    try {
      return await verifyVersionApi(versionId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to verify version');
    }
  }
);

export const blockchainSlice = createSlice({
  name: 'blockchain',
  initialState,
  reducers: {
    clearBlockchainState: (state) => {
      state.anchorInfo = null;
      state.verificationResult = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Health
      .addCase(fetchBlockchainHealthThunk.fulfilled, (state, action) => {
        state.healthStatus = action.payload;
      })
      // Anchor
      .addCase(fetchVersionAnchorThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVersionAnchorThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.anchorInfo = action.payload;
      })
      .addCase(fetchVersionAnchorThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify
      .addCase(verifyVersionThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyVersionThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.verificationResult = action.payload;
      })
      .addCase(verifyVersionThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBlockchainState } = blockchainSlice.actions;
export default blockchainSlice.reducer;
