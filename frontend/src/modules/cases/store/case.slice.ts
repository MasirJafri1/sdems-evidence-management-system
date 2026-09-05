import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getCasesApi, createCaseApi, type CaseApiRecord } from '../api/cases.api';
import type { CreateCaseInput } from '../schemas/case.schema';
import type { MockCase } from '../../../mock/cases.mock';

interface CaseState {
  cases: MockCase[];
  activeCase: MockCase | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CaseState = {
  cases: [],
  activeCase: null,
  isLoading: false,
  error: null,
};

export const fetchCasesThunk = createAsyncThunk(
  'cases/fetchCases',
  async (orgId: string, { rejectWithValue }) => {
    try {
      const data = await getCasesApi(orgId);
      const mapped: MockCase[] = data.map((d: CaseApiRecord) => ({
        id: d.id,
        caseNumber: d.caseNumber,
        referenceNumber: d.referenceNumber,
        title: d.title,
        description: d.description,
        caseType: d.caseType as any,
        status: d.status || 'Active',
        organization: 'Central Bureau of Investigation',
        leadOfficer: 'Senior Inspector Rajesh Sharma',
        officerEmail: 'admin@cbi.gov',
        evidenceCount: d._count?.evidence || 0,
        documentCount: d._count?.documents || 0,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
      return mapped;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch cases');
    }
  }
);

export const createCaseThunk = createAsyncThunk(
  'cases/createCase',
  async ({ orgId, input }: { orgId: string; input: CreateCaseInput }, { rejectWithValue }) => {
    try {
      const d = await createCaseApi(orgId, input);
      const newCase: MockCase = {
        id: d.id,
        caseNumber: d.caseNumber,
        referenceNumber: d.referenceNumber,
        title: d.title,
        description: d.description,
        caseType: d.caseType as any,
        status: d.status || 'Active',
        organization: 'Central Bureau of Investigation',
        leadOfficer: 'Senior Inspector Rajesh Sharma',
        officerEmail: 'admin@cbi.gov',
        evidenceCount: 0,
        documentCount: 0,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
      return newCase;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create case');
    }
  }
);

export const caseSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setActiveCase: (state, action: PayloadAction<string>) => {
      const found = state.cases.find((c) => c.id === action.payload);
      if (found) state.activeCase = found;
    },
    clearCaseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCases
      .addCase(fetchCasesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCasesThunk.fulfilled, (state, action: PayloadAction<MockCase[]>) => {
        state.isLoading = false;
        state.cases = action.payload;
        if (!state.activeCase && action.payload.length > 0) {
          state.activeCase = action.payload[0];
        }
      })
      .addCase(fetchCasesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // createCase
      .addCase(createCaseThunk.fulfilled, (state, action: PayloadAction<MockCase>) => {
        state.cases.unshift(action.payload);
        state.activeCase = action.payload;
      });
  },
});

export const { setActiveCase, clearCaseError } = caseSlice.actions;
export default caseSlice.reducer;
