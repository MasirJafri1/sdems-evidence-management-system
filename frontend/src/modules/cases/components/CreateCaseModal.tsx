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
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Quick Demo Fill */}
        <div className="flex items-center justify-between p-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md">
          <span className="text-[10px] font-bold text-[#5B6875] uppercase tracking-wider">⚡ Quick Demo Fill:</span>
          <button
            type="button"
            onClick={() => {
              const demoTitle = 'Offshore Cyber Extortion & Ransomware Operation';
              setTitle(demoTitle);
              setCaseType('Cyber Crime / Extortion');
              setDescription('Seized server logs, encrypted disk images, and physical NVMe drive from crime scene under Section 173 CrPC / BNSS.');
              setCaseNumber(generateGlobalCaseId(demoTitle, userOrg));
              setReferenceNumber(generateDepartmentRef(demoTitle, userOrg));
            }}
            className="px-2.5 py-1 bg-white hover:bg-[#EBF3FA] border border-[#2F6B95]/40 text-[#123B63] rounded font-bold text-xs transition-colors cursor-pointer"
          >
            ⚡ Auto-Fill Demo Case (Ransomware Investigation)
          </button>
        </div>

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
              <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">
                Global Case ID (Auto-Generated)
              </label>
              <button
                type="button"
                onClick={handleRegenerateIds}
                className="text-[11px] font-semibold text-[#2F6B95] hover:underline flex items-center gap-1 cursor-pointer"
                title="Regenerate unique ID & Ref"
              >
                <RefreshCw className="w-3 h-3 text-[#2F6B95]" /> Regenerate
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={caseNumber}
                className="w-full px-3 py-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md text-xs text-[#17212B] font-mono font-bold cursor-not-allowed"
              />
              <Sparkles className="w-4 h-4 text-[#B58B4A] absolute right-3 top-2.5" />
            </div>
            <span className="text-[11px] text-[#5B6875]">
              Unique ID generated combining Org, Title & Timestamp.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">
                Dept Reference No (Auto-Generated)
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={referenceNumber}
                className="w-full px-3 py-2 bg-[#F6F8FB] border border-[#DCE3EA] rounded-md text-xs text-[#17212B] font-mono font-bold cursor-not-allowed"
              />
              <Sparkles className="w-4 h-4 text-[#B58B4A] absolute right-3 top-2.5" />
            </div>
            <span className="text-[11px] text-[#5B6875]">
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
          <label className="text-xs font-semibold text-[#17212B] uppercase tracking-wider">Case Description & Scope</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 bg-white border border-[#DCE3EA] rounded-md text-xs min-h-[80px] text-[#17212B] focus:outline-none focus:ring-1 focus:ring-[#123B63]"
            placeholder="Provide investigative background..."
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[#DCE3EA]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<FolderPlus className="w-4 h-4" />}>
            Initialize Case File
          </Button>
        </div>
      </form>
    </Modal>
  );
};
