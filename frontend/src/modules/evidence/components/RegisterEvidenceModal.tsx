import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useCaseList } from '../../cases/hooks/useCaseList';

interface RegisterEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    caseId: string;
    title: string;
    evidenceType: string;
    serialNumber: string;
    storageLocation: string;
  }) => void;
}

export const RegisterEvidenceModal: React.FC<RegisterEvidenceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { cases } = useCaseList();
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [title, setTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState('Mobile Device');
  const [serialNumber, setSerialNumber] = useState('');
  const [storageLocation, setStorageLocation] = useState('CFSL Vault Locker 1A');

  const activeCaseId = selectedCaseId || cases[0]?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !serialNumber || !activeCaseId) return;
    onSuccess({
      caseId: activeCaseId,
      title,
      evidenceType,
      serialNumber,
      storageLocation,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Physical Evidence Item" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">Target Case Registry</label>
          <select
            value={activeCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold"
          >
            {cases.length > 0 ? (
              cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title}
                </option>
              ))
            ) : (
              <option value="">No active cases (Initialize a case first)</option>
            )}
          </select>
        </div>

        <Input
          label="Item Description / Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Seized Samsung Galaxy S22 Work Phone"
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">Evidence Classification</label>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800"
          >
            <option value="Mobile Device">Mobile Device</option>
            <option value="Laptop">Laptop</option>
            <option value="Storage Media">Storage Media</option>
            <option value="Document">Document</option>
            <option value="CCTV Recording">CCTV Recording</option>
            <option value="Physical Item">Physical Item</option>
          </select>
        </div>

        <Input
          label="Manufacturer Serial Number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          required
          placeholder="e.g. SN-892401-X"
        />
        <Input
          label="Vault / Locker Storage Location"
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
          required
          placeholder="e.g. Vault Locker 4B"
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" disabled={!activeCaseId}>Log in Vault Ledger</Button>
        </div>
      </form>
    </Modal>
  );
};
