import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TransferAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (transferId: string) => void;
  onReject?: (transferId: string) => void;
}

export const TransferAcceptModal: React.FC<TransferAcceptModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
}) => {
  const [transferId, setTransferId] = useState('trf-001');

  const handleAccept = () => {
    onAccept?.(transferId);
    onClose();
  };

  const handleReject = () => {
    onReject?.(transferId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accept Pending Custody Handshake" maxWidth="md">
      <div className="space-y-4 text-xs">
        <Input
          label="Transfer Reference / Ticket ID"
          value={transferId}
          onChange={(e) => setTransferId(e.target.value)}
          required
        />

        <div className="p-3 bg-slate-50 border rounded space-y-1">
          <div className="font-bold text-slate-900">Seized Dell Latitude Forensic Workstation</div>
          <div className="text-slate-600">Relinquishing Officer: Sub-Inspector Anil Kumar (CBI)</div>
          <div className="text-slate-500 italic">Purpose: Forensic drive extraction and hash computation</div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleReject}
            leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
          >
            Reject Transfer
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAccept}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          >
            Accept Custody & Sign Ledger
          </Button>
        </div>
      </div>
    </Modal>
  );
};
