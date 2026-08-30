import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GitCommit, ShieldAlert } from 'lucide-react';

interface TransferInitiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (toCustodian: string, toOrg: string, reason: string) => void;
  evidenceNumber: string;
}

export const TransferInitiateModal: React.FC<TransferInitiateModalProps> = ({
  isOpen,
  onClose,
  onInitiate,
  evidenceNumber,
}) => {
  const [toCustodian, setToCustodian] = useState('Dr. Sunita Deshmukh');
  const [toOrg, setToOrg] = useState('Central Forensic Science Laboratory');
  const [reason, setReason] = useState('Transfer item for forensic lab memory dump extraction.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInitiate(toCustodian, toOrg, reason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Initiate Custody Handshake — ${evidenceNumber}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Double-sign-off required. Item will enter PENDING state until receiving custodian accepts.</span>
        </div>

        <Input label="Receiving Custodian Officer" value={toCustodian} onChange={(e) => setToCustodian(e.target.value)} required />
        <Input label="Receiving Department / Organization" value={toOrg} onChange={(e) => setToOrg(e.target.value)} required />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">Reason & Purpose of Transfer</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="p-3 bg-white border border-slate-300 rounded text-xs min-h-[80px]" required />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<GitCommit className="w-4 h-4" />}>Initiate Transfer</Button>
        </div>
      </form>
    </Modal>
  );
};
