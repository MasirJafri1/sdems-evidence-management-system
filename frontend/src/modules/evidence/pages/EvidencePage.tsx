import React, { useState } from 'react';
import { EvidenceTable } from '../components/EvidenceTable';
import { RegisterEvidenceModal } from '../components/RegisterEvidenceModal';
import { useEvidence } from '../hooks/useEvidence';
import { Button } from '../../../components/ui/Button';
import { PackagePlus, Search } from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const { evidenceList, createEvidence } = useEvidence();
  const [search, setSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const filteredEvidence = evidenceList.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.evidenceNumber.toLowerCase().includes(search.toLowerCase()) ||
    e.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
            Physical Evidence Registry
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Tamper-evident physical property log, vault locations, and active chain of custody tracking.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsRegisterModalOpen(true)}
          leftIcon={<PackagePlus className="w-4 h-4" />}
        >
          Register Physical Item
        </Button>
      </div>

      <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter physical evidence by title, serial number, or item ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-slate-900 w-full focus:outline-none"
        />
      </div>

      <EvidenceTable evidence={filteredEvidence} />

      <RegisterEvidenceModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={async (data) => {
          await createEvidence(data);
        }}
      />
    </div>
  );
};
