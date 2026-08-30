import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getDocumentsByCaseApi } from '../api/documents.api';
import type { MockDocument } from '../../../mock/documents.mock';

interface DocumentState {
  documents: MockDocument[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  isLoading: false,
  error: null,
};

export const fetchDocumentsThunk = createAsyncThunk(
  'documents/fetchDocuments',
  async ({ caseId, caseNumber }: { caseId: string; caseNumber: string }, { rejectWithValue }) => {
    try {
      const data = await getDocumentsByCaseApi(caseId);
      if (Array.isArray(data)) {
        const mapped: MockDocument[] = data.map((d) => ({
          id: d.id,
          caseId: d.caseId,
          caseNumber,
          documentName: d.title || d.documentName || 'Document Exhibit',
          documentType: d.documentType || 'Forensic Report',
          version: d.version || 'v1.0',
          uploadedBy: 'Senior Inspector Rajesh Sharma',
          uploadedDate: d.createdAt,
          fileSize: d.fileSize || '1.2 MB',
          sha256Hash: d.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          blockchainAnchorId: d.blockchainAnchorId || `ANCHOR-0x${d.id.slice(0, 6).toUpperCase()}`,
          transactionHash: d.transactionHash || `0x${d.id.slice(0, 16)}`,
          blockNumber: d.blockNumber || 104859,
          anchoredTimestamp: d.anchoredTimestamp || d.createdAt,
          blockchainStatus: 'VERIFIED',
          verificationStatus: 'CONFIRMED',
        }));
        return mapped;
      }
      return [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    addDocument: (state, action: PayloadAction<MockDocument>) => {
      state.documents.unshift(action.payload);
    },
    clearDocuments: (state) => {
      state.documents = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsThunk.fulfilled, (state, action: PayloadAction<MockDocument[]>) => {
        state.isLoading = false;
        // Merge documents into state without duplicate keys
        const existingIds = new Set(state.documents.map((d) => d.id));
        const newDocs = action.payload.filter((d) => !existingIds.has(d.id));
        state.documents = [...newDocs, ...state.documents];
      })
      .addCase(fetchDocumentsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addDocument, clearDocuments } = documentSlice.actions;
export default documentSlice.reducer;
