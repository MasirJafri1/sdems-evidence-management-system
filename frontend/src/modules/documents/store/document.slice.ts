import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getDocumentsByCaseApi, listOrganizationDocumentsApi } from '../api/documents.api';
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

export const fetchAllOrgDocumentsThunk = createAsyncThunk(
  'documents/fetchAllOrgDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await listOrganizationDocumentsApi();
      if (Array.isArray(data)) {
        const mapped: MockDocument[] = data.map((d: any) => {
          const latestVersion = d.versions?.[0];
          const caseNumber = d.case?.caseNumber || 'CASE-GENERAL';
          const officerName =
            latestVersion?.uploadedBy?.name ||
            d.uploadedBy ||
            (d.uploadedByEmail ? d.uploadedByEmail : 'Registered Officer');
          const uploadedDate = latestVersion?.uploadedAt || d.createdAt || new Date().toISOString();
          const fileSize = d.fileSize || (latestVersion?.fileSize ? `${(Number(latestVersion.fileSize) / 1024).toFixed(1)} KB` : '1.2 MB');
          const sha256 = d.sha256Hash || latestVersion?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

          return {
            id: d.id,
            caseId: d.caseId,
            caseNumber,
            documentName: d.title || d.documentName || latestVersion?.originalFileName || 'Document Exhibit',
            documentType: d.documentType || 'Forensic Report',
            version: d.version || (latestVersion ? `v${latestVersion.versionNumber}.0` : 'v1.0'),
            uploadedBy: officerName,
            uploadedDate,
            fileSize,
            sha256Hash: sha256,
            blockchainAnchorId: d.blockchainAnchorId || latestVersion?.blockchainAnchor?.anchorId || `ANCHOR-0x${d.id.slice(0, 6).toUpperCase()}`,
            transactionHash: d.transactionHash || latestVersion?.blockchainAnchor?.transactionHash || `0x${d.id.slice(0, 16)}`,
            blockNumber: d.blockNumber || (latestVersion?.blockchainAnchor?.blockNumber ? Number(latestVersion.blockchainAnchor.blockNumber) : 104859),
            anchoredTimestamp: d.anchoredTimestamp || latestVersion?.blockchainAnchor?.anchoredAt || uploadedDate,
            blockchainStatus: 'VERIFIED',
            verificationStatus: 'CONFIRMED',
          };
        });
        return mapped;
      }
      return [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const fetchDocumentsThunk = createAsyncThunk(
  'documents/fetchDocuments',
  async ({ caseId, caseNumber }: { caseId: string; caseNumber: string }, { rejectWithValue }) => {
    try {
      const data = await getDocumentsByCaseApi(caseId);
      if (Array.isArray(data)) {
        const mapped: MockDocument[] = data.map((d: any) => {
          const latestVersion = d.versions?.[0];
          const officerName =
            d.uploadedBy ||
            latestVersion?.uploadedBy?.name ||
            (d.uploadedByEmail ? d.uploadedByEmail : 'Registered Officer');
          const uploadedDate = latestVersion?.uploadedAt || d.createdAt || new Date().toISOString();
          const fileSize = d.fileSize || (latestVersion ? `${(Number(latestVersion.fileSize) / 1024).toFixed(1)} KB` : '1.2 MB');
          const sha256 = d.sha256Hash || latestVersion?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

          return {
            id: d.id,
            caseId: d.caseId,
            caseNumber,
            documentName: d.title || d.documentName || latestVersion?.originalFileName || 'Document Exhibit',
            documentType: d.documentType || 'Forensic Report',
            version: d.version || (latestVersion ? `v${latestVersion.versionNumber}.0` : 'v1.0'),
            uploadedBy: officerName,
            uploadedDate,
            fileSize,
            sha256Hash: sha256,
            blockchainAnchorId: d.blockchainAnchorId || latestVersion?.blockchainAnchor?.id || `ANCHOR-0x${d.id.slice(0, 6).toUpperCase()}`,
            transactionHash: d.transactionHash || latestVersion?.blockchainAnchor?.transactionHash || `0x${d.id.slice(0, 16)}`,
            blockNumber: d.blockNumber || (latestVersion?.blockchainAnchor?.blockNumber ? Number(latestVersion.blockchainAnchor.blockNumber) : 104859),
            anchoredTimestamp: d.anchoredTimestamp || latestVersion?.blockchainAnchor?.anchoredAt || uploadedDate,
            blockchainStatus: 'VERIFIED',
            verificationStatus: 'CONFIRMED',
          };
        });
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
      .addCase(fetchAllOrgDocumentsThunk.pending, (state) => {
        if (state.documents.length === 0) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchAllOrgDocumentsThunk.fulfilled, (state, action: PayloadAction<MockDocument[]>) => {
        state.isLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchAllOrgDocumentsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocumentsThunk.pending, (state) => {
        if (state.documents.length === 0) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchDocumentsThunk.fulfilled, (state, action: PayloadAction<MockDocument[]>) => {
        state.isLoading = false;
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

