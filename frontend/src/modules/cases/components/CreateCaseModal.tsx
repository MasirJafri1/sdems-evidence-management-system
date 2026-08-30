import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { FolderPlus } from 'lucide-react';
import type { MockCase } from '../../../mock/cases.mock';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: MockCase) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [caseNumber, setCaseNumber] = useState('CASE-2026-00994');
  const [referenceNumber, setReferenceNumber] = useState('CBI/ND/2026/7712');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caseType, setCaseType] = useState('Cyber Crime');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'CRITICAL' | 'STANDARD'>('HIGH');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MockCase = {
      id: `case-${Date.now()}`,
      caseNumber,
      referenceNumber,
      title,
      description,
      caseType,
      priority,
      status: 'Active',
      organization: 'Central Bureau of Investigation',
      leadOfficer: 'Senior Inspector Rajesh Sharma',
      officerEmail: 'r.sharma@cbi.gov.in',
      evidenceCount: 0,
      documentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSuccess(created);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize New Official Case File" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Case ID Number" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} required />
          <Input label="Dept Reference No" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} required />
        </div>

        <Input label="Case Title" placeholder="e.g. Operation Financial Trace" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Case Type</label>
            <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800">
              <option value="Cyber Crime">Cyber Crime</option>
              <option value="Financial Fraud">Financial Fraud</option>
              <option value="Judicial Exhibit">Judicial Exhibit</option>
              <option value="Forensic Examination">Forensic Examination</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 uppercase">Priority Level</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800">
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="STANDARD">STANDARD</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">Case Description & Scope</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="p-3 bg-white border border-slate-300 rounded text-sm min-h-[80px]" placeholder="Provide investigative background..." />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<FolderPlus className="w-4 h-4" />}>Initialize Case File</Button>
        </div>
      </form>
    </Modal>
  );
};
