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
  const [evidenceType, setEvidenceType] = useState('Physical Item');
  const [serialNumber, setSerialNumber] = useState('');
  const [storageLocation, setStorageLocation] = useState('CFSL Vault Locker 1A');

  // Randomize initial case selection from available cases
  React.useEffect(() => {
    if (isOpen && cases.length > 0 && !selectedCaseId) {
      const randomCase = cases[Math.floor(Math.random() * cases.length)];
      setSelectedCaseId(randomCase.id);
    }
  }, [isOpen, cases, selectedCaseId]);

  const handleRandomizeCase = () => {
    if (cases.length === 0) return;
    const filtered = cases.filter((c) => c.id !== selectedCaseId);
    const pool = filtered.length > 0 ? filtered : cases;
    const randomCase = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCaseId(randomCase.id);
  };

  const handleGenerateRandomSerial = () => {
    const randomSerial = `SN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setSerialNumber(randomSerial);
  };

  const activeCaseId = selectedCaseId || cases[0]?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !activeCaseId) return;
    const finalSerial = serialNumber.trim() || `SN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    onSuccess({
      caseId: activeCaseId,
      title,
      evidenceType,
      serialNumber: finalSerial,
      storageLocation,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Physical Evidence Item" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 uppercase">Target Case Registry</label>
            {cases.length > 1 && (
              <button
                type="button"
                onClick={handleRandomizeCase}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                🎲 Randomize Case
              </button>
            )}
          </div>
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

        {/* Quick Demo Fill */}
        <div className="flex items-center justify-between p-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md">
          <span className="text-[10px] font-bold text-[#5B6875] uppercase tracking-wider">⚡ Quick Demo Fill:</span>
          <button
            type="button"
            onClick={() => {
              setTitle('Samsung NVMe SSD 1TB (Tamper Seal #774B)');
              setEvidenceType('Solid State Storage Device');
              setSerialNumber('SN-NVME-88492-DELHI');
              setStorageLocation('CFSL Vault Locker 1A (Anti-Static Bag)');
            }}
            className="px-2.5 py-1 bg-white hover:bg-[#EBF3FA] border border-[#2F6B95]/40 text-[#123B63] rounded font-bold text-xs transition-colors cursor-pointer"
          >
            ⚡ Auto-Fill Seized SSD Hardware
          </button>
        </div>

        <Input
          label="Item Description / Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Seized Samsung Galaxy S22 Work Phone"
        />

        <Input
          label="Evidence Classification"
          value={evidenceType}
          onChange={(e) => setEvidenceType(e.target.value)}
          required
          placeholder="e.g. Mobile Device, Handgun, Document"
        />

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Manufacturer Serial Number</label>
            <button
              type="button"
              onClick={handleGenerateRandomSerial}
              className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer underline"
            >
              🎲 Generate Random SN
            </button>
          </div>
          <Input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="e.g. SN-892401-X (or leave empty to randomize)"
          />
        </div>
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
