import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { FolderPlus, RefreshCw, Sparkles } from 'lucide-react';
import { useAppSelector } from '../../../store';
import type { MockCase } from '../../../mock/cases.mock';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: MockCase) => void;
}

export const generateGlobalCaseId = (title: string, orgName: string): string => {
  const orgCode = orgName
    ? orgName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '') || 'ORG'
    : 'ORG';

  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  const titleInitials =
    titleWords.length > 0
      ? titleWords
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 6) || 'CASE'
      : 'CASE';

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeSuffix = Date.now().toString().slice(-4);
  const randomSuffix = Math.floor(100 + Math.random() * 900);

  return `${orgCode}-${titleInitials}-${dateStr}-${timeSuffix}${randomSuffix}`;
};

export const generateDepartmentRef = (title: string, orgName: string): string => {
  const orgCode = orgName
    ? orgName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '') || 'ORG'
    : 'ORG';

  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  const titleInitials =
    titleWords.length > 0
      ? titleWords
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 5) || 'CASE'
      : 'CASE';

  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${orgCode}/${titleInitials}/${year}/${randomSuffix}`;
};

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const userOrg = user?.organization?.name || user?.organizationId || 'CBI';

  const [title, setTitle] = useState('');
  const [caseType, setCaseType] = useState('');
  const [description, setDescription] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCaseNumber(generateGlobalCaseId(title, userOrg));
      setReferenceNumber(generateDepartmentRef(title, userOrg));
    }
  }, [isOpen, userOrg]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setCaseNumber(generateGlobalCaseId(newTitle, userOrg));
    setReferenceNumber(generateDepartmentRef(newTitle, userOrg));
  };

  const handleRegenerateIds = () => {
    setCaseNumber(generateGlobalCaseId(title, userOrg));
    setReferenceNumber(generateDepartmentRef(title, userOrg));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MockCase = {
      id: `case-${Date.now()}`,
      caseNumber,
      referenceNumber,
      title,
      description,
      caseType: caseType.trim() || 'General Investigation',
      status: 'Active',
      organization: userOrg,
      leadOfficer: user?.name || 'Authorized Officer',
      officerEmail: user?.email || 'officer@gov.in',
      evidenceCount: 0,
      documentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSuccess(created);
    onClose();
    // Reset inputs
    setTitle('');
    setCaseType('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize New Official Case File" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Case Title"
          placeholder="e.g. Operation Financial Trace"
          value={title}
          onChange={handleTitleChange}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Global Case ID (Auto-Generated)
              </label>
              <button
                type="button"
                onClick={handleRegenerateIds}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                title="Regenerate unique ID & Ref"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={caseNumber}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm text-slate-800 font-mono font-bold cursor-not-allowed"
              />
              <Sparkles className="w-4 h-4 text-amber-500 absolute right-3 top-2.5" />
            </div>
            <span className="text-[11px] text-slate-500">
              Unique ID generated combining Org, Title & Timestamp.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Dept Reference No (Auto-Generated)
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={referenceNumber}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm text-slate-800 font-mono font-bold cursor-not-allowed"
              />
              <Sparkles className="w-4 h-4 text-amber-500 absolute right-3 top-2.5" />
            </div>
            <span className="text-[11px] text-slate-500">
              Department ref format based on Org & Case Name.
            </span>
          </div>
        </div>

        <Input
          label="Case Type"
          placeholder="e.g. Cyber Crime, Financial Fraud, Anti-Corruption..."
          value={caseType}
          onChange={(e) => setCaseType(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 uppercase">Case Description & Scope</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 bg-white border border-slate-300 rounded text-sm min-h-[80px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            placeholder="Provide investigative background..."
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<FolderPlus className="w-4 h-4" />}>
            Initialize Case File
          </Button>
        </div>
      </form>
    </Modal>
  );
};
