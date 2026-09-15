import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TransferAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer?: any;
  onAccept?: (transferId: string) => void;
  onReject?: (transferId: string, reason: string) => void;
}

export const TransferAcceptModal: React.FC<TransferAcceptModalProps> = ({
  isOpen,
  onClose,
  transfer,
  onAccept,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAccept = () => {
    if (transfer?.id) onAccept?.(transfer.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason before declining.");
      return;
    }
    if (transfer?.id) onReject?.(transfer.id, rejectionReason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accept Pending Custody Handshake" maxWidth="md">
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md space-y-1">
          <div className="font-bold text-[#17212B]">{transfer?.itemTitle || 'Evidence Item'} ({transfer?.evidenceNumber})</div>
          <div className="text-[#5B6875]">Relinquishing Officer: {transfer?.fromOfficer || 'Unknown'}</div>
          <div className="text-[#5B6875] italic">Purpose: {transfer?.reason || 'No reason provided'}</div>
        </div>

        <Input
          label="Rejection Reason (Required if declining)"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g. Seal compromised, item not matched"
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
          <Button
            type="button"
            variant="outline"
            onClick={handleReject}
            leftIcon={<XCircle className="w-4 h-4 text-[#B42318]" />}
          >
            Reject Transfer
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAccept}
            leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          >
            Accept Custody & Sign Ledger
          </Button>
        </div>
      </div>
    </Modal>
  );
};
