import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type CustodyTransferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'FAILED';

export interface TransferRequest {
  id: string;
  evidenceId: string;
  evidenceNumber: string;
  fromCustodian: string;
  toCustodian: string;
  toOrganization: string;
  reason: string;
  status: CustodyTransferStatus;
  createdAt: string;
}

interface CustodyState {
  pendingTransfers: TransferRequest[];
}

const initialState: CustodyState = {
  pendingTransfers: [
    {
      id: 'trf-001',
      evidenceId: 'ev-001',
      evidenceNumber: 'EVID-2026-9041',
      fromCustodian: 'Sub-Inspector Anil Kumar',
      toCustodian: 'Senior Inspector Rajesh Sharma',
      toOrganization: 'Central Bureau of Investigation',
      reason: 'Transfer seized laptop for forensic RAM extraction lab examination.',
      status: 'PENDING',
      createdAt: '2026-08-30T10:00:00Z',
    },
  ],
};

export const custodySlice = createSlice({
  name: 'custody',
  initialState,
  reducers: {
    initiateTransfer: (state, action: PayloadAction<Omit<TransferRequest, 'id' | 'status' | 'createdAt'>>) => {
      const id = `trf-${Date.now()}`;
      state.pendingTransfers.unshift({
        ...action.payload,
        id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
    },
    updateTransferStatus: (state, action: PayloadAction<{ id: string; status: CustodyTransferStatus }>) => {
      const item = state.pendingTransfers.find((t) => t.id === action.payload.id);
      if (item) item.status = action.payload.status;
    },
  },
});

export const { initiateTransfer, updateTransferStatus } = custodySlice.actions;
export default custodySlice.reducer;
